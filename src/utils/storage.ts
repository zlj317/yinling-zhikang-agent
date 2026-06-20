// ============================================================================
// localStorage 本地持久化工具
// - 统一 key 前缀、统一读写入口、统一异常兜底
// 复赛可扩展：
//   1) 接入后端数据库，将本地数据同步至云端
//   2) 引入 IndexedDB 存储大体积图片/体检报告附件
//   3) 增加端到端加密保护用户敏感数据
// ============================================================================

const PREFIX = 'zhikang_agent_v1_'

type StorageKey =
  | 'medicines'
  | 'medicine_logs'
  | 'reports'
  | 'vital_signs'
  | 'favorites'
  | 'profile'
  | 'child_account'

function fullKey(key: StorageKey): string {
  return PREFIX + key
}

function read<T>(key: StorageKey, fallback: T): T {
  try {
    const raw = localStorage.getItem(fullKey(key))
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch (e) {
    console.warn('[storage] read fail', key, e)
    return fallback
  }
}

function write<T>(key: StorageKey, value: T): void {
  try {
    localStorage.setItem(fullKey(key), JSON.stringify(value))
  } catch (e) {
    console.warn('[storage] write fail', key, e)
  }
}

// —— 对外暴露统一读写 API ——
export const storage = {
  get<T>(key: StorageKey, fallback: T) { return read<T>(key, fallback) },
  set<T>(key: StorageKey, value: T) { write<T>(key, value) },
  remove(key: StorageKey) {
    try { localStorage.removeItem(fullKey(key)) } catch (_) {}
  },
  clearAll() {
    const keys: StorageKey[] = [
      'medicines','medicine_logs','reports','vital_signs','favorites','profile','child_account'
    ]
    keys.forEach(k => { try { localStorage.removeItem(fullKey(k)) } catch(_){} })
  }
}

/** 生成 ID */
export function genId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`
}

/** 日期格式化 YYYY-MM-DD */
export function todayStr(offsetDay = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDay)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 中文日期显示 */
export function chineseToday(): string {
  const d = new Date()
  const week = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][d.getDay()]
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 · ${week}`
}

/** 当前时间 HH:mm */
export function nowHM(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
