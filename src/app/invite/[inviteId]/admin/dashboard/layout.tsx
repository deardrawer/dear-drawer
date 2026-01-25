import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '게스트 관리 - 혼주용 청첩장',
  description: '게스트를 관리하고 개인화된 링크를 생성하세요',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Pretendard 폰트 로드 */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
      />
      <div
        className="min-h-screen"
        style={{
          backgroundColor: '#F5F3EE',
          maxWidth: '480px',
          margin: '0 auto',
          fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        }}
      >
        {children}
        {/* 하단 safe area */}
        <div className="h-6" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
      </div>
    </>
  )
}
