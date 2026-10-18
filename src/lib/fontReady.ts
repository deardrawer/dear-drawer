// 글꼴이 실제로 받아져 쓸 수 있을 때까지 기다린다.
// document.fonts.load()/check() 는 글꼴 CSS(<link>)가 아직 붙기 전이면 '기다릴 글꼴 없음'으로 보고 바로 끝나서,
// 캔버스에 기본 글꼴로 먼저 그려지는 문제가 있었다 (처음 열 때만 깨지고 다시 열면 정상).
// 해당 이름의 글꼴이 등록되어 'loaded' 가 될 때까지 다시 확인하고, 시간이 지나면 그대로 진행한다.
export function whenFontReady(family: string, sample = 'Aa&가', timeoutMs = 5000): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve()
  const name = family.split(',')[0].replace(/['"]/g, '').trim()
  const start = Date.now()
  const loaded = () => {
    let ok = false
    document.fonts.forEach((f) => { if (f.family.replace(/['"]/g, '').trim() === name && f.status === 'loaded') ok = true })
    return ok
  }
  return new Promise((resolve) => {
    const tick = () => {
      if (loaded() || Date.now() - start > timeoutMs) { resolve(); return }
      document.fonts.load(`40px "${name}"`, sample).then(
        () => { if (loaded() || Date.now() - start > timeoutMs) resolve(); else setTimeout(tick, 150) },
        () => resolve(),
      )
    }
    tick()
  })
}
