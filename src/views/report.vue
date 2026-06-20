<script setup lang="ts">
// 体检报告 AI 解读 · 模拟上传 + 分层解读 + ECharts 趋势 + 语音朗读
import { computed, ref } from 'vue'
import * as echarts from 'echarts'
import { useReportStore } from '@/stores/feature'
import { DEFAULT_REPORTS } from '@/mock/dataset'
import { speak } from '@/utils/speech'
import { ElMessage } from 'element-plus'
import { genId, todayStr } from '@/utils/storage'
import type { HealthReport } from '@/types'

const store = useReportStore()
const selectedId = ref(store.sortedList[0]?.id)
const selected = computed(() => store.list.find(r => r.id === selectedId.value))
const abnormalItems = computed(() => selected.value?.items.filter(i => i.status !== 'normal') || [])
const normalItems = computed(() => selected.value?.items.filter(i => i.status === 'normal') || [])

// 模拟上传
const showUpload = ref(false)
const mockImage = ref('')
function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.[0]) return
  const reader = new FileReader()
  reader.onload = (ev) => { mockImage.value = ev.target?.result as string }
  reader.readAsDataURL(input.files[0])
}
const uploading = ref(false)
function confirmMockUpload() {
  if (!mockImage.value) {
    ElMessage.warning('请先选择一张报告照片')
    return
  }
  uploading.value = true
  setTimeout(() => {
    const r: HealthReport = {
      ...DEFAULT_REPORTS[0],
      id: genId('report'),
      title: '上传的体检报告(' + todayStr() + ')',
      date: todayStr(),
      createdAt: new Date().toISOString()
    }
    store.addReport(r)
    selectedId.value = r.id
    uploading.value = false
    showUpload.value = false
    mockImage.value = ''
    ElMessage.success('✅ 体检报告已 AI 解读完成')
  }, 2000)
}

// 语音朗读完整解读
const reading = ref(false)
function speakAll() {
  reading.value = true
  const parts: string[] = []
  parts.push(`这是${selected.value?.title}，共${selected.value?.items.length}项检查指标。`)
  if (abnormalItems.value.length) {
    parts.push(`发现${abnormalItems.value.length}项异常，重点关注：`)
    abnormalItems.value.forEach(i => {
      parts.push(`${i.name}：当前值 ${i.value} ${i.unit}，参考 ${i.reference}。${i.explain} ${i.advice}`)
    })
  }
  parts.push(`其余${normalItems.value.length}项指标正常，整体状态良好。${selected.value?.summary}`)
  speak(parts.join(' '), { onEnd: () => reading.value = false })
}

// 趋势图
const trendRef = ref<HTMLDivElement>()
function renderTrend() {
  if (!trendRef.value || !selected.value) return
  const items = selected.value.items
  const data = items.filter(i => ['空腹血糖(GLU)', '总胆固醇(TC)', '低密度脂蛋白(LDL-C)', '甘油三酯(TG)', '收缩压'].includes(i.name))
  if (!data.length) return
  const chart = echarts.init(trendRef.value)
  chart.setOption({
    title: { text: '关键指标数值对比', left: 'center', textStyle: { fontSize: 18, fontWeight: 600 } },
    tooltip: { trigger: 'axis' },
    grid: { top: 60, right: 40, bottom: 60, left: 60 },
    xAxis: { type: 'category', data: data.map(d => d.name.split('(')[0]), axisLabel: { fontSize: 14 } },
    yAxis: { type: 'value', axisLabel: { fontSize: 14 } },
    series: [
      {
        type: 'bar',
        data: data.map(d => ({
          value: parseFloat(d.value),
          itemStyle: { color: d.status === 'high' ? '#F5222D' : '#52C41A', borderRadius: [8, 8, 0, 0] }
        })),
        barWidth: 40,
        label: { show: true, position: 'top', fontSize: 14, fontWeight: 600 }
      }
    ]
  })
}
// 切报告时重新渲染
import { watch, onMounted, nextTick } from 'vue'
watch([() => selected.value, trendRef], async () => {
  await nextTick()
  renderTrend()
}, { immediate: true })
onMounted(() => nextTick(renderTrend))
</script>

<template>
  <!-- 顶部操作区 -->
  <div class="glass-card" style="padding: 24px; margin-bottom: 24px;">
    <div class="flex-between" style="gap: 20px; flex-wrap: wrap;">
      <div>
        <div class="section-title" style="margin: 0; font-size: 24px;">🩺 体检报告 AI 解读</div>
        <div class="muted-text" style="margin-top: 6px; font-size: 17px;">
          已存档 {{ store.list.length }} 份报告，当前解读：{{ selected?.title || '请选择' }}
        </div>
      </div>
      <div class="flex" style="gap: 10px;">
        <el-button size="large" round :icon="reading ? 'VideoPause' : 'Promotion'" type="success" @click="speakAll()">
          {{ reading ? '朗读中…' : '🔊 全文语音朗读' }}
        </el-button>
        <el-button size="large" type="primary" round icon="Upload" @click="showUpload = true">上传新报告</el-button>
      </div>
    </div>
    <!-- 历史报告切换 -->
    <div v-if="store.list.length > 1" style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
      <el-tag
        v-for="r in store.sortedList"
        :key="r.id"
        :type="r.id === selectedId ? 'primary' : 'info'"
        size="large"
        round
        style="font-size: 17px; padding: 8px 16px; cursor: pointer;"
        @click="selectedId = r.id">
        {{ r.title }} · {{ r.date }}
      </el-tag>
    </div>
  </div>

  <!-- AI 总结卡片 -->
  <div v-if="selected" class="glass-card" style="background: linear-gradient(135deg, rgba(22,119,255,0.12), rgba(82,196,26,0.08)); padding: 28px; margin-bottom: 24px;">
    <div class="flex-between" style="flex-wrap: wrap; gap: 16px; margin-bottom: 16px;">
      <div style="font-size: 24px; font-weight: 700;">
        <span class="ai-tag" style="font-size: 18px;">AI 整体结论</span>
        <span style="margin-left: 12px;">{{ selected.title }}</span>
      </div>
      <div class="muted-text" style="font-size: 17px;">{{ selected.hospital }} · {{ selected.date }}</div>
    </div>
    <div class="grid-4" style="margin-bottom: 18px;">
      <div class="glass-card" style="padding: 18px; text-align: center;">
        <div class="muted-text" style="font-size: 15px;">总指标数</div>
        <div style="font-size: 32px; font-weight: 700; margin-top: 6px;">{{ selected.items.length }}</div>
      </div>
      <div class="glass-card-success" style="padding: 18px; text-align: center;">
        <div class="muted-text" style="font-size: 15px;">正常</div>
        <div style="font-size: 32px; font-weight: 700; color: var(--color-success); margin-top: 6px;">{{ normalItems.length }}</div>
      </div>
      <div class="glass-card-danger" style="padding: 18px; text-align: center;">
        <div class="muted-text" style="font-size: 15px;">异常</div>
        <div style="font-size: 32px; font-weight: 700; color: var(--color-danger); margin-top: 6px;">{{ abnormalItems.length }}</div>
      </div>
      <div class="glass-card-warning" style="padding: 18px; text-align: center;">
        <div class="muted-text" style="font-size: 15px;">关注项</div>
        <div style="font-size: 32px; font-weight: 700; color: var(--color-warning); margin-top: 6px;">{{ abnormalItems.length >= 3 ? '⚠' : 'OK' }}</div>
      </div>
    </div>
    <div style="font-size: 18px; line-height: 2; color: var(--color-text-secondary);">{{ selected.summary }}</div>
    <div style="margin-top: 18px;"><span class="ai-tag">AI 智能分析生成</span></div>
  </div>

  <!-- 异常指标详情 -->
  <div v-if="selected && abnormalItems.length" class="glass-card" style="padding: 28px; margin-bottom: 24px;">
    <div class="section-title" style="margin-bottom: 18px;">
      <span style="color: var(--color-danger);">⚠</span> 异常指标详细解读（{{ abnormalItems.length }} 项）
    </div>
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <div v-for="item in abnormalItems" :key="item.name" class="glass-card-danger" style="padding: 20px 24px;">
        <div class="flex-between" style="flex-wrap: wrap; gap: 16px;">
          <div style="flex: 1;">
            <div style="font-size: 22px; font-weight: 600; margin-bottom: 8px;">
              {{ item.name }}
              <span class="badge badge-danger" style="margin-left: 10px; font-size: 14px;">{{ item.category }}</span>
            </div>
            <div style="font-size: 18px; line-height: 1.8;">
              当前值：<b style="color: var(--color-danger); font-size: 22px;">{{ item.value }} {{ item.unit }}</b>
              <span class="muted-text" style="margin-left: 16px;">参考范围：{{ item.reference }} {{ item.unit }}</span>
            </div>
          </div>
        </div>
        <div style="margin-top: 14px; font-size: 17px; line-height: 2;">
          <div><b>🧐 通俗解读：</b>{{ item.explain }}</div>
          <div><b>💡 居家调理建议：</b>{{ item.advice }}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- 正常指标 -->
  <div v-if="selected" class="glass-card" style="padding: 28px; margin-bottom: 24px;">
    <div class="section-title" style="margin-bottom: 18px;">✅ 正常指标（{{ normalItems.length }} 项）</div>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px;">
      <div v-for="item in normalItems" :key="item.name" class="glass-card-success" style="padding: 14px 18px;">
        <div style="font-size: 17px; font-weight: 600;">{{ item.name }}</div>
        <div class="muted-text" style="font-size: 15px;">{{ item.value }} {{ item.unit }} · 参考 {{ item.reference }}</div>
      </div>
    </div>
  </div>

  <!-- 趋势图 -->
  <div v-if="selected" class="glass-card" style="padding: 28px;">
    <div class="section-title" style="margin-bottom: 18px;">📊 关键指标数值对比图</div>
    <div ref="trendRef" style="width: 100%; height: 360px;"></div>
    <div style="margin-top: 16px;">
      <span class="ai-tag">AI 智能分析生成</span>
      <span class="muted-text" style="margin-left: 10px; font-size: 15px;">· 红色柱代表超出正常范围，绿色柱代表在正常范围内。</span>
    </div>
  </div>

  <!-- 上传弹窗 -->
  <el-dialog v-model="showUpload" title="上传体检报告" width="560px">
    <div class="muted-text" style="font-size: 17px; margin-bottom: 12px;">
      💡 初赛演示模式：系统模拟 OCR 解析体检单，内置完整指标数据。复赛将接入真实 OCR 能力。
    </div>
    <el-upload :auto-upload="false" :show-file-list="false" accept="image/*" :on-change="onFile">
      <div class="glass-card" style="padding: 40px; text-align: center; cursor: pointer;">
        <img v-if="mockImage" :src="mockImage" style="max-height: 180px; margin-bottom: 12px;" />
        <div v-else style="font-size: 48px;">🩺</div>
        <div style="font-size: 18px; font-weight: 600; margin-top: 8px;">点击上传体检单照片</div>
        <div class="muted-text" style="font-size: 15px; margin-top: 4px;">JPG / PNG 均可</div>
      </div>
    </el-upload>
    <template #footer>
      <el-button size="large" @click="showUpload = false">取消</el-button>
      <el-button size="large" type="primary" :loading="uploading" @click="confirmMockUpload()">
        {{ uploading ? 'AI 解析中…' : '开始 AI 解析' }}
      </el-button>
    </template>
  </el-dialog>
</template>
