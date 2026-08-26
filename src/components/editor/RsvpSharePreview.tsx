'use client'

/** 별도 RSVP 링크 카카오/OG 공유 미리보기 카드 (에디터 표시용 목업) */
export default function RsvpSharePreview({
  image,
  title,
  desc,
}: {
  image?: string
  title?: string
  desc?: string
}) {
  const displayTitle = title || '참석 여부 안내'
  const displayDesc = desc || '예식 준비를 위해 참석 여부를 미리 알려주시면 감사하겠습니다.'

  return (
    <div className="space-y-1">
      <p className="text-[10px] text-gray-400">공유 미리보기</p>
      <div className="w-[210px] overflow-hidden rounded-lg border border-gray-200 bg-white">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="w-full object-cover" style={{ aspectRatio: '1.91 / 1' }} />
        ) : (
          <div className="flex w-full items-center justify-center bg-gray-50 text-[10px] text-gray-400" style={{ aspectRatio: '1.91 / 1' }}>
            썸네일 없음 (올리면 이미지 카드로 공유)
          </div>
        )}
        <div className="px-2.5 py-2">
          <p className="truncate text-[12px] font-medium text-gray-800">{displayTitle}</p>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-gray-500">{displayDesc}</p>
          <p className="mt-1 text-[10px] text-gray-400">invite.deardrawer.com</p>
        </div>
      </div>
    </div>
  )
}
