/**
 * 청첩장 → 하객 사진 공유 페이지 진입 FAB (오버레이).
 * InvitationClient 내부를 건드리지 않고 page.tsx에서 조건부로 덧붙인다.
 * (guest_share_enabled === 1 && !preview && !sample 일 때만 렌더)
 */
export default function GuestShareFab({ slug }: { slug: string }) {
  return (
    <a
      href={`/i/${slug}/share`}
      aria-label="하객 사진 공유"
      className="fixed right-4 bottom-24 z-[60] flex items-center gap-1.5 rounded-full bg-neutral-900/90 px-4 py-2.5 text-sm font-medium text-white shadow-lg backdrop-blur transition active:scale-95"
    >
      <span aria-hidden>📷</span>
      <span>사진 공유</span>
    </a>
  )
}
