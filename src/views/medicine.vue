<script setup lang="ts">
// 服药管家 · 增删药品 + 今日待服 + 超时提醒 + 用药冲突校验
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useHealthStore } from '@/stores/health'
import { COMMON_MEDICINES, MEDICINE_CONFLICTS } from '@/mock/dataset'
import { nowHM, todayStr } from '@/utils/storage'
import { speak } from '@/utils/speech'

const health = useHealthStore()
onMounted(() => health.checkOverdue())

// —— 表单 ——
const showAdd = ref(false)
const form = ref({
  name: '', category: '', dosage: '',
  frequency: '每日1次', times: ['08:00'] as string[],
  needAfterMeal: true, image: '' as string
})
const categories = ['降压药', '降糖药', '调脂药', '抗凝药', '胃药', '补钙', '维生素', '其他']

function pickCommon(name: string) {
  const m = COMMON_MEDICINES.find(c => c.name === name)
  if (m) {
    form.value.name = m.name
    form.value.category = m.category
    form.value.dosage = m.dosage
    form.value.frequency = m.frequency
  }
}

function previewMedicine() {
  showAdd.value = true
}

function addTime() {
  form.value.times.push('12:00')
}
function removeTime(i: number) {
  if (form.value.times.length <= 1) return
  form.value.times.splice(i, 1)
}

function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.[0]) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    form.value.image = ev.target?.result as string
  }
  reader.readAsDataURL(input.files[0])
}

// —— 冲突实时检测 ——
const realtimeConflict = computed(() => {
  const tips: string[] = []
  health.medicines.forEach(exist => {
    MEDICINE_CONFLICTS.forEach(rule => {
      if ((rule.a === exist.name && rule.b === form.value.name) ||
          (rule.b === exist.name && rule.a === form.value.name)) {
        tips.push(`与「${exist.name}」冲突：${rule.tip}`)
      }
    })
  })
  return tips
})

function submitAdd() {
  if (!form.value.name.trim()) {
    ElMessage.warning('请输入药品名称')
    return
  }
  if (!form.value.times.length) {
    ElMessage.warning('请至少添加一个服药时间')
    return
  }
  health.addMedicine({
    name: form.value.name,
    category: form.value.category || '其他',
    dosage: form.value.dosage,
    frequency: form.value.frequency,
    times: [...form.value.times],
    needAfterMeal: form.value.needAfterMeal,
    image: form.value.image || undefined
  })
  ElMessage.success('已加入用药计划，今日待服已同步提醒')
  form.value = { name: '', category: '', dosage: '', frequency: '每日1次', times: ['08:00'], needAfterMeal: true, image: '' }
  showAdd.value = false
}

function removeMed(id: string) {
  ElMessageBox.confirm('确定要删除该药品？将同时取消今日未完成的待服。', '提示', {
    type: 'warning', confirmButtonText: '确定删除', cancelButtonText: '取消'
  }).then(() => {
    health.removeMedicine(id)
    ElMessage.success('已删除')
  }).catch(() => {})
}

function markDone(logId: string) {
  health.markLogDone(logId)
  ElMessage.success('✅ 已记录完成时间')
}

function remind(logId: string, medName: string, planTime: string) {
  speak(`现在是 ${nowHM()}，提醒您 ${planTime} 服用 ${medName}，${health.medicines.find(m => m.name === medName)?.needAfterMeal ? '请饭后服用。' : ''}`)
}

// —— 历史台账分页 ——
const historyPage = ref(1)
const pageSize = 10
const historyAll = computed(() => {
  return [...health.logs].sort((a, b) => (b.date + b.planTime).localeCompare(a.date + a.planTime))
})
const historyShown = computed(() => historyAll.value.slice((historyPage.value - 1) * pageSize, historyPage.value * pageSize))
</script>

<template>
  <!-- 新增药品入口 -->
  <div class="glass-card" style="padding: 28px; margin-bottom: 24px;">
    <div class="flex-between" style="gap: 16px; flex-wrap: wrap;">
      <div>
        <div class="section-title" style="margin: 0; font-size: 24px;">💊 我的用药计划</div>
        <div class="muted-text" style="margin-top: 6px; font-size: 17px;">
          当前配置 {{ health.medicines.length }} 种药品，今日共 {{ health.todayLogs.length }} 次待服，完成率 {{ health.todayDoneRate }}
        </div>
      </div>
      <el-button type="primary" size="large" round icon="Plus" @click="previewMedicine()">新增药品</el-button>
    </div>

    <!-- 已配置药品列表 -->
    <div v-if="health.medicines.length" style="margin-top: 24px; display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
      <div v-for="m in health.medicines" :key="m.id" class="glass-card" style="padding: 20px; position: relative;">
        <div class="flex" style="gap: 14px;">
          <div style="width: 68px; height: 68px; border-radius: 14px; background: linear-gradient(135deg,#E6F4FF,#F0F9FF); display: flex; align-items: center; justify-content: center; font-size: 32px; overflow: hidden; flex-shrink: 0;">
            <img v-if="m.image" :src="m.image" style="width: 100%; height: 100%; object-fit: cover;" />
            <span v-else>💊</span>
          </div>
          <div style="flex: 1;">
            <div style="font-size: 20px; font-weight: 600;">{{ m.name }}</div>
            <div class="muted-text" style="font-size: 15px; margin-top: 4px;">{{ m.dosage }} · {{ m.frequency }}</div>
            <div class="badge badge-primary" style="margin-top: 6px; display: inline-block;">{{ m.category }}</div>
            <span v-if="m.needAfterMeal" class="badge badge-warning" style="margin-top: 6px; margin-left: 6px;">饭后</span>
          </div>
        </div>
        <div class="muted-text" style="margin-top: 12px; font-size: 15px;">⏰ 每日：{{ m.times.join(' · ') }}</div>
        <div v-if="m.conflictTips" class="glass-card-danger" style="margin-top: 12px; padding: 12px 14px; font-size: 15px; color: var(--color-danger);">
          ⚠ {{ m.conflictTips }}
        </div>
        <el-button type="danger" link size="large" style="position: absolute; right: 14px; top: 14px;" @click="removeMed(m.id)">删除</el-button>
      </div>
    </div>
    <div v-else class="glass-card-success" style="margin-top: 20px; text-align: center; padding: 28px;">
      暂无药品配置，点击右上角「新增药品」开始。
    </div>
  </div>

  <!-- 今日待服 -->
  <div class="glass-card" style="padding: 28px; margin-bottom: 24px;">
    <div class="section-title" style="margin-bottom: 18px;">📅 今日待服 ({{ todayStr() }})</div>
    <div v-if="!health.todayLogs.length" class="glass-card-success" style="text-align: center; padding: 28px;">
      今日无用药计划，祝您身体健康！
    </div>
    <div v-else style="display: flex; flex-direction: column; gap: 14px;">
      <div
        v-for="log in health.todayLogs"
        :key="log.id"
        :class="log.status === 'done' ? 'glass-card-success' : log.status === 'overdue' ? 'glass-card-danger' : 'glass-card'"
        style="padding: 20px 24px;">
        <div class="flex-between" style="gap: 12px; flex-wrap: wrap;">
          <div style="flex: 1;">
            <div style="font-size: 22px; font-weight: 600; display: flex; align-items: center; gap: 12px;">
              {{ log.medicineName }}
              <span v-if="log.status === 'done'" class="badge badge-success">已完成</span>
              <span v-else-if="log.status === 'overdue'" class="badge badge-danger">超时未服</span>
              <span v-else class="badge badge-primary">待服用</span>
            </div>
            <div class="muted-text" style="margin-top: 6px; font-size: 17px;">
              计划时间 {{ log.planTime }}，<span v-if="log.status==='done'">实际完成 {{ log.takenTime }}</span>
            </div>
          </div>
          <div class="flex" style="gap: 10px; flex-wrap: wrap;">
            <el-button round size="large" @click="remind(log.id, log.medicineName, log.planTime)">🔊 语音提醒</el-button>
            <el-button
              v-if="log.status !== 'done'"
              type="primary"
              size="large"
              round
              @click="markDone(log.id)">
              ✅ 我已服用
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 历史台账 -->
  <div class="glass-card" style="padding: 28px;">
    <div class="section-title" style="margin-bottom: 18px;">📜 用药历史台账</div>
    <el-table :data="historyShown" :header-cell-style="{ background: 'rgba(22,119,255,0.08)', color: '#1F2937', fontSize: '18px', fontWeight: 600 }" style="font-size: 17px;">
      <el-table-column prop="date" label="日期" width="140" />
      <el-table-column prop="medicineName" label="药品" />
      <el-table-column prop="planTime" label="计划时间" width="130" />
      <el-table-column prop="takenTime" label="完成时间" width="130" />
      <el-table-column label="状态" width="130">
        <template #default="{ row }">
          <span v-if="row.status === 'done'" class="badge badge-success">已完成</span>
          <span v-else-if="row.status === 'overdue'" class="badge badge-danger">超时</span>
          <span v-else class="badge badge-primary">待服</span>
        </template>
      </el-table-column>
    </el-table>
    <div style="margin-top: 16px; text-align: center;">
      <el-pagination
        v-model:current-page="historyPage"
        :page-size="pageSize"
        :total="historyAll.length"
        layout="prev, pager, next"
        background />
    </div>
  </div>

  <!-- 新增药品弹窗 -->
  <el-dialog v-model="showAdd" title="💊 新增用药" width="680px" :close-on-click-modal="false">
    <div class="flex" style="gap: 8px; flex-wrap: wrap; margin-bottom: 16px;">
      <span class="muted-text" style="font-size: 16px;">快速选择常用药：</span>
      <el-button v-for="m in COMMON_MEDICINES" :key="m.name" size="large" round @click="pickCommon(m.name)">{{ m.name }}</el-button>
    </div>
    <el-form label-position="top" style="font-size: 18px;">
      <el-form-item label="药品名称" style="font-size: 20px;">
        <el-input v-model="form.name" size="large" placeholder="如：氨氯地平片" style="font-size: 18px;" />
      </el-form-item>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="类别">
            <el-select v-model="form.category" size="large" placeholder="选择类别" style="width: 100%;">
              <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="用量">
            <el-input v-model="form.dosage" size="large" placeholder="如：1片(5mg)" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="频率">
            <el-select v-model="form.frequency" size="large" style="width: 100%;">
              <el-option label="每日1次" value="每日1次" />
              <el-option label="每日2次" value="每日2次" />
              <el-option label="每日3次" value="每日3次" />
              <el-option label="每晚1次" value="每晚1次" />
              <el-option label="按需服用" value="按需服用" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="每日时间点">
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div v-for="(t, i) in form.times" :key="i" class="flex" style="gap: 10px;">
            <el-time-picker v-model="form.times[i]" format="HH:mm" value-format="HH:mm" placeholder="选择时间" size="large" style="width: 220px;" />
            <el-button type="danger" link size="large" @click="removeTime(i)">删除</el-button>
          </div>
          <el-button size="large" round style="width: max-content;" @click="addTime()">➕ 再加一个时间</el-button>
        </div>
      </el-form-item>
      <el-form-item>
        <el-checkbox v-model="form.needAfterMeal" size="large" label="饭后服用(空腹刺激胃的药物请勾选)" />
      </el-form-item>
      <el-form-item label="药盒照片(可选)">
        <el-upload :auto-upload="false" :show-file-list="false" accept="image/*" :on-change="onFile">
          <div class="glass-card" style="padding: 24px; text-align: center; width: 240px; cursor: pointer;">
            <img v-if="form.image" :src="form.image" style="max-height: 120px; margin-bottom: 8px;" />
            <div v-else style="font-size: 40px;">📷</div>
            <div class="muted-text" style="font-size: 15px; margin-top: 4px;">点击上传药盒照片</div>
          </div>
        </el-upload>
      </el-form-item>
      <!-- 实时冲突提醒 -->
      <div v-if="realtimeConflict.length">
        <div class="glass-card-danger" style="padding: 14px 18px;">
          <div style="font-weight: 600; color: var(--color-danger); margin-bottom: 8px; font-size: 18px;">⚠ 用药冲突风险提醒</div>
          <div v-for="(t, i) in realtimeConflict" :key="i" style="font-size: 16px; color: var(--color-text-secondary); line-height: 1.8;">• {{ t }}</div>
        </div>
      </div>
    </el-form>
    <template #footer>
      <el-button size="large" @click="showAdd = false">取消</el-button>
      <el-button type="primary" size="large" @click="submitAdd()">确认加入用药计划</el-button>
    </template>
  </el-dialog>
</template>
