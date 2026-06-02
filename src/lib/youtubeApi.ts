/* ── YouTube IFrame API 로더 (모듈 레벨 싱글턴) ── */
let _ytApiReady = false
const _ytApiQueue: (() => void)[] = []

export function loadYouTubeApi(cb: () => void) {
  if (_ytApiReady) { cb(); return }
  if (typeof window === 'undefined') return
  if ((window as any).YT?.Player) { _ytApiReady = true; cb(); return }
  _ytApiQueue.push(cb)
  if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
    const prev = (window as any).onYouTubeIframeAPIReady
    ;(window as any).onYouTubeIframeAPIReady = () => {
      prev?.()
      _ytApiReady = true
      _ytApiQueue.forEach(fn => fn())
      _ytApiQueue.length = 0
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  }
}
