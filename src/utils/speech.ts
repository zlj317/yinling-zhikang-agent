// ============================================================================
// Web Speech API 语音朗读工具（老年无障碍核心能力）
// - 统一朗放入口，支持中文、可中断、可调节语速
// 复赛可扩展：接入讯飞/百度/腾讯云 TTS 高品质语音合成
// ============================================================================

let current: SpeechSynthesisUtterance | null = null

export function speak(text: string, opts?: { rate?: number; pitch?: number; onEnd?: () => void }): void {
  if (!text || !text.trim()) return
  if (!('speechSynthesis' in window)) {
    alert('当前浏览器不支持语音朗读功能，建议使用最新版 Chrome / Edge')
    return
  }
  stop()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'zh-CN'
  u.rate = opts?.rate ?? 0.95
  u.pitch = opts?.pitch ?? 1
  u.onend = () => {
    current = null
    opts?.onEnd?.()
  }
  current = u
  window.speechSynthesis.speak(u)
}

export function stop(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    current = null
  }
}

export function isSpeaking(): boolean {
  return !!current && 'speechSynthesis' in window && window.speechSynthesis.speaking
}
