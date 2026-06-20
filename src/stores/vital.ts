// ============================================================================
// Pinia · 居家体征 store
// ============================================================================
import { defineStore } from 'pinia'
import type { VitalSign } from '@/types'
import { storage, genId, todayStr, nowHM } from '@/utils/storage'
import { genDefaultVitalSigns, checkBloodPressure, checkBloodSugar, checkHeartRate } from '@/mock/dataset'

interface State {
  list: VitalSign[]
  inited: boolean
}

function lazyInit(): State {
  let list = storage.get<VitalSign[]>('vital_signs', [])
  if (list.length === 0) {
    list = genDefaultVitalSigns()
    storage.set('vital_signs', list)
  }
  return { list, inited: true }
}

export const useVitalStore = defineStore('vital', {
  state: (): State => lazyInit(),
  getters: {
    sortedList(state): VitalSign[] {
      return [...state.list].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
    },
    bloodPressureList(state): VitalSign[] {
      return state.list.filter(v => v.type === 'bloodPressure')
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    },
    bloodSugarList(state): VitalSign[] {
      return state.list.filter(v => v.type === 'bloodSugar')
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    },
    heartRateList(state): VitalSign[] {
      return state.list.filter(v => v.type === 'heartRate')
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    },
    latest(state): { bp?: VitalSign; bs?: VitalSign; hr?: VitalSign } {
      const bp = [...state.list].filter(v => v.type === 'bloodPressure').sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time))[0]
      const bs = [...state.list].filter(v => v.type === 'bloodSugar').sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time))[0]
      const hr = [...state.list].filter(v => v.type === 'heartRate').sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time))[0]
      return { bp, bs, hr }
    },
    abnormalCount(state): number {
      return state.list.filter(v => v.abnormal).length
    }
  },
  actions: {
    addBloodPressure(systolic: number, diastolic: number) {
      const { abnormal, warning } = checkBloodPressure(systolic, diastolic)
      const v: VitalSign = {
        id: genId('bp'), type: 'bloodPressure',
        systolic, diastolic, fasting: false,
        date: todayStr(), time: nowHM(),
        createdAt: new Date().toISOString(),
        abnormal, warning
      }
      this.list.push(v)
      storage.set('vital_signs', this.list)
      return v
    },
    addBloodSugar(sugar: number, fasting: boolean) {
      const { abnormal, warning } = checkBloodSugar(sugar, fasting)
      const v: VitalSign = {
        id: genId('bs'), type: 'bloodSugar',
        sugar, fasting,
        date: todayStr(), time: nowHM(),
        createdAt: new Date().toISOString(),
        abnormal, warning
      }
      this.list.push(v)
      storage.set('vital_signs', this.list)
      return v
    },
    addHeartRate(heartRate: number) {
      const { abnormal, warning } = checkHeartRate(heartRate)
      const v: VitalSign = {
        id: genId('hr'), type: 'heartRate',
        heartRate, fasting: false,
        date: todayStr(), time: nowHM(),
        createdAt: new Date().toISOString(),
        abnormal, warning
      }
      this.list.push(v)
      storage.set('vital_signs', this.list)
      return v
    },
    remove(id: string) {
      this.list = this.list.filter(v => v.id !== id)
      storage.set('vital_signs', this.list)
    }
  }
})
