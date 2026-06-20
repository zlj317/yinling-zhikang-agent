<script setup lang="ts">
// 首页 · AI 智能总览
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useHealthStore } from '@/stores/health'
import { useVitalStore } from '@/stores/vital'
import { useReportStore } from '@/stores/feature'
import { speak } from '@/utils/speech'
import { chineseToday } from '@/utils/storage'

const router = useRouter()
const health = useHealthStore()
const vital = useVitalStore()
const report = useReportStore()

// Agent 问候（根据时段动态变化）
const hour = new Date().getHours()
const greeting = computed(() => {
  if (hour < 10) return `早上好，${health.profile.name}！新的一天，从健康开始。`
  if (hour < 14) return `中午好，${health.profile.name}！饭后记得休息一下。`
  if (hour < 18) return `下午好，${health.profile.name}！出去走走活动一下吧。`
  return `晚上好，${health.profile.name}！愿您有个好睡眠。`
})

// 主动预警内容
const warnList = computed(() => {
  const list: Array<{ type: 'danger' | 'warning' | 'info'; title: string; text: string }> = []
  // 未完成服药
  if (health.todayPendingCount > 0) {
    list.push({
      type: 'danger',
      title: `还有 ${health.todayPendingCount} 次药未服用`,
      text: '请按计划按时服药，保持规律用药对身体非常重要。'
    })
  }
  // 体征异常
  const latest = vital.latest
  if (latest.bp?.abnormal) list.push({ type: 'warning', title: `最近一次血压 ${latest.bp.systolic}/${latest.bp.diastolic}`, text: latest.bp.warning || '建议加强监测。' })
  if (latest.bs?.abnormal) list.push({ type: 'warning', title: `最近一次血糖 ${latest.bs.sugar} mmol/L`, text: latest.bs.warning || '建议调整饮食。' })
  // 超时未服
  const overdue = health.todayLogs.filter(l => l.status === 'overdue')
  overdue.forEach(l => {
    list.push({ type: 'danger', title: `「${l.medicineName}」已超时(${l.planTime})未服`, text: '请立即补服或咨询医生。' })
  })
  return list
})

// 本周小结（AI 生成）
const weekSummary = computed(() => {
  const summary: string[] = []
  summary.push(`您本周用药完成率约 ${health.weekCompleteRate}，整体用药依从性良好。`)
  if (vital.bloodPressureList.length) {
    const last = [...vital.bloodPressureList].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0]
    if (last) summary.push(`血压最近一次为 ${last.systolic}/${last.diastolic} mmHg，${last.abnormal ? '略有波动，建议每日同一时段测量。' : '保持稳定，继续保持。'}`)
  }
  if (vital.bloodSugarList.length) {
    const last = [...vital.bloodSugarList].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0]
    if (last) summary.push(`血糖最近一次 ${last.sugar} mmol/L，${last.abnormal ? '偏高，请控制主食与甜食。' : '控制良好。'}`)
  }
  if (report.list.length > 0) {
    const latestReport = report.sortedList[0]
    const abnormal = latestReport.items.filter(i => i.status !== 'normal').length
    summary.push(`最近一次体检报告共 ${abnormal} 项异常，建议${abnormal >= 3 ? '就诊复查。' : '关注并2-3月后复查。'}`)
  }
  summary.push('💡 保持规律作息、均衡饮食、适度运动、心情愉悦，是健康管理的四大基石。')
  return summary.join('\n')
})

const summarySpeaking = ref(false)
function speakSummary() {
  summarySpeaking.value = true
  speak(weekSummary.value, { onEnd: () => summarySpeaking.value = false })
}

onMounted(() => {
  health.checkOverdue()
})

const quickEntries = [
  { key: 'medicine', icon: '💊', title: '服药管家', desc: '按时提醒，不漏一次' },
  { key: 'report', icon: '🩺', title: '体检解读', desc: '看不懂的报告AI来翻译' },
  { key: 'sign', icon: '❤️', title: '体征记录', desc: '一键记录血压血糖心率' },
  { key: 'popular', icon: '📚', title: '健康科普', desc: '大白话，听得懂记得住' }
]
</script>

<template>
  <!-- Agent 问候卡片 -->
  <div class="glass-card" style="background: linear-gradient(135deg, rgba(22,119,255,0.18), rgba(82,196,26,0.08)); padding: 32px; margin-bottom: 24px;">
    <div class="flex-between" style="flex-wrap: wrap; gap: 16px;">
      <div style="flex: 1; min-width: 300px;">
        <div class="flex" style="align-items: center; gap: 14px; margin-bottom: 12px;">
          <span class="ai-tag">AI 健康助手</span>
          <span class="muted-text" style="font-size: 16px;">{{ chineseToday() }}</span>
        </div>
        <div style="font-size: 30px; font-weight: 700; color: var(--color-text); line-height: 1.5; margin-bottom: 10px;">
          {{ greeting }}
        </div>
        <div style="font-size: 20px; color: var(--color-text-secondary); line-height: 1.8;">
          今日待服药 <b style="color: var(--color-primary);">{{ health.todayPendingCount }}</b> 次，
          用药完成率 <b style="color: var(--color-success);">{{ health.todayDoneRate }}</b>
        </div>
      </div>

      <div class="grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; min-width: 360px;">
        <div class="glass-card" style="padding: 16px 20px; text-align: center;">
          <div class="muted-text" style="font-size: 14px;">最近血压</div>
          <div style="font-size: 24px; font-weight: 600; color: var(--color-text); margin-top: 6px;">
            {{ vital.latest.bp?.systolic ?? '--' }}/{{ vital.latest.bp?.diastolic ?? '--' }}
          </div>
          <div class="badge" :class="vital.latest.bp?.abnormal ? 'badge-danger' : 'badge-success'" style="margin-top: 6px;">
            {{ vital.latest.bp?.abnormal ? '偏高' : '正常' }}
          </div>
        </div>
        <div class="glass-card" style="padding: 16px 20px; text-align: center;">
          <div class="muted-text" style="font-size: 14px;">最近血糖</div>
          <div style="font-size: 24px; font-weight: 600; color: var(--color-text); margin-top: 6px;">
            {{ vital.latest.bs?.sugar ?? '--' }}
          </div>
          <div class="badge" :class="vital.latest.bs?.abnormal ? 'badge-danger' : 'badge-success'" style="margin-top: 6px;">
            {{ vital.latest.bs?.abnormal ? '偏高' : '正常' }}
          </div>
        </div>
        <div class="glass-card" style="padding: 16px 20px; text-align: center;">
          <div class="muted-text" style="font-size: 14px;">最近心率</div>
          <div style="font-size: 24px; font-weight: 600; color: var(--color-text); margin-top: 6px;">
            {{ vital.latest.hr?.heartRate ?? '--' }}
          </div>
          <div class="badge" :class="vital.latest.hr?.abnormal ? 'badge-warning' : 'badge-success'" style="margin-top: 6px;">
            {{ vital.latest.hr?.abnormal ? '需关注' : '正常' }}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 四大快捷入口 -->
  <div class="grid-4" style="margin-bottom: 24px;">
    <div
      v-for="item in quickEntries"
      :key="item.key"
      class="glass-card"
      style="padding: 28px; cursor: pointer; transition: transform .15s ease, box-shadow .15s ease; text-align: center;"
      @mouseenter="($event.currentTarget as any).style.transform = 'translateY(-3px)'"
      @mouseleave="($event.currentTarget as any).style.transform = 'translateY(0)'"
      @click="router.push('/' + item.key)">
      <div style="font-size: 48px; margin-bottom: 12px;">{{ item.icon }}</div>
      <div style="font-size: 22px; font-weight: 600; margin-bottom: 8px; color: var(--color-text);">{{ item.title }}</div>
      <div class="muted-text" style="font-size: 16px;">{{ item.desc }}</div>
    </div>
  </div>

  <!-- 主动预警 + AI 本周小结 -->
  <div class="grid-2" style="margin-bottom: 24px;">
    <!-- 预警列表 -->
    <div class="glass-card" style="padding: 24px;">
      <div class="section-title" style="margin-bottom: 18px; display: flex; align-items: center; gap: 10px;">
        <span>🚨</span>
        <span>主动预警提醒</span>
        <span v-if="warnList.length" class="badge badge-danger" style="margin-left: 8px; font-size: 14px;">{{ warnList.length }} 条</span>
      </div>
      <div v-if="!warnList.length" class="glass-card-success" style="padding: 20px; text-align: center;">
        <div style="font-size: 40px; margin-bottom: 8px;">✅</div>
        <div style="font-size: 20px; font-weight: 600; color: var(--color-success);">暂无异常，状态良好</div>
        <div class="muted-text" style="margin-top: 6px; font-size: 16px;">继续保持良好习惯，定期记录身体数据。</div>
      </div>
      <div v-else style="display: flex; flex-direction: column; gap: 12px;">
        <div v-for="(w, i) in warnList" :key="i" :class="w.type === 'danger' ? 'glass-card-danger' : 'glass-card-warning'" style="padding: 16px 20px;">
          <div style="font-size: 20px; font-weight: 600; color: var(--color-text); margin-bottom: 6px;">
            {{ w.type === 'danger' ? '⚠' : '🟡' }} {{ w.title }}
          </div>
          <div class="muted-text" style="font-size: 16px;">{{ w.text }}</div>
        </div>
      </div>
    </div>

    <!-- AI 本周小结 -->
    <div class="glass-card" style="padding: 24px;">
      <div class="flex-between" style="margin-bottom: 18px;">
        <div class="section-title" style="margin: 0; display: flex; align-items: center; gap: 10px;">
          <span>📝</span><span>AI 本周健康小结</span>
        </div>
        <el-button
          type="primary"
          :icon="summarySpeaking ? 'VideoPause' : 'Bell'"
          round
          @click="speakSummary">
          {{ summarySpeaking ? '朗读中…' : '一键语音朗读' }}
        </el-button>
      </div>
      <div style="font-size: 19px; line-height: 2; color: var(--color-text-secondary); white-space: pre-line; padding: 8px 0;">
        {{ weekSummary }}
      </div>
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed rgba(22,119,255,0.2);">
        <span class="ai-tag">AI 智能分析生成</span>
        <span class="muted-text" style="margin-left: 10px; font-size: 15px;">
          · 内容由前端规则引擎根据您的真实记录动态拼接，仅供参考，就医请遵医嘱。
        </span>
      </div>
    </div>
  </div>

  <!-- 子女关怀入口提醒 -->
  <div class="glass-card" style="padding: 24px;">
    <div class="section-title" style="margin-bottom: 18px;">
      👨‍👩‍👧 子女关怀 · 异地也能陪伴父母
    </div>
    <div class="flex-between" style="gap: 20px; flex-wrap: wrap;">
      <div style="flex: 1; min-width: 280px; font-size: 18px; color: var(--color-text-secondary); line-height: 1.8;">
        绑定子女账号后，他们可以在"子女端"看到您的每日用药情况、体征趋势，系统会在检测到异常时自动发送关怀消息。
      </div>
      <el-button type="primary" size="large" round @click="router.push('/child')">前往配置 →</el-button>
    </div>
  </div>
</template>
