import RsvpBoard from '../../RsvpBoard'

export const metadata = { title: 'RSVP 현황' }

/** [공유] 비밀번호로 열람하는 읽기 전용 RSVP 현황. */
export default async function SharedRsvpPage({ params }: { params: Promise<{ shareSlug: string }> }) {
  const { shareSlug } = await params
  return <RsvpBoard shareSlug={shareSlug} />
}
