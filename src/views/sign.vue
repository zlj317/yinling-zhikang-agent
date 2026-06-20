<script setup lang="ts">
// 居家体征记录看板 · 血压/血糖/心率 + ECharts
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import { useVitalStore } from '@/stores/vital'
import { speak } from '@/utils/speech'

const vital = useVitalStore()

// —— 录入表单 ——
const active = ref<'bp' | 'bs' | 'hr'>('bp')
const systolic = ref(128)
const diastolic = ref(82)
const sugar = ref(5.8)
const fasting = ref(true)
const heartRate = ref(72)

function submit() {
  if (active.value === 'bp') {
    if (!systolic.value || !diastolic.value) return ElMessage.warning('请输入完整血压值')
    const v = vital.addBloodPressure(systolic.value, diastolic.value)
    speak(`已记录，血压 ${systolic.value} 毫米汞柱 ${diastolic.value}。${v.abnormal ? v.warning : '正常。'}`)
  } else if (active.value === 'bs') {
    if (!sugar.value) return ElMessage.warning('请输入血糖值')
    const v = vital.addBloodSugar(sugar.value, fasting.value)
    speak(`已记录，${fasting.value ? '空腹' : '餐后'}血糖 ${sugar.value} 毫摩尔每升。${v.abnormal ? v.warning : '正常。'}`)
  } else {
    if (!heartRate.value) return ElMessage.warning('请输入心率值')
    const v = vital.addHeartRate(heartRate.value)
    speak(`已记录，心率每分钟 ${heartRate.value} 次。${v.abnormal ? v.warning : '正常。'}`)
  }
  ElMessage.success('✅ 已记录并本地保存')
  // 异常预警
  if (active.value === 'bp' && (systolic.value >= 160 || diastolic.value >= 100)) {
    ElMessageBox.alert('血压严重偏高！建议立即咨询医生。已同步预警至子女端。', '⚠ 高危预警', { type: 'error', confirmButtonText: '我知道了' })
  }
  nextTick(renderCharts)
}

// —— 近 10 条数据 ECharts 趋势 ——
const bpChartRef = ref<HTMLDivElement>()
const bsChartRef = ref<HTMLDivElement>()
const hrChartRef = ref<HTMLDivElement>()

function renderCharts() {
  renderBP()
  renderBS()
  renderHR()
}

function renderBP() {
  if (!bpChartRef.value) return
  const data = [...vital.bloodPressureList].slice(-10)
  const chart = echarts.init(bpChartRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['收缩压', '舒张压'], top: 0, textStyle: { fontSize: 14 } },
    grid: { top: 40, bottom: 30, left: 50, right: 20 },
    xAxis: { type: 'category', data: data.map(d => d.date.slice(5)), axisLabel: { fontSize: 12 } },
    yAxis: { type: 'value', min: 60, max: 180, axisLabel: { fontSize: 12 } },
    series: [
      {
        name: '收缩压', type: 'line', smooth: true, symbolSize: 10,
        data: data.map(d => ({
          value: d.systolic,
          itemStyle: { color: d.abnormal ? '#F5222D' : '#1677FF' }
        })),
        itemStyle: { color: '#1677FF' },
        lineStyle: { width: 3 },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(22,119,255,0.3)' }, { offset: 1, color: 'rgba(22,119,255,0)' }]) }
      },
      {
        name: '舒张压', type: 'line', smooth: true, symbolSize: 10,
        data: data.map(d => d.diastolic),
        itemStyle: { color: '#52C41A' }, lineStyle: { width: 3 }
      }
    ]
  })
  window.addEventListener('resize', () => chart.resize())
}

function renderBS() {
  if (!bsChartRef.value) return
  const data = [...vital.bloodSugarList].slice(-10)
  const chart = echarts.init(bsChartRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { top: 0, textStyle: { fontSize: 14 } },
    grid: { top: 40, bottom: 30, left: 50, right: 20 },
    xAxis: { type: 'category', data: data.map(d => d.date.slice(5)), axisLabel: { fontSize: 12 } },
    yAxis: { type: 'value', axisLabel: { fontSize: 12 } },
    series: [
      {
        name: '血糖(mmol/L)', type: 'line', smooth: true, symbolSize: 10,
        data: data.map(d => ({
          value: d.sugar,
          itemStyle: { color: d.abnormal ? '#F5222D' : '#FAAD14' }
        })),
        itemStyle: { color: '#FAAD14' }, lineStyle: { width: 3 },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(250,173,20,0.3)' }, { offset: 1, color: 'rgba(250,173,20,0)' }]) }
      }
    ]
  })
}

function renderHR() {
  if (!hrChartRef.value) return
  const data = [...vital.heartRateList].slice(-10)
  const chart = echarts.init(hrChartRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { top: 0, textStyle: { fontSize: 14 } },
    grid: { top: 40, bottom: 30, left: 50, right: 20 },
    xAxis: { type: 'category', data: data.map(d => d.date.slice(5)), axisLabel: { fontSize: 12 } },
    yAxis: { type: 'value', min: 40, max: 120, axisLabel: { fontSize: 12 } },
    series: [
      {
        name: '心率(次/分)', type: 'line', smooth: true, symbolSize: 10,
        data: data.map(d => ({
          value: d.heartRate,
          itemStyle: { color: d.abnormal ? '#F5222D' : '#52C41A' }
        })),
        itemStyle: { color: '#52C41A' }, lineStyle: { width: 3 },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(82,196,26,0.3)' }, { offset: 1, color: 'rgba(82,196,26,0)' }]) }
      }
    ]
  })
}

onMounted(() => nextTick(renderCharts))

// AI 每日小结
const dailySummary = computed(() => {
  const latestBP = [...vital.bloodPressureList].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0]
  const latestBS = [...vital.bloodSugarList].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0]
  const latestHR = [...vital.heartRateList].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0]
  const lines: string[] = []
  if (latestBP) lines.push(`血压最近一次 ${latestBP.systolic}/${latestBP.diastolic} mmHg，${latestBP.abnormal ? latestBP.warning || '略有偏高' : '保持稳定'}`)
  if (latestBS) lines.push(`血糖最近一次 ${latestBS.sugar} mmol/L，${latestBS.abnormal ? latestBS.warning || '偏高' : '控制良好'}`)
  if (latestHR) lines.push(`心率最近一次 ${latestHR.heartRate} 次/分，${latestHR.abnormal ? latestHR.warning || '偏快' : '正常'}`)
  lines.push('💡 建议每天同一时段测量，便于对比趋势；测量前静坐10分钟，避免剧烈运动、吸烟、饮酒。')
  return lines.join('\n')
})

const speakingSummary = ref(false)
function speakSummary() {
  speakingSummary.value = true
  speak(dailySummary.value, { onEnd: () => speakingSummary.value = false })
}

// 快速数值调整（方便老年人操作）
function add(type: 's' | 'd' | 'su' | 'h', v: number) {
  if (type === 's') systolic.value = Math.max(60, Math.min(260, systolic.value + v))
  if (type === 'd') diastolic.value = Math.max(40, Math.min(180, diastolic.value + v))
  if (type === 'su') sugar.value = Math.max(2.0, Math.round((sugar.value + v * 0.1) * 10) / 10)
  if (type === 'h') heartRate.value = Math.max(40, Math.min(200, heartRate.value + v))
}

function removeItem(id: string) {
  ElMessageBox.confirm('确认删除该条记录？', '提示', { type: 'warning' }).then(() => {
    vital.remove(id)
    nextTick(renderCharts)
    ElMessage.success('已删除')
  }).catch(() => {})
}
</script>

<template>
  <div class="grid-2" style="margin-bottom: 24px;">
    <!-- 左侧：录入表单 -->
    <div class="glass-card" style="padding: 28px;">
      <div class="section-title" style="margin-bottom: 18px;">📝 快速记录 · 大字大按钮</div>
      <!-- 切换 Tab -->
      <div class="flex" style="gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
        <el-button
          size="large"
          round
          :type="active === 'bp' ? 'primary' : 'default'"
          @click="active = 'bp'">🩸 血压</el-button>
        <el-button
          size="large"
          round
          :type="active === 'bs' ? 'primary' : 'default'"
          @click="active = 'bs'">🍬 血糖</el-button>
        <el-button
          size="large"
          round
          :type="active === 'hr' ? 'primary' : 'default'"
          @click="active = 'hr'">❤️ 心率</el-button>
      </div>

      <!-- 血压录入 -->
      <div v-if="active === 'bp'">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 12px;">
          <div class="glass-card" style="padding: 24px; text-align: center;">
            <div class="muted-text" style="font-size: 17px;">收缩压(高压)</div>
            <div style="font-size: 54px; font-weight: 700; color: var(--color-primary); margin: 8px 0;">{{ systolic }}</div>
            <div class="flex" style="justify-content: center; gap: 10px;">
              <el-button size="large" round @click="add('s', -5)">-5</el-button>
              <el-button size="large" round @click="add('s', -1)">-1</el-button>
              <el-button size="large" round type="primary" @click="add('s', 1)">+1</el-button>
              <el-button size="large" round type="primary" @click="add('s', 5)">+5</el-button>
            </div>
          </div>
          <div class="glass-card" style="padding: 24px; text-align: center;">
            <div class="muted-text" style="font-size: 17px;">舒张压(低压)</div>
            <div style="font-size: 54px; font-weight: 700; color: var(--color-success); margin: 8px 0;">{{ diastolic }}</div>
            <div class="flex" style="justify-content: center; gap: 10px;">
              <el-button size="large" round @click="add('d', -5)">-5</el-button>
              <el-button size="large" round @click="add('d', -1)">-1</el-button>
              <el-button size="large" round type="success" @click="add('d', 1)">+1</el-button>
              <el-button size="large" round type="success" @click="add('d', 5)">+5</el-button>
            </div>
          </div>
        </div>
        <div class="muted-text" style="font-size: 16px; text-align: center; margin-bottom: 8px;">正常参考范围：90-140 / 60-90 mmHg</div>
      </div>

      <!-- 血糖录入 -->
      <div v-if="active === 'bs'">
        <div class="glass-card" style="padding: 24px; text-align: center; margin-bottom: 12px;">
          <div class="flex" style="justify-content: center; gap: 16px; margin-bottom: 10px;">
            <el-radio v-model="fasting" :label="true" size="large">空腹</el-radio>
            <el-radio v-model="fasting" :label="false" size="large">餐后</el-radio>
          </div>
          <div style="font-size: 64px; font-weight: 700; color: var(--color-warning); margin: 8px 0;">{{ sugar }}</div>
          <div class="muted-text" style="font-size: 17px; margin-bottom: 12px;">mmol/L（毫摩尔/升）</div>
          <div class="flex" style="justify-content: center; gap: 10px; flex-wrap: wrap;">
            <el-button size="large" round @click="add('su', -5)">-0.5</el-button>
            <el-button size="large" round @click="add('su', -1)">-0.1</el-button>
            <el-button size="large" round type="warning" @click="add('su', 1)">+0.1</el-button>
            <el-button size="large" round type="warning" @click="add('su', 5)">+0.5</el-button>
          </div>
        </div>
        <div class="muted-text" style="font-size: 16px; text-align: center;">空腹参考：3.9-6.1 mmol/L；餐后 2 小时 < 7.8</div>
      </div>

      <!-- 心率录入 -->
      <div v-if="active === 'hr'">
        <div class="glass-card" style="padding: 24px; text-align: center; margin-bottom: 12px;">
          <div style="font-size: 64px; font-weight: 700; color: var(--color-success); margin: 8px 0;">{{ heartRate }}</div>
          <div class="muted-text" style="font-size: 17px; margin-bottom: 12px;">次/分钟（BPM）</div>
          <div class="flex" style="justify-content: center; gap: 10px; flex-wrap: wrap;">
            <el-button size="large" round @click="add('h', -5)">-5</el-button>
            <el-button size="large" round @click="add('h', -1)">-1</el-button>
            <el-button size="large" round type="success" @click="add('h', 1)">+1</el-button>
            <el-button size="large" round type="success" @click="add('h', 5)">+5</el-button>
          </div>
        </div>
        <div class="muted-text" style="font-size: 16px; text-align: center;">健康成人参考：60-100 次/分</div>
      </div>

      <div style="margin-top: 20px; text-align: center;">
        <el-button
          type="primary"
          size="large"
          round
          style="font-size: 22px; padding: 18px 40px;"
          @click="submit">
          ✅ 保存并记录
        </el-button>
      </div>
    </div>

    <!-- 右侧：AI 每日小结 + 指标卡 -->
    <div class="glass-card" style="padding: 28px;">
      <div class="section-title" style="margin-bottom: 18px;">🤖 AI 每日小结</div>
      <div style="font-size: 18px; line-height: 2; color: var(--color-text-secondary); white-space: pre-line;">
        {{ dailySummary }}
      </div>
      <div style="margin-top: 16px;">
        <el-button round size="large" @click="speakSummary()">
          {{ speakingSummary ? '朗读中…' : '🔊 语音播报' }}
        </el-button>
      </div>
      <div style="margin-top: 20px;">
        <span class="ai-tag">AI 智能分析生成</span>
      </div>
    </div>
  </div>

  <!-- 三大趋势图 -->
  <div class="grid-2" style="margin-bottom: 24px;">
    <div class="glass-card" style="padding: 24px;">
      <div class="section-title" style="margin-bottom: 12px;">📈 血压趋势（近10次）</div>
      <div ref="bpChartRef" style="width: 100%; height: 280px;"></div>
    </div>
    <div class="glass-card" style="padding: 24px;">
      <div class="section-title" style="margin-bottom: 12px;">📈 血糖趋势（近10次）</div>
      <div ref="bsChartRef" style="width: 100%; height: 280px;"></div>
    </div>
  </div>
  <div class="glass-card" style="padding: 24px; margin-bottom: 24px;">
    <div class="section-title" style="margin-bottom: 12px;">📈 心率趋势（近10次）</div>
    <div ref="hrChartRef" style="width: 100%; height: 280px;"></div>
  </div>

  <!-- 近期记录列表 -->
  <div class="glass-card" style="padding: 28px;">
    <div class="section-title" style="margin-bottom: 18px;">📋 近期记录明细</div>
    <el-table :data="vital.sortedList.slice(0, 20)" style="font-size: 17px;"
      :header-cell-style="{ background: 'rgba(22,119,255,0.08)', fontSize: '18px', fontWeight: 600 }">
      <el-table-column prop="date" label="日期" width="130" />
      <el-table-column prop="time" label="时间" width="110" />
      <el-table-column label="类型" width="100">
        <template #default="{ row }">
          <span v-if="row.type === 'bloodPressure'" class="badge badge-primary">血压</span>
          <span v-else-if="row.type === 'bloodSugar'" class="badge badge-warning">血糖</span>
          <span v-else class="badge badge-success">心率</span>
        </template>
      </el-table-column>
      <el-table-column label="数值">
        <template #default="{ row }">
          <span v-if="row.type === 'bloodPressure'">
            <b :class="{ 'text-danger': row.abnormal }" style="font-size: 18px;">{{ row.systolic }}/{{ row.diastolic }}</b> mmHg
          </span>
          <span v-else-if="row.type === 'bloodSugar'">
            <b :class="{ 'text-danger': row.abnormal }" style="font-size: 18px;">{{ row.sugar }}</b> mmol/L（{{ row.fasting ? '空腹' : '餐后' }}）
          </span>
          <span v-else>
            <b :class="{ 'text-danger': row.abnormal }" style="font-size: 18px;">{{ row.heartRate }}</b> 次/分
          </span>
        </template>
      </el-table-column>
      <el-table-column label="AI 判断">
        <template #default="{ row }">
          <span v-if="row.abnormal" class="badge badge-danger" style="font-size: 14px;">⚠ 异常</span>
          <span v-else class="badge badge-success" style="font-size: 14px;">✅ 正常</span>
          <span v-if="row.warning" class="muted-text" style="margin-left: 8px; font-size: 15px;">{{ row.warning }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button type="danger" link size="large" @click="removeItem(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
