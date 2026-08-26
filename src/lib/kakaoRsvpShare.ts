/**
 * 별도 RSVP 링크를 카카오톡 메시지로 직접 전송.
 * URL 붙여넣기(스크랩+캐시) 방식과 달리, 제목·설명·이미지를 페이로드에 직접 실어
 * 보내므로 수정 즉시 반영되고 카카오 캐시 영향을 받지 않는다.
 * - 커스텀 썸네일이 있으면 'feed'(이미지 카드), 없으면 'text'(이미지 없는 텍스트 카드)
 * (SDK는 root layout에서 전역 로드됨)
 */

const PROD = 'https://invite.deardrawer.com'
const DEFAULT_TITLE = '참석 여부 안내'
const DEFAULT_DESC = '예식 준비를 위해 참석 여부를 미리 알려주시면 감사하겠습니다.'

function toAbsolute(u?: string): string {
  if (!u) return ''
  if (u.startsWith('https://')) return u
  if (u.startsWith('http://')) return u.replace('http://', 'https://')
  if (u.startsWith('/')) return `${PROD}${u}`
  return `${PROD}/${u}`
}

export function shareRsvpToKakao(opts: {
  url: string
  title?: string
  desc?: string
  image?: string
}) {
  const { url } = opts
  const kakaoWindow = window as typeof window & {
    Kakao?: {
      isInitialized?: () => boolean
      init?: (key: string) => void
      Share?: { sendDefault: (config: object) => void }
    }
  }

  const copyFallback = (msg: string) => {
    navigator.clipboard?.writeText(url)
    alert(msg)
  }

  if (typeof window === 'undefined' || !kakaoWindow.Kakao) {
    copyFallback('카카오톡 공유를 사용할 수 없어 링크가 복사되었습니다.\n카카오톡에서 직접 붙여넣기 해주세요.')
    return
  }

  try {
    if (!kakaoWindow.Kakao.isInitialized?.()) {
      const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || '0890847927f3189d845391481ead8ecc'
      kakaoWindow.Kakao.init?.(kakaoKey)
    }
    if (!kakaoWindow.Kakao.Share?.sendDefault) {
      copyFallback('카카오톡 공유 준비 중입니다. 링크가 복사되었습니다.')
      return
    }

    const title = opts.title || DEFAULT_TITLE
    const description = opts.desc || DEFAULT_DESC
    const link = { mobileWebUrl: url, webUrl: url }
    const imageUrl = toAbsolute(opts.image)

    if (imageUrl) {
      // 커스텀 썸네일 있음 → 이미지 카드(feed)
      kakaoWindow.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: { title, description, imageUrl, imageWidth: 800, imageHeight: 420, link },
        buttons: [{ title: '참석 여부 전하기', link }],
      })
    } else {
      // 썸네일 없음 → 이미지 없는 텍스트 카드(text)
      kakaoWindow.Kakao.Share.sendDefault({
        objectType: 'text',
        text: `${title}\n\n${description}`,
        link,
        buttonTitle: '참석 여부 전하기',
      })
    }
  } catch (error) {
    console.error('Kakao RSVP share error:', error)
    copyFallback('카카오톡 공유에 실패했습니다. 링크가 복사되었습니다.')
  }
}
