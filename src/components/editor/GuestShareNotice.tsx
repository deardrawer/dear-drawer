'use client'

/**
 * 에디터의 하객 사진 공유 — 모든 템플릿 에디터에서 같은 설정(계정에 하나)을 바로 고친다.
 * (예전엔 '결제 후 내 서랍에서' 안내만 있었음 → THE PHONE 에디터와 같은 패널을 그대로 연결)
 */
import CoupleGuestSharePanel from './CoupleGuestSharePanel'
import { uploadImage } from '@/lib/imageUpload'

// 패널은 에디터 셸 토큰(--ed-*)을 쓰므로, 토큰이 없는 에디터에서도 보이게 기본값을 깔아 둔다
const TOKENS = {
  '--ed-text': '#2C2824', '--ed-text-muted': '#6E6660', '--ed-border': 'rgba(44,40,36,0.12)', '--ed-accent': '#7A5A44',
} as React.CSSProperties

export default function GuestShareNotice({ invitationId }: { invitationId?: string | null } = {}) {
  return (
    <section className="mt-4 space-y-3" style={TOKENS}>
      <h3 className="text-base font-semibold text-gray-900">하객 사진 공유</h3>
      <CoupleGuestSharePanel
        upload={async f => {
          const r = await uploadImage(f, { invitationId: invitationId || undefined })
          return r.success && r.webUrl ? r.webUrl : null
        }}
      />
    </section>
  )
}
