<script setup lang="ts">
// 子女关怀模拟面板 · 账号绑定流程 + 可视化数据 + 高危推送模拟
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { useChildStore } from '@/stores/feature'
import { useHealthStore } from '@/stores/health'
import { useVitalStore } from '@/stores/vital'
import { onMounted, nextTick } from 'vue'

const child = useChildStore()
const health = useHealthStore()
const vital = useVitalStore()

// —— 绑定流程 ——
const step = ref(child.bound ? 3 : 1)
const nickname = ref('')
const phone = ref('')
function bindStep1() {
  if (!nickname.value.trim()) return ElMessage.warning('请输入您的称呼')
  if (!phone.value.trim()) return ElMessage.warning('请输入手机号（模拟）')
  step.value = 2
}
function bindStep2() {
  child.bind({ nickname: nickname.value, phone: phone.value })
  step.value = 3
  ElMessage.success('✅ 绑定成功，已进入子女关怀面板')
}
function unbind() {
  child.unbind()
  nickname.value = ''
  phone.value = ''
  step.value = 1
}

// —— 最近 7 天体征趋势 ——
const trendRef = ref<HTMLDivElement>()
function renderTrend() {
  if (!trendRef.value) return
  const bpList = [...vital.bloodPressureList].slice(-7)
  const chart = echarts.init(trendRef.value)
  chart.setOption({
    title: { text: '父母近 7 天血压趋势', left: 'center', textStyle: { fontSize: 18, fontWeight: 600 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['收缩压', '舒张压'], top: 30 },
    grid: { top: 80, bottom: 40, left: 60, right: 40 },
    xAxis: { type: 'category', data: bpList.map(d => d.date.slice(5)), axisLabel: { fontSize: 13 } },
    yAxis: { type: 'value', min: 60, axisLabel: { fontSize: 13 } },
    series: [
      {
        name: '收缩压', type: 'line', smooth: true, symbolSize: 10,
        data: bpList.map(d => ({
          value: d.systolic,
          itemStyle: { color: d.abnormal ? '#F5222D' : '#1677FF' }
        })),
        itemStyle: { color: '#1677FF' }, lineStyle: { width: 3 }
      },
      {
        name: '舒张压', type: 'line', smooth: true, symbolSize: 10,
        data: bpList.map(d => d.diastolic),
        itemStyle: { color: '#52C41A' }, lineStyle: { width: 3 }
      }
    ]
  })
  window.addEventListener('resize', () => chart.resize())
}
onMounted(() => nextTick(renderTrend))
onMounted(() => {
  nextTick(renderTrend)
})

// —— 模拟高危推送 ——
const showPush = ref(false)
function triggerPush() {
  showPush.value = true
}
</script>

<template>
  <!-- 未绑定流程 -->
  <template v-if="step !== 3">
    <div class="glass-card" style="padding: 40px; max-width: 680px; margin: 0 auto;">
      <div class="section-title" style="text-align: center; font-size: 28px; margin-bottom: 10px;">👨‍👩‍👧 子女关怀账号</div>
      <div class="muted-text" style="text-align: center; font-size: 17px; margin-bottom: 28px;">
        第 {{ step }} / 2 步：绑定后可查看父母健康数据，并在异常时收到关怀提醒
      </div>

      <div v-if="step === 1">
        <el-form label-position="top" style="font-size: 18px;">
          <el-form-item label="您的称呼（如：大女儿/儿子）">
            <el-input v-model="nickname" size="large" placeholder="请输入您的称呼" />
          </el-form-item>
          <el-form-item label="手机号（仅本地保存，模拟通知使用）">
            <el-input v-model="phone" size="large" placeholder="请输入手机号" />
          </el-form-item>
        </el-form>
        <div style="text-align: center; margin-top: 18px;">
          <el-button size="large" type="primary" round style="padding: 14px 32px; font-size: 19px;" @click="bindStep1()">下一步</el-button>
        </div>
      </div>

      <div v-else>
        <div class="glass-card-success" style="padding: 28px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
          <div style="font-size: 22px; font-weight: 600; margin-bottom: 8px;">即将绑定父母端</div>
          <div class="muted-text" style="font-size: 17px;">称呼：{{ nickname }} · 手机：{{ phone }}</div>
          <div style="font-size: 17px; color: var(--color-text-secondary); line-height: 2; margin-top: 16px;">
            绑定后您可以：<br>
            · 看到父母每天的用药完成情况<br>
            · 查看近期血压、血糖、心率趋势图<br>
            · 系统检测到异常时自动推送关怀提醒
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px;">
          <el-button size="large" round @click="step = 1">返回修改</el-button>
          <el-button size="large" type="primary" round style="padding: 14px 32px; font-size: 19px; margin-left: 12px;" @click="bindStep2()">确认绑定</el-button>
        </div>
      </div>
    </div>
  </template>

  <!-- 已绑定子女关怀面板 -->
  <template v-else>
    <!-- 头部信息 -->
    <div class="glass-card" style="padding: 28px; margin-bottom: 24px;">
      <div class="flex-between" style="flex-wrap: wrap; gap: 16px;">
        <div>
          <div class="section-title" style="margin: 0; font-size: 24px;">👨‍👩‍👧 {{ child.bound.nickname }} 的关怀面板</div>
          <div class="muted-text" style="margin-top: 6px; font-size: 17px;">
            账号：{{ child.bound.phone }} · 绑定时间：{{ child.bound.boundAt }}
          </div>
        </div>
        <div class="flex" style="gap: 10px;">
          <el-button size="large" round type="danger" @click="triggerPush()">⚠ 模拟一次高危推送</el-button>
          <el-button size="large" round @click="unbind()">解除绑定</el-button>
        </div>
      </div>
    </div>

    <!-- 核心指标卡 -->
    <div class="grid-4" style="margin-bottom: 24px;">
      <div class="glass-card-success" style="padding: 20px; text-align: center;">
        <div class="muted-text" style="font-size: 15px;">今日用药完成率</div>
        <div style="font-size: 40px; font-weight: 700; color: var(--color-success); margin: 6px 0;">{{ health.todayDoneRate }}</div>
        <div class="muted-text" style="font-size: 14px;">{{ health.todayLogs.filter(l => l.status==='done').length }} / {{ health.todayLogs.length }} 次</div>
      </div>
      <div class="glass-card" style="padding: 20px; text-align: center;">
        <div class="muted-text" style="font-size: 15px;">最近一次血压</div>
        <div style="font-size: 36px; font-weight: 700; color: var(--color-primary); margin: 6px 0;">
          {{ vital.latest.bp?.systolic || '--' }}/{{ vital.latest.bp?.diastolic || '--' }}
        </div>
        <span v-if="vital.latest.bp?.abnormal" class="badge badge-danger" style="font-size: 13px;">⚠ 偏高</span>
        <span v-else-if="vital.latest.bp" class="badge badge-success" style="font-size: 13px;">正常</span>
      </div>
      <div class="glass-card" style="padding: 20px; text-align: center;">
        <div class="muted-text" style="font-size: 15px;">最近一次血糖</div>
        <div style="font-size: 36px; font-weight: 700; color: var(--color-warning); margin: 6px 0;">{{ vital.latest.bs?.sugar || '--' }}</div>
        <span v-if="vital.latest.bs?.abnormal" class="badge badge-danger" style="font-size: 13px;">⚠ 偏高</span>
        <span v-else-if="vital.latest.bs" class="badge badge-success" style="font-size: 13px;">正常</span>
      </div>
      <div class="glass-card-warning" style="padding: 20px; text-align: center;">
        <div class="muted-text" style="font-size: 15px;">历史异常次数</div>
        <div style="font-size: 40px; font-weight: 700; color: var(--color-warning); margin: 6px 0;">{{ vital.abnormalCount }}</div>
        <div class="muted-text" style="font-size: 14px;">全部历史记录</div>
      </div>
    </div>

    <!-- 趋势图 + 消息 -->
    <div class="grid-2" style="margin-bottom: 24px;">
      <div class="glass-card" style="padding: 24px;">
        <div ref="trendRef" style="width: 100%; height: 340px;"></div>
        <div style="margin-top: 14px;"><span class="ai-tag">AI 智能分析生成</span></div>
      </div>
      <div class="glass-card" style="padding: 24px;">
        <div class="section-title" style="margin-bottom: 14px;">📬 关怀提醒消息</div>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div
            v-for="(msg, i) in child.messages"
            :key="i"
            :class="msg.level === 'danger' ? 'glass-card-danger' : msg.level === 'warn' ? 'glass-card-warning' : 'glass-card'"
            style="padding: 16px 20px;">
            <div class="flex-between" style="flex-wrap: wrap; gap: 10px;">
              <div style="font-size: 18px; font-weight: 600;">{{ msg.title }}</div>
              <div class="muted-text" style="font-size: 14px;">{{ msg.time }}</div>
            </div>
            <div style="font-size: 17px; color: var(--color-text-secondary); margin-top: 6px; line-height: 1.8;">{{ msg.content }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 高危推送弹窗（模拟） -->
    <el-dialog v-model="showPush" title="⚠ 高危预警消息推送（模拟）" width="560px">
      <div class="glass-card-danger" style="padding: 24px; text-align: center;">
        <div style="font-size: 60px;">🚨</div>
        <div style="font-size: 26px; font-weight: 700; color: var(--color-danger); margin: 10px 0;">检测到血压严重偏高</div>
        <div style="font-size: 18px; color: var(--color-text-secondary); line-height: 1.8;">
          父母今日测量血压 168/102 mmHg，已超过安全阈值，<br>
          已在父母端自动弹出提醒并建议就医，建议您尽快电话联系。
        </div>
        <div style="margin-top: 18px;" class="muted-text">
          ( 模拟短信已发送至：{{ child.bound.phone }} )
        </div>
      </div>
      <template #footer>
        <el-button size="large" @click="showPush = false">关闭</el-button>
        <el-button size="large" type="primary" round @click="showPush = false; ElMessage.success('已拨打模拟电话')">📞 立即致电父母</el-button>
      </template>
    </el-dialog>
  </template>
</template>
