// ============================================================================
// Pinia · 体检报告 store & 子女关怀 store & 科普收藏 store
// ============================================================================
import { defineStore } from 'pinia'
import type { HealthReport, ChildMessage, PopularArticle } from '@/types'
import { storage, genId } from '@/utils/storage'
import { DEFAULT_REPORTS, POPULAR_ARTICLES, buildDefaultChildMessages } from '@/mock/dataset'

// —— 报告 ——
export const useReportStore = defineStore('report', {
  state: () => ({
    list: storage.get<HealthReport[]>('reports', []).length
      ? storage.get<HealthReport[]>('reports', [])
      : (() => { const d = DEFAULT_REPORTS; storage.set('reports', d); return d })()
  }),
  getters: {
    sortedList(state): HealthReport[] {
      return [...state.list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    }
  },
  actions: {
    addReport(report: HealthReport) {
      this.list.push(report)
      storage.set('reports', this.list)
    },
    removeReport(id: string) {
      this.list = this.list.filter(r => r.id !== id)
      storage.set('reports', this.list)
    },
    /** 根据已有体检报告自动判断用户慢病类型，用于科普推荐 */
    detectUserConditions(): string[] {
      const conditions = new Set<string>()
      this.list.forEach(r => {
        r.items.forEach(i => {
          if (i.status !== 'normal') {
            if (i.name.includes('血糖') || i.name.includes('GLU')) conditions.add('血糖异常')
            if (i.name.includes('胆固醇') || i.name.includes('LDL') || i.name.includes('甘油') || i.name.includes('TG')) conditions.add('血脂异常')
          }
          if (i.name.includes('收缩压') && i.status !== 'normal') conditions.add('血压偏高')
        })
      })
      return Array.from(conditions)
    }
  }
})

// —— 子女关怀 ——
export const useChildStore = defineStore('child', {
  state: () => ({
    bound: storage.get<any>('child_account', null),
    messages: buildDefaultChildMessages()
  }),
  actions: {
    bind(account: { nickname: string; phone: string }) {
      const info = { ...account, boundAt: new Date().toISOString() }
      this.bound = info
      storage.set('child_account', info)
    },
    unbind() {
      this.bound = null
      storage.remove('child_account')
    },
    pushMessage(msg: Omit<ChildMessage, 'id'>) {
      this.messages.unshift(msg as ChildMessage)
    }
  }
})

// —— 科普文章（根据用户慢病/异常动态推荐）——
export const usePopularStore = defineStore('popular', {
  state: () => ({
    articles: [...POPULAR_ARTICLES],
    favors: storage.get<string[]>('favorites', [])
  }),
  getters: {
    /** 根据用户条件动态推荐排序 */
    recommended(state) {
      const conditions: string[] = []
      // 合并用户 profile & 报告结果
      const profile = storage.get<any>('profile', null)
      if (profile?.hipertension) conditions.push('血压偏高')
      if (profile?.diabetes) conditions.push('血糖异常')
      if (profile?.hyperlipidemia) conditions.push('血脂异常')
      // 用药物数量
      const meds = storage.get<any[]>('medicines', [])
      if (meds.length >= 2) conditions.push('多药共用')

      const sorted = [...state.articles].map(a => ({
        ...a,
        favored: state.favors.includes(a.id)
      })).sort((a, b) => {
          const aHit = conditions.some(c => a.title.includes(c) || a.tags.includes(c) || a.matched.includes(c)) ? -1 : 0
          const bHit = conditions.some(c => b.title.includes(c) || b.tags.includes(c) || b.matched.includes(c)) ? -1 : 0
          return aHit - bHit
        })
      return sorted
    }
  },
  actions: {
    toggleFavor(id: string) {
      const idx = this.favors.indexOf(id)
      if (idx >= 0) this.favors.splice(idx, 1)
      else this.favors.push(id)
      storage.set('favorites', this.favors)
    }
  }
})
