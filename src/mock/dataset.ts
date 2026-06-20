// ============================================================================
// Mock 模拟数据集 · 全站业务数据源（初赛纯前端）
// 复赛可扩展：
//   - 接入真实 OCR 体检单识别接口
//   - 对接医院 LIS 系统拉取真实检验报告
//   - 接入蓝牙血压计/血糖仪/手环自动采集体征数据
//   - 接入大模型 API 输出更智能个性化解读
// ============================================================================

import type { Medicine, HealthReport, ReportItem, VitalSign, PopularArticle, ChildMessage } from '@/types'

/** 常用药物库（方言识别后匹配） */
export const COMMON_MEDICINES: Array<{ name: string; category: string; dosage: string; frequency: string }> = [
  { name: '氨氯地平片', category: '降压药', dosage: '1片(5mg)', frequency: '每日1次' },
  { name: '厄贝沙坦片', category: '降压药', dosage: '1片(150mg)', frequency: '每日1次' },
  { name: '二甲双胍', category: '降糖药', dosage: '1片(0.5g)', frequency: '每日2次' },
  { name: '格列美脲', category: '降糖药', dosage: '1片(2mg)', frequency: '每日1次' },
  { name: '阿托伐他汀', category: '调脂药', dosage: '1片(20mg)', frequency: '每晚1次' },
  { name: '阿司匹林肠溶片', category: '抗凝药', dosage: '1片(100mg)', frequency: '每日1次' },
  { name: '奥美拉唑', category: '胃药', dosage: '1片(20mg)', frequency: '每日1次' },
  { name: '碳酸钙D3', category: '补钙', dosage: '1片', frequency: '每日1次' },
  { name: '维生素B族', category: '维生素', dosage: '1片', frequency: '每日1次' }
]

/** 药物冲突规则库（简化版，实际需对照权威说明书） */
export const MEDICINE_CONFLICTS: Array<{ a: string; b: string; tip: string }> = [
  { a: '二甲双胍', b: '格列美脲', tip: '两种均为降糖药，同服可能引发低血糖，须医生确认剂量。' },
  { a: '氨氯地平片', b: '阿司匹林肠溶片', tip: '降压药与抗凝药同服可能增加出血风险，建议定期复查凝血。' },
  { a: '厄贝沙坦片', b: '阿司匹林肠溶片', tip: '沙坦类与抗凝药同服需关注肾功能，建议定期检查。' },
  { a: '阿托伐他汀', b: '奥美拉唑', tip: '奥美拉唑可能轻度影响他汀代谢，建议分开早晚服用。' }
]

/** 默认用药（首次访问展示示例数据） */
export const DEFAULT_MEDICINES: Medicine[] = [
  {
    id: 'demo_med_1',
    name: '氨氯地平片',
    dosage: '1片(5mg)',
    frequency: '每日1次',
    times: ['08:00'],
    needAfterMeal: true,
    category: '降压药',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString()
  },
  {
    id: 'demo_med_2',
    name: '二甲双胍',
    dosage: '1片(0.5g)',
    frequency: '每日2次',
    times: ['08:00', '20:00'],
    needAfterMeal: true,
    category: '降糖药',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString()
  }
]

/** 默认体征记录（近 10 日示例数据） */
export function genDefaultVitalSigns(): VitalSign[] {
  const list: VitalSign[] = []
  const now = Date.now()
  for (let i = 9; i >= 0; i--) {
    const d = new Date(now - i * 86400000)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const date = `${y}-${m}-${day}`

    // 血压（收缩压/舒张压）
    const systolic = 125 + Math.round((Math.random() - 0.3) * 20)
    const diastolic = 80 + Math.round((Math.random() - 0.3) * 12)
    // 血糖
    const sugar = 6.0 + (Math.random() - 0.4) * 2.0
    // 心率
    const heartRate = 70 + Math.round((Math.random() - 0.3) * 15)

    list.push({
      id: `demo_bp_${i}`,
      type: 'bloodPressure',
      systolic, diastolic,
      fasting: true,
      date, time: '08:00',
      createdAt: d.toISOString(),
      abnormal: systolic >= 140 || diastolic >= 90,
      warning: systolic >= 140 ? '收缩压偏高，建议加强监测并咨询医生' : undefined
    })
    list.push({
      id: `demo_bs_${i}`,
      type: 'bloodSugar',
      sugar: Math.round(sugar * 10) / 10,
      fasting: true,
      date, time: '07:30',
      createdAt: d.toISOString(),
      abnormal: sugar >= 7.0,
      warning: sugar >= 7.0 ? '空腹血糖偏高，建议调整饮食后复查' : undefined
    })
    list.push({
      id: `demo_hr_${i}`,
      type: 'heartRate',
      heartRate,
      fasting: true,
      date, time: '08:00',
      createdAt: d.toISOString(),
      abnormal: heartRate >= 100 || heartRate <= 55,
      warning: heartRate >= 100 ? '心率偏快，请留意休息' : undefined
    })
  }
  return list
}

/** 默认体检报告 */
function buildReport(): HealthReport {
  const items: ReportItem[] = [
    // 血常规
    { name: '白细胞计数(WBC)', value: '6.8', reference: '4.0-10.0', unit: '×10⁹/L', status: 'normal', category: '血常规',
      explain: '白细胞在正常范围，身体抵抗力状态良好。', advice: '继续保持规律作息与适量运动。' },
    { name: '红细胞计数(RBC)', value: '4.62', reference: '4.0-5.5', unit: '×10¹²/L', status: 'normal', category: '血常规',
      explain: '红细胞数量正常，供血供氧能力良好。', advice: '适量食用瘦肉、红枣、黑木耳等补铁食材。' },
    { name: '血红蛋白(HGB)', value: '138', reference: '120-160', unit: 'g/L', status: 'normal', category: '血常规',
      explain: '血红蛋白处于健康范围，没有贫血迹象。', advice: '日常注意均衡饮食，无需特别补充。' },
    { name: '血小板(PLT)', value: '212', reference: '100-300', unit: '×10⁹/L', status: 'normal', category: '血常规',
      explain: '血小板正常，凝血功能良好。', advice: '如长期服用阿司匹林请留意皮肤是否有瘀斑。' },

    // 肝功能
    { name: '谷丙转氨酶(ALT)', value: '32', reference: '7-40', unit: 'U/L', status: 'normal', category: '肝功能',
      explain: '肝功能核心指标正常，肝脏代谢状态良好。', advice: '限制饮酒，避免自行长期服药损肝。' },
    { name: '谷草转氨酶(AST)', value: '28', reference: '13-35', unit: 'U/L', status: 'normal', category: '肝功能',
      explain: '谷草转氨酶正常。', advice: '保持健康作息，避免熬夜。' },
    { name: '总胆红素(TBIL)', value: '14.2', reference: '3.4-20.5', unit: 'μmol/L', status: 'normal', category: '肝功能',
      explain: '胆红素正常，无黄疸风险。', advice: '定期复查即可。' },

    // 血糖血脂
    { name: '空腹血糖(GLU)', value: '7.2', reference: '3.9-6.1', unit: 'mmol/L', status: 'high', category: '血糖血脂',
      explain: '空腹血糖略高于正常值，提示糖尿病前期或糖尿病。', advice: '控制主食量，每日步行30分钟；建议内分泌科复查。' },
    { name: '总胆固醇(TC)', value: '5.8', reference: '<5.2', unit: 'mmol/L', status: 'high', category: '血糖血脂',
      explain: '总胆固醇偏高，动脉硬化风险增加。', advice: '减少动物内脏、肥肉、油炸食品摄入；坚持规律运动。' },
    { name: '低密度脂蛋白(LDL-C)', value: '3.8', reference: '<3.4', unit: 'mmol/L', status: 'high', category: '血糖血脂',
      explain: '坏胆固醇偏高，是心脑血管疾病主要危险因素。', advice: '遵医嘱服用他汀类药物；每周至少3次有氧运动。' },
    { name: '甘油三酯(TG)', value: '1.9', reference: '<1.7', unit: 'mmol/L', status: 'high', category: '血糖血脂',
      explain: '甘油三酯轻度偏高，与饮食结构及饮酒关系大。', advice: '戒酒、减少甜食和精制米面；增加蔬菜与粗粮。' },
    { name: '高密度脂蛋白(HDL-C)', value: '1.1', reference: '>1.0', unit: 'mmol/L', status: 'normal', category: '血糖血脂',
      explain: '好胆固醇正常，对血管有保护作用。', advice: '适量食用坚果、深海鱼。' },

    // 肾功能
    { name: '血肌酐(Cr)', value: '88', reference: '57-97', unit: 'μmol/L', status: 'normal', category: '肾功能',
      explain: '肌酐正常，肾功能良好。', advice: '注意补水，避免长期使用肾毒性药物。' },
    { name: '尿素氮(BUN)', value: '5.6', reference: '2.9-8.2', unit: 'mmol/L', status: 'normal', category: '肾功能',
      explain: '尿素氮正常。', advice: '保持适量饮水。' },

    // 血压（报告中的整体评估）
    { name: '收缩压', value: '142', reference: '90-140', unit: 'mmHg', status: 'high', category: '基础体征',
      explain: '收缩压略高，处于高血压一级。', advice: '低盐饮食（每日<5克），每日监测血压；必要时门诊调药。' },
    { name: '舒张压', value: '88', reference: '60-90', unit: 'mmHg', status: 'normal', category: '基础体征',
      explain: '舒张压接近上限。', advice: '保持情绪平稳，避免熬夜与过度劳累。' }
  ]
  const abnormalCount = items.filter(i => i.status !== 'normal').length
  return {
    id: 'demo_report_1',
    title: '2026年度例行体检报告',
    date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
    hospital: '市第一人民医院健康管理中心',
    items,
    summary: `本次体检共 ${items.length} 项指标，其中 ${abnormalCount} 项异常，主要集中在血糖与血脂方向。整体状态尚可，建议重点关注：①空腹血糖偏高——需复查糖化血红蛋白；②血脂四项异常——需饮食+运动管理并门诊复诊；③收缩压轻度升高——建议家庭每日监测。`,
    createdAt: new Date().toISOString()
  }
}

export const DEFAULT_REPORTS: HealthReport[] = [buildReport()]

/** 科普文章（规则引擎根据用户异常动态推荐） */
export const POPULAR_ARTICLES: PopularArticle[] = [
  {
    id: 'pop_1',
    title: '高血压大爷的一天：三餐+运动都该怎么做？',
    cover: '🫀',
    tags: ['高血压', '饮食', '运动'],
    summary: '从早餐到睡前，手把手告诉您每天怎么吃、怎么动，才能把血压稳稳管好。',
    matched: '血压偏高',
    content:
`高血压朋友的一天，其实只要养成几个简单习惯就够了。

1. 【早餐：少盐少油】
   推荐：燕麦粥、水煮蛋、一小把核桃；避免咸菜、腊肉、油条。
   每天食盐总量控制在5克以内，大概一个啤酒盖的量。

2. 【上午：30分钟快走】
   饭后半小时出门散步，速度以"能说话但不能唱歌"为宜。
   一周至少5次，每次30分钟以上。

3. 【午餐：多蔬菜+优质蛋白】
   主食不超过一碗；蔬菜至少占盘子一半；
   推荐清蒸鱼、豆腐、鸡胸肉。

4. 【下午：一杯温水+心情平稳】
   少喝浓茶、咖啡；避免情绪激动、与人争执。
   测量血压前静坐10分钟。

5. 【晚餐：七分饱】
   晚餐清淡，不喝酒；睡前可以喝一小杯温牛奶助眠。

坚持三个月，血压通常会有明显改善。如有头晕、心慌请及时就医。`
  },
  {
    id: 'pop_2',
    title: '血糖偏高别怕！科学控糖的5个家常菜',
    cover: '🍚',
    tags: ['糖尿病', '饮食调理'],
    summary: '告别白米饭白馒头，教您用家常食材吃出平稳血糖。',
    matched: '血糖异常',
    content:
`控糖不是不吃饭，而是会吃饭。以下5个家常菜，非常适合糖友：

① 【杂粮饭】—— 大米:杂粮 = 1:1（燕麦、糙米、荞麦）
② 【清蒸鲈鱼】—— 优质蛋白，不升糖
③ 【凉拌菠菜】—— 开水焯1分钟，加少量香油，大量纤维
④ 【豆腐木耳炖菜】—— 植物蛋白+铁，营养丰富且低糖
⑤ 【番茄鸡蛋汤】—— 少油少盐，餐前来一碗增加饱腹感

控糖关键口诀：
- 先吃蔬菜再吃肉，最后吃主食
- 每顿饭主食不超过一个拳头大小
- 一天水果总量不超过一个苹果（分两次吃）
- 餐后散步20-30分钟，血糖真的会稳很多

每月复查一次血糖，有疑问及时联系家庭医生。`
  },
  {
    id: 'pop_3',
    title: '血脂超标怎么吃？一张表看懂"好/坏脂肪"',
    cover: '🥗',
    tags: ['高血脂', '饮食'],
    summary: '肥肉不是唯一敌人，看清哪些食物真正伤血管。',
    matched: '血脂异常',
    content:
`高血脂是心脑血管疾病的"沉默杀手"，饮食是第一道防线。

✅ 推荐吃（好脂肪）：
• 深海鱼（三文鱼、鲭鱼）—— 每周2-3次
• 坚果（核桃、杏仁）—— 每日一小把
• 橄榄油、茶籽油 —— 代替部分炒菜油

❌ 尽量少吃（坏脂肪）：
• 动物内脏、肥肉、腊肉
• 油炸食品（炸鸡、油条、薯片）
• 奶油蛋糕、甜点、含糖饮料

🥦 每日饮食建议：
• 蔬菜 ≥ 500克（深色蔬菜占一半）
• 粗粮占主食 1/3
• 每日饮水 1500-1700 毫升（7-8杯）
• 戒烟限酒

坚持饮食+运动管理 3 个月后复查血脂，多数人可以明显改善。`
  },
  {
    id: 'pop_4',
    title: '老人居家安全用药：这6个错误千万别犯',
    cover: '💊',
    tags: ['用药安全', '科普'],
    summary: '漏服、加量、混吃… 吃药不注意反伤身体，子女也应该了解。',
    matched: '多药共用',
    content:
`很多老人长期服药，以下6个常见错误请务必避免：

① 【擅自加减量】—— 觉得自己好了就停药，或没效就加倍。正确做法：按医嘱服用，有变化先咨询医生。
② 【漏服后加倍补】—— 如已接近下次服药时间，直接跳过这一次，不可双倍一起吃。
③ 【用茶水/果汁送药】—— 会影响很多药物吸收，用温水最安全。
④ 【空腹/饱腹乱吃】—— 降压药、降糖药、胃药对时间有严格要求，请按说明书或医嘱。
⑤ 【保健品当药吃】—— 保健品不能治病，不能代替正规药物。
⑥ 【多药同服不问医生】—— 不同药物间可能相互影响，就诊时请把所有药品告诉医生。

每次服药前核对"三查七对"，把用药习惯告诉家人，互相监督更安全。`
  },
  {
    id: 'pop_5',
    title: '每天走多少步才健康？别被一万步骗了',
    cover: '🚶',
    tags: ['运动', '养生'],
    summary: '科学研究告诉您：老年人每天走这个步数最合适。',
    matched: '通用科普',
    content:
`最新医学研究表明：老年人并非"越多越好"，量力而行才是王道。

✔ 推荐目标：每日 6000-8000 步
✔ 中等强度：微微出汗、能说话但无法唱歌
✔ 运动时长：30-45 分钟/次，每周 5 次以上

注意事项：
• 避免清晨气温过低时出门，尤其冬天
• 有心血管疾病的老人应随身携带硝酸甘油等急救药
• 走平路优先，尽量避免爬楼和陡坡
• 感到胸闷、头晕、关节疼痛时立刻停下来休息

除了散步，太极、八段锦、广场舞也是非常好的选择。让运动成为习惯，健康才会来找您。`
  },
  {
    id: 'pop_6',
    title: '睡眠不好怎么办？老人改善睡眠的6个小技巧',
    cover: '🌙',
    tags: ['睡眠', '养生'],
    summary: '入睡难、起夜多、早醒…老年人睡眠问题可以这样改善。',
    matched: '通用科普',
    content:
`老年人睡眠问题很常见，但并非不可改善。试试以下6个方法：

① 【固定作息】—— 每天同一时间上床和起床，包括周末
② 【白天多晒晒太阳】—— 早晨晒15-20分钟太阳，有助于调节生物钟
③ 【下午3点后不喝茶、咖啡】
④ 【晚餐七分饱，睡前不饮水过多，减少起夜】
⑤ 【卧室温度18-22℃，暗、静】
⑥ 【睡不着不要硬躺】—— 起来静坐、听轻音乐，有睡意再上床

另外，规律运动和保持愉悦心情，对睡眠质量改善非常明显。如长期失眠建议就诊神经内科或睡眠中心。`
  }
]

/** 子女关怀端示例消息 */
export function buildDefaultChildMessages(): ChildMessage[] {
  return [
    { id: 'c_1', title: '血压轻微偏高', content: '爸爸今早血压 142/88 mmHg，已提醒按时服药，您可电话关心一下。', level: 'warn', time: '今天 08:15' },
    { id: 'c_2', title: '用药全部按时完成', content: '妈妈昨日服药记录 2/2 全部按时完成，状态良好。', level: 'info', time: '昨天 22:30' },
    { id: 'c_3', title: '⚠ 高危预警：空腹血糖 8.1', content: '检测到空腹血糖超过阈值，已自动提醒复查，并在父母端弹出预警提示。', level: 'danger', time: '2天前 07:45' },
    { id: 'c_4', title: '周健康简报已生成', content: '本周血压平均 132/84，血糖平均 6.7，整体较上周有改善。', level: 'info', time: '3天前 20:00' }
  ]
}

/** 安全阈值判断（返回 {abnormal, warning}） */
export function checkBloodPressure(systolic: number, diastolic: number): { abnormal: boolean; warning: string } {
  if (systolic >= 160 || diastolic >= 100) return { abnormal: true, warning: '血压严重偏高（二级高血压），强烈建议立即就医！' }
  if (systolic >= 140 || diastolic >= 90) return { abnormal: true, warning: '血压轻度偏高，建议加强监测并咨询医生。' }
  if (systolic < 90 || diastolic < 60) return { abnormal: true, warning: '血压偏低，注意头晕、乏力等不适，必要时就医。' }
  return { abnormal: false, warning: '血压在健康范围，保持良好习惯。' }
}

export function checkBloodSugar(sugar: number, fasting: boolean): { abnormal: boolean; warning: string } {
  if (fasting) {
    if (sugar >= 7.0) return { abnormal: true, warning: '空腹血糖偏高（≥7.0），请尽快复查糖化血红蛋白。' }
    if (sugar < 3.9) return { abnormal: true, warning: '低血糖，立即补充碳水化合物（饼干/糖水）。' }
    return { abnormal: false, warning: '空腹血糖正常。' }
  } else {
    if (sugar >= 11.1) return { abnormal: true, warning: '餐后血糖严重偏高，建议内分泌科复诊。' }
    if (sugar >= 7.8) return { abnormal: true, warning: '餐后血糖偏高，糖尿病前期可能，建议饮食+运动管理。' }
    return { abnormal: false, warning: '餐后血糖正常。' }
  }
}

export function checkHeartRate(rate: number): { abnormal: boolean; warning: string } {
  if (rate >= 120) return { abnormal: true, warning: '心率过快，请立即休息并就医。' }
  if (rate >= 100) return { abnormal: true, warning: '心率偏快，注意休息与情绪稳定。' }
  if (rate <= 50) return { abnormal: true, warning: '心率偏慢，如有头晕、胸闷请及时就诊。' }
  return { abnormal: false, warning: '心率正常。' }
}
