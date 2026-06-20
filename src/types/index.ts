// ============================================================================
// 统一类型定义 (TypeScript)
// 复赛可扩展：接入后端接口时，可在此文件补充服务端DTO类型
// ============================================================================

/** 用药记录 */
export interface Medicine {
  id: string
  name: string
  dosage: string          // 用量，如 "1片"
  frequency: string       // 频率，如 "每日3次"
  times: string[]         // 具体服用时间点，如 ["08:00", "12:00", "20:00"]
  needAfterMeal: boolean  // 是否饭后服用
  category: string        // 药物类别，如 "降压药/降糖药"
  image?: string          // 药盒图片 base64 预览（可选）
  createdAt: string
  conflictTips?: string   // 系统检测出的药物冲突提示
}

/** 每日用药执行记录 */
export interface MedicineLog {
  id: string
  medicineId: string
  medicineName: string
  planTime: string        // 计划时间 HH:mm
  takenTime?: string      // 实际完成时间
  status: 'pending' | 'done' | 'overdue'
  date: string            // YYYY-MM-DD
  createdAt: string
}

/** 体检报告 */
export interface HealthReport {
  id: string
  title: string
  date: string
  hospital: string
  items: ReportItem[]
  summary: string
  createdAt: string
}

export interface ReportItem {
  name: string
  value: string
  reference: string
  unit: string
  status: 'normal' | 'low' | 'high'
  category: string        // 血常规 / 肝功能 / 血糖血脂等
  explain: string         // 通俗解读
  advice: string          // 调理建议
}

/** 居家体征（血压/血糖/心率） */
export interface VitalSign {
  id: string
  type: 'bloodPressure' | 'bloodSugar' | 'heartRate'
  systolic?: number       // 收缩压
  diastolic?: number      // 舒张压
  sugar?: number          // 血糖
  heartRate?: number      // 心率
  fasting: boolean        // 是否空腹（血糖用）
  note?: string
  date: string            // YYYY-MM-DD
  time: string            // HH:mm
  createdAt: string
  abnormal?: boolean      // 是否超标异常
  warning?: string        // 系统预警文案
}

/** 科普文章 */
export interface PopularArticle {
  id: string
  title: string
  cover: string           // emoji 或标签
  tags: string[]
  summary: string
  content: string
  matched: string         // 匹配到的用户慢病/异常
  favored?: boolean
}

/** 子女关怀端消息 */
export interface ChildMessage {
  id: string
  title: string
  content: string
  level: 'info' | 'warn' | 'danger'
  time: string
}

/** 通用键值对 */
export interface KV<T = any> {
  [key: string]: T
}
