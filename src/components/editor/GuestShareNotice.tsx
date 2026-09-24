/**
 * 에디터 publish 스텝에 남기는 안내(링크 없음).
 * 하객 사진 공유 · 결혼식 한 조각 등 '결혼식 후' 설정은 결제 후 '내 서랍'에서 관리한다.
 * (기존엔 에디터에 GuestShareSettings/StampMessageEditor를 직접 두었으나 내 서랍으로 이관)
 */
export default function GuestShareNotice() {
  return (
    <section className="mt-4 space-y-3">
      <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 8h18M8 5v3" />
        </svg>
        하객 사진 공유
      </h3>
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-medium text-gray-800">
          하객이 찍어준 결혼식 사진을 한곳에 모을 수 있어요.
        </p>
        <p className="mt-1 text-xs text-gray-500 leading-relaxed">
          결제 후 열리는 <b>내 서랍</b>에서 사진 공유를 켜고, 하객에게 공유 링크를 보낼 수 있어요.
          받은 사진은 두 사람의 Google Drive에 자동으로 보관됩니다.
        </p>
      </div>
    </section>
  )
}
