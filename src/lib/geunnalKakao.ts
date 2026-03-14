// Kakao Share SDK for Geunnal
// Window.Kakao type is declared in src/app/invite/[inviteId]/admin/dashboard/page.tsx

interface KakaoShareOptions {
  objectType: 'feed'
  content: {
    title: string
    description: string
    imageUrl: string
    link: {
      mobileWebUrl: string
      webUrl: string
    }
  }
  buttons?: Array<{
    title: string
    link: {
      mobileWebUrl: string
      webUrl: string
    }
  }>
}

let initialized = false

export function initKakao() {
  if (initialized) return
  const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || '0890847927f3189d845391481ead8ecc'
  if (!key || typeof window === 'undefined' || !window.Kakao) return

  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(key)
  }
  initialized = true
}

export function sendKakaoShare(options: {
  title: string
  description: string
  url: string
  imageUrl?: string
}) {
  initKakao()

  if (!window.Kakao?.Share) {
    throw new Error('Kakao SDK not loaded')
  }

  window.Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: options.title,
      description: options.description,
      imageUrl: options.imageUrl || '',
      link: {
        mobileWebUrl: options.url,
        webUrl: options.url,
      },
    },
    buttons: [
      {
        title: '모임 관리하기',
        link: {
          mobileWebUrl: options.url,
          webUrl: options.url,
        },
      },
    ],
  })
}
