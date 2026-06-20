// ============================================================================
// Pinia · 用户健康信息 & 用药 store
// ============================================================================
import { defineStore } from 'pinia'
import type { Medicine, MedicineLog } from '@/types'
import { storage, genId, todayStr, nowHM } from '@/utils/storage'
import { DEFAULT_MEDICINES, MEDICINE_CONFLICTS } from '@/mock/dataset'

interface Profile {
  name: string
  gender: 'male' | 'female'
  age: number
  hipertension: boolean
  diabetes: boolean
  hyperlipidemia: boolean
}

interface State {
  profile: Profile
  medicines: Medicine[]
  logs: MedicineLog[]
  inited: boolean
}

// —— 懒初始化：首次访问注入示例数据（仅一次）——
function lazyInit(): State {
  let profile = storage.get<Profile>('profile', null as any)
  let meds = storage.get<Medicine[]>('medicines', [])
  let logs = storage.get<MedicineLog[]>('medicine_logs', [])

  if (!profile) {
    profile = { name: '李大爷', gender: 'male', age: 68, hipertension: true, diabetes: true, hyperlipidemia: true }
    storage.set('profile', profile)
  }
  if (meds.length === 0) {
    meds = [...DEFAULT_MEDICINES]
    storage.set('medicines', meds)
    // 同时生成今日待服记录
    logs = buildTodayLogsFor(meds)
    storage.set('medicine_logs', logs)
  } else {
    // 检查今日是否已生成待服记录
    const today = todayStr()
    const existToday = logs.some(l => l.date === today)
    if (!existToday) {
      const todayLogs = buildTodayLogsFor(meds)
      logs = [...logs, ...todayLogs]
      storage.set('medicine_logs', logs)
    }
  }
  return { profile, medicines: meds, logs, inited: true }
}

function buildTodayLogsFor(meds: Medicine[]): MedicineLog[] {
  const today = todayStr()
  const list: MedicineLog[] = []
  meds.forEach(m => {
    m.times.forEach(t => {
      list.push({
        id: genId('log'),
        medicineId: m.id,
        medicineName: m.name,
        planTime: t,
        status: 'pending',
        date: today,
        createdAt: new Date().toISOString()
      })
    })
  })
  return list
}

export const useHealthStore = defineStore('health', {
  state: (): State => lazyInit(),
  getters: {
    todayLogs(state): MedicineLog[] {
      const t = todayStr()
      return state.logs.filter(l => l.date === t).sort((a, b) => a.planTime.localeCompare(b.planTime))
    },
    todayPendingCount(state): number {
      const t = todayStr()
      return state.logs.filter(l => l.date === t && l.status === 'pending').length
    },
    todayDoneRate(state): string {
      const t = todayStr()
      const all = state.logs.filter(l => l.date === t)
      if (!all.length) return '—'
      const done = all.filter(l => l.status === 'done').length
      return Math.round((done / all.length) * 100) + '%'
    },
    // 近 7 天用药完成率（用于首页/子女端展示）
    weekCompleteRate(state): string {
      const d = new Date()
      const days: string[] = []
      for (let i = 6; i >= 0; i--) {
        const t = new Date(d.getTime() - i * 86400000)
        const y = t.getFullYear(); const m = String(t.getMonth() + 1).padStart(2, '0'); const dd = String(t.getDate()).padStart(2, '0')
        days.push(`${y}-${m}-${dd}`)
      }
      const weekLogs = state.logs.filter(l => days.includes(l.date))
      if (!weekLogs.length) return '—'
      const done = weekLogs.filter(l => l.status === 'done').length
      return Math.round((done / weekLogs.length) * 100) + '%'
    }
  },
  actions: {
    addMedicine(med: Omit<Medicine, 'id' | 'createdAt' | 'conflictTips'>) {
      // 自动冲突检测
      const tips: string[] = []
      this.medicines.forEach(exist => {
        MEDICINE_CONFLICTS.forEach(rule => {
          if ((rule.a === exist.name && rule.b === med.name) ||
              (rule.b === exist.name && rule.a === med.name)) {
            tips.push(`与「${exist.name}」冲突：${rule.tip}`)
          }
        })
      })
      const newMed: Medicine = {
        ...med,
        id: genId('med'),
        createdAt: new Date().toISOString(),
        conflictTips: tips.join('；') || undefined
      }
      this.medicines.push(newMed)
      storage.set('medicines', this.medicines)
      // 新增今日待服记录
      const today = todayStr()
      med.times.forEach(t => {
        this.logs.push({
          id: genId('log'),
          medicineId: newMed.id,
          medicineName: newMed.name,
          planTime: t, status: 'pending',
          date: today, createdAt: new Date().toISOString()
        })
      })
      storage.set('medicine_logs', this.logs)
      return newMed
    },
    removeMedicine(id: string) {
      this.medicines = this.medicines.filter(m => m.id !== id)
      storage.set('medicines', this.medicines)
      // 同时移除今日该药物的未完成记录
      this.logs = this.logs.filter(l => !(l.medicineId === id && l.status === 'pending' && l.date === todayStr()))
      storage.set('medicine_logs', this.logs)
    },
    markLogDone(logId: string) {
      const log = this.logs.find(l => l.id === logId)
      if (log) {
        log.status = 'done'
        log.takenTime = nowHM()
        storage.set('medicine_logs', this.logs)
      }
    },
    markLogOverdue(logId: string) {
      const log = this.logs.find(l => l.id === logId)
      if (log) {
        log.status = 'overdue'
        storage.set('medicine_logs', this.logs)
      }
    },
    /** 检测当前时间下，超时未服药的记录（Agent 主动风险识别） */
    checkOverdue() {
      const now = nowHM()
      const today = todayStr()
      let changed = false
      this.logs.forEach(l => {
        if (l.date === today && l.status === 'pending' && l.planTime < now) {
          // 超过计划时间 30 分钟以上判定为超时
          const [h1, m1] = l.planTime.split(':').map(Number)
          const [h2, m2] = now.split(':').map(Number)
          const diffMin = (h2 * 60 + m2) - (h1 * 60 + m1)
          if (diffMin >= 30) {
            l.status = 'overdue'
            changed = true
          }
        }
      })
      if (changed) storage.set('medicine_logs', this.logs)
    },
    updateProfile(p: Profile) {
      this.profile = p
      storage.set('profile', p)
    }
  }
})
