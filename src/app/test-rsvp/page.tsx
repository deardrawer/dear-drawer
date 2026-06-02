'use client'

import { useState } from 'react'

export default function TestRsvpPage() {
  const [slugInput, setSlugInput] = useState('')
  const [lookupResult, setLookupResult] = useState<string | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [invitationId, setInvitationId] = useState('')
  const [guestName, setGuestName] = useState('')
  const [attendance, setAttendance] = useState<'attending' | 'not_attending' | 'pending'>('attending')
  const [guestCount, setGuestCount] = useState(1)
  const [side, setSide] = useState<'groom' | 'bride'>('groom')
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Geunnal dashboard test
  const [geunnalPageId, setGeunnalPageId] = useState('')
  const [geunnalToken, setGeunnalToken] = useState('')
  const [rsvpResult, setRsvpResult] = useState<string | null>(null)
  const [rsvpLoading, setRsvpLoading] = useState(false)

  const handleSubmitRsvp = async () => {
    if (!invitationId || !guestName) {
      setResult('invitationId와 guestName은 필수입니다')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId,
          guestName,
          attendance,
          guestCount: attendance === 'attending' ? guestCount : 0,
          side,
          message: message || undefined,
        }),
      })
      const data = await res.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (err) {
      setResult(`Error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFetchRsvp = async () => {
    if (!geunnalPageId || !geunnalToken) {
      setRsvpResult('pageId와 token은 필수입니다')
      return
    }
    setRsvpLoading(true)
    setRsvpResult(null)
    try {
      const res = await fetch(`/api/geunnal/rsvp?pageId=${geunnalPageId}`, {
        headers: { 'Authorization': `Bearer ${geunnalToken}` },
      })
      const data = await res.json()
      setRsvpResult(JSON.stringify(data, null, 2))
    } catch (err) {
      setRsvpResult(`Error: ${err}`)
    } finally {
      setRsvpLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">RSVP Test Page</h1>

        {/* Section 0: Slug → ID lookup */}
        <section className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">0. Slug → Invitation ID 조회</h2>
          <p className="text-sm text-gray-500 mb-4">청첩장 URL의 slug로 invitation ID를 조회합니다.</p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={slugInput}
                onChange={e => setSlugInput(e.target.value)}
                placeholder="invitation-d8gebg"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                URL에서 /i/ 뒤의 부분 (예: invite.deardrawer.com/i/<b>invitation-d8gebg</b>)
              </p>
            </div>

            <button
              onClick={async () => {
                if (!slugInput) return
                setLookupLoading(true)
                setLookupResult(null)
                try {
                  const res = await fetch(`/api/test-rsvp/lookup?slug=${encodeURIComponent(slugInput)}`)
                  const data = (await res.json()) as { id?: string; slug?: string }
                  if (data.id) {
                    setInvitationId(data.id)
                    setLookupResult(`ID: ${data.id}\nSlug: ${data.slug}`)
                  } else {
                    setLookupResult(JSON.stringify(data, null, 2))
                  }
                } catch (err) {
                  setLookupResult(`Error: ${err}`)
                } finally {
                  setLookupLoading(false)
                }
              }}
              disabled={lookupLoading}
              className="w-full py-2.5 bg-gray-800 text-white rounded-lg font-medium text-sm disabled:opacity-50"
            >
              {lookupLoading ? '조회 중...' : 'ID 조회'}
            </button>

            {lookupResult && (
              <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-auto max-h-32">
                {lookupResult}
              </pre>
            )}
          </div>
        </section>

        {/* Section 1: Submit RSVP (Guest simulation) */}
        <section className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">1. RSVP 제출 테스트 (게스트 시뮬레이션)</h2>
          <p className="text-sm text-gray-500 mb-4">RSVP를 제출하면 해당 invitation에 연결된 Geunnal 페이지에 푸시 알림이 전송됩니다.</p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invitation ID *</label>
              <input
                type="text"
                value={invitationId}
                onChange={e => setInvitationId(e.target.value)}
                placeholder="invitations 테이블의 id"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
              <input
                type="text"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder="테스트 게스트"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">참석 여부</label>
              <select
                value={attendance}
                onChange={e => setAttendance(e.target.value as typeof attendance)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="attending">참석</option>
                <option value="not_attending">불참</option>
                <option value="pending">미정</option>
              </select>
            </div>

            {attendance === 'attending' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">동행 인원</label>
                <input
                  type="number"
                  value={guestCount}
                  onChange={e => setGuestCount(Number(e.target.value))}
                  min={1}
                  max={10}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">소속</label>
              <select
                value={side}
                onChange={e => setSide(e.target.value as typeof side)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="groom">신랑측</option>
                <option value="bride">신부측</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">메시지 (선택)</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="축하합니다!"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                rows={2}
              />
            </div>

            <button
              onClick={handleSubmitRsvp}
              disabled={loading}
              className="w-full py-2.5 bg-purple-600 text-white rounded-lg font-medium text-sm disabled:opacity-50"
            >
              {loading ? '전송 중...' : 'RSVP 제출'}
            </button>

            {result && (
              <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-auto max-h-48">
                {result}
              </pre>
            )}
          </div>
        </section>

        {/* Section 2: Fetch RSVP via Geunnal API */}
        <section className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">2. Geunnal RSVP API 조회 테스트</h2>
          <p className="text-sm text-gray-500 mb-4">Geunnal 토큰으로 참석현황 API를 직접 호출합니다.</p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Page ID</label>
              <input
                type="text"
                value={geunnalPageId}
                onChange={e => setGeunnalPageId(e.target.value)}
                placeholder="geunnal_pages 테이블의 id"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Token</label>
              <input
                type="text"
                value={geunnalToken}
                onChange={e => setGeunnalToken(e.target.value)}
                placeholder="localStorage에서 geunnal-token-{pageId} 확인"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                브라우저 DevTools → Application → Local Storage에서 geunnal-token-* 값 복사
              </p>
            </div>

            <button
              onClick={handleFetchRsvp}
              disabled={rsvpLoading}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm disabled:opacity-50"
            >
              {rsvpLoading ? '조회 중...' : 'RSVP 조회'}
            </button>

            {rsvpResult && (
              <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-auto max-h-64">
                {rsvpResult}
              </pre>
            )}
          </div>
        </section>

        {/* Section 3: Quick links */}
        <section className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">3. 테스트 순서 가이드</h2>
          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>Geunnal 페이지에 로그인하여 푸시 알림을 허용합니다 (/g/[slug])</li>
            <li>해당 페이지의 invitation_id를 확인합니다 (DB 또는 API)</li>
            <li>위 폼에서 해당 invitation_id로 RSVP를 제출합니다</li>
            <li>Geunnal PWA에서 푸시 알림이 수신되는지 확인합니다</li>
            <li>Geunnal 대시보드 → 참석현황 탭에서 응답이 표시되는지 확인합니다</li>
            <li>30초 후 자동 갱신으로 새 응답이 반영되는지 확인합니다</li>
          </ol>
        </section>
      </div>
    </div>
  )
}
