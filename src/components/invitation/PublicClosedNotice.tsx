// 공개 종료된 청첩장에 게스트가 접근했을 때 보여주는 안내 화면(서버 컴포넌트).
// 데이터는 삭제되지 않고 POST DRAWER에 보관되며, 여기서는 화면 노출만 막는다.
export default function PublicClosedNotice() {
  return (
    <main style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f5f1', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ maxWidth: 360 }}>
        <p style={{ fontSize: 40, margin: '0 0 18px' }}>🤍</p>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: '#3a352c', margin: '0 0 10px' }}>함께 축하해주셔서 감사합니다</h1>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: '#8b8271', margin: 0 }}>두 사람의 예식이<br />행복하게 마무리되었습니다.</p>
      </div>
    </main>
  )
}
