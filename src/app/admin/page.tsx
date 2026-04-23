'use client'

import { useState, useEffect, useCallback } from 'react'

// ===== Types =====
interface Invitation {
  id: string
  user_id: string
  user_email?: string
  template_id: string
  groom_name: string | null
  bride_name: string | null
  wedding_date: string | null
  is_paid: number
  is_published: number
  created_at: string
  deletion_date: string
  deletion_reason: 'incomplete' | 'post_wedding'
  days_until_deletion: number
}

interface Stats {
  total_invitations: number
  published_invitations: number
  unpublished_invitations: number
  paid_invitations: number
  expiring_soon: number
  total_users: number
}

interface PaymentRequest {
  id: string
  user_id: string
  user_email: string | null
  invitation_id: string | null
  order_number: string
  buyer_name: string
  buyer_phone: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

type TabType = 'invitations' | 'payments' | 'geunnal'

interface GeunnalPageItem {
  id: string
  slug: string
  groom_name: string
  bride_name: string
  wedding_date: string | null
  invitation_id: string | null
  created_at: string
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [error, setError] = useState('')

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('invitations')

  // Invitations state
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [filter, setFilter] = useState<'all' | 'incomplete' | 'expiring' | 'paid'>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Payments state
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
  const [processingPayment, setProcessingPayment] = useState<string | null>(null)
  const [geunnalToggle, setGeunnalToggle] = useState<Record<string, boolean>>({})

  // Geunnal state
  const [geunnalPages, setGeunnalPages] = useState<GeunnalPageItem[]>([])
  const [showGeunnalForm, setShowGeunnalForm] = useState(false)
  const [geunnalForm, setGeunnalForm] = useState({ groom_name: '', bride_name: '', slug: '', wedding_date: '', password: '' })

  // Check saved auth on mount
  useEffect(() => {
    const savedPassword = localStorage.getItem('admin_password')
    if (savedPassword) {
      setPassword(savedPassword)
    }
    setIsInitialLoading(false)
  }, [])

  // Save password on auth success
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('admin_password', password)
    }
  }, [isAuthenticated, password])

  // ===== Invitations Functions =====
  const fetchInvitations = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin', {
        headers: { 'x-admin-password': password },
      })

      if (res.status === 401) {
        setIsAuthenticated(false)
        setError('인증 실패')
        return
      }

      if (!res.ok) {
        throw new Error('Failed to fetch')
      }

      const data = await res.json() as { invitations?: Invitation[]; stats?: Stats }
      setInvitations(data.invitations || [])
      setStats(data.stats || null)
      setIsAuthenticated(true)
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [password])

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id)
      return
    }

    try {
      const res = await fetch(`/api/admin?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      })

      if (res.ok) {
        fetchInvitations()
      }
    } catch (err) {
      console.error(err)
    }
    setDeleteConfirm(null)
  }

  const handleDeleteExpired = async () => {
    if (!confirm('만료된 모든 청첩장을 삭제하시겠습니까?')) return

    try {
      const res = await fetch('/api/admin?expired=true', {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      })

      if (res.ok) {
        const data = await res.json() as { deleted?: number }
        alert(`${data.deleted}개의 청첩장이 삭제되었습니다`)
        fetchInvitations()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleWatermark = async (invId: string, currentIsPaid: number) => {
    const newIsPaid = currentIsPaid === 1 ? 0 : 1
    const message = newIsPaid === 1
      ? '워터마크를 제거하시겠습니까? (is_paid → 1)'
      : '워터마크를 복원하시겠습니까? (is_paid → 0)'
    if (!confirm(message)) return

    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ id: invId, is_paid: newIsPaid }),
      })

      if (res.ok) {
        setInvitations(prev =>
          prev.map(inv =>
            inv.id === invId ? { ...inv, is_paid: newIsPaid } : inv
          )
        )
      } else {
        alert('업데이트에 실패했습니다.')
      }
    } catch (err) {
      console.error(err)
      alert('업데이트에 실패했습니다.')
    }
  }

  // ===== Payment Functions =====
  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/payment-requests')
      if (res.ok) {
        const data = await res.json() as { requests?: PaymentRequest[] }
        const requests = data.requests || []
        setPaymentRequests(requests)
        // Initialize geunnal toggle for new pending requests (default: ON)
        setGeunnalToggle(prev => {
          const next = { ...prev }
          for (const req of requests) {
            if (req.status === 'pending' && !(req.id in next)) {
              next[req.id] = true
            }
          }
          return next
        })
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err)
    }
  }, [])

  const handleApprove = async (requestId: string) => {
    if (!confirm('이 결제를 승인하시겠습니까?')) return

    setProcessingPayment(requestId)
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, createGeunnal: geunnalToggle[requestId] ?? true }),
      })

      if (res.ok) {
        alert('승인되었습니다.')
        fetchPayments()
      } else {
        const data = await res.json() as { error?: string }
        alert(data.error || '승인에 실패했습니다.')
      }
    } catch {
      alert('승인에 실패했습니다.')
    } finally {
      setProcessingPayment(null)
    }
  }

  const handleReject = async (requestId: string) => {
    if (!confirm('이 결제를 거절하시겠습니까?')) return

    setProcessingPayment(requestId)
    try {
      const res = await fetch('/api/admin/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      })

      if (res.ok) {
        alert('거절되었습니다.')
        fetchPayments()
      } else {
        const data = await res.json() as { error?: string }
        alert(data.error || '거절에 실패했습니다.')
      }
    } catch {
      alert('거절에 실패했습니다.')
    } finally {
      setProcessingPayment(null)
    }
  }

  // ===== Auth =====
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json() as { success?: boolean; error?: string }

      if (data.success) {
        setIsAuthenticated(true)
      } else {
        setError(data.error || '비밀번호가 올바르지 않습니다.')
      }
    } catch {
      setError('로그인에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_password')
    setIsAuthenticated(false)
    setPassword('')
    setInvitations([])
    setPaymentRequests([])
  }

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchInvitations()
      fetchPayments()
    }
  }, [isAuthenticated, fetchInvitations, fetchPayments])

  // ===== Computed =====
  const filteredInvitations = invitations.filter((inv) => {
    if (filter === 'incomplete') return !inv.is_published
    if (filter === 'expiring') return inv.days_until_deletion <= 7 && !inv.is_paid
    if (filter === 'paid') return inv.is_paid === 1
    return true
  })

  const pendingPayments = paymentRequests.filter((r) => r.status === 'pending')
  const processedPayments = paymentRequests.filter((r) => r.status !== 'pending')

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // ===== Render =====
  if (isInitialLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#F5F3EE' }}
      >
        <p className="text-gray-500">로딩중...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#F5F3EE' }}
      >
        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm"
        >
          <h1 className="text-xl font-bold mb-6 text-center" style={{ color: '#2C2C2C' }}>
            관리자 로그인
          </h1>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="관리자 비밀번호"
            className="w-full px-4 py-3 rounded-xl border mb-4"
            style={{ borderColor: '#E8E4DD' }}
            autoFocus
          />

          {error && (
            <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: '#C9A962' }}
          >
            {isLoading ? '로딩...' : '로그인'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3EE' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: '#FFF', borderBottom: '1px solid #E8E4DD' }}
      >
        <div>
          <div className="text-xs tracking-[2px]" style={{ color: '#C9A962' }}>
            ADMIN DASHBOARD
          </div>
          <h1 className="text-lg font-semibold" style={{ color: '#2C2C2C' }}>
            관리자 페이지
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-lg text-sm"
          style={{ backgroundColor: '#F5F3EE', color: '#666' }}
        >
          로그아웃
        </button>
      </header>

      {/* Tabs */}
      <div className="px-6 pt-4">
        <div className="flex gap-2 p-1 rounded-xl" style={{ backgroundColor: '#E8E4DD' }}>
          <button
            onClick={() => setActiveTab('invitations')}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: activeTab === 'invitations' ? '#FFF' : 'transparent',
              color: activeTab === 'invitations' ? '#2C2C2C' : '#888',
            }}
          >
            청첩장 관리
            {stats && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#C9A962', color: '#FFF' }}>
                {stats.total_invitations}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: activeTab === 'payments' ? '#FFF' : 'transparent',
              color: activeTab === 'payments' ? '#2C2C2C' : '#888',
            }}
          >
            결제 승인
            {pendingPayments.length > 0 && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#DC2626', color: '#FFF' }}>
                {pendingPayments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('geunnal'); fetchGeunnalPages() }}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: activeTab === 'geunnal' ? '#FFF' : 'transparent',
              color: activeTab === 'geunnal' ? '#2C2C2C' : '#888',
            }}
          >
            데이드로어 관리
            {geunnalPages.length > 0 && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#8B75D0', color: '#FFF' }}>
                {geunnalPages.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* ===== Invitations Tab ===== */}
        {activeTab === 'invitations' && (
          <>
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                {[
                  { label: '전체 청첩장', value: stats.total_invitations, color: '#2C2C2C' },
                  { label: '결제완료', value: stats.paid_invitations, color: '#2563EB' },
                  { label: '완성', value: stats.published_invitations, color: '#4CAF50' },
                  { label: '미완성', value: stats.unpublished_invitations, color: '#FF9800' },
                  { label: '7일내 삭제', value: stats.expiring_soon, color: '#DC2626' },
                  { label: '전체 사용자', value: stats.total_users, color: '#C9A962' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white rounded-xl p-4 text-center"
                  >
                    <div className="text-2xl font-bold" style={{ color: stat.color }}>
                      {stat.value}
                    </div>
                    <div className="text-xs" style={{ color: '#888' }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Filter & Actions */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex gap-2">
                {[
                  { key: 'all', label: '전체' },
                  { key: 'paid', label: '결제완료' },
                  { key: 'incomplete', label: '미완성' },
                  { key: 'expiring', label: '삭제 임박' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key as typeof filter)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      backgroundColor: filter === f.key ? '#C9A962' : '#FFF',
                      color: filter === f.key ? '#FFF' : '#666',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleDeleteExpired}
                className="ml-auto px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: '#DC2626' }}
              >
                만료된 항목 삭제
              </button>

              <button
                onClick={fetchInvitations}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: '#FFF', color: '#666' }}
              >
                새로고침
              </button>
            </div>

            {/* Invitations Table */}
            <div className="bg-white rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: '#F8F6F2' }}>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#888' }}>ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#888' }}>신랑/신부</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#888' }}>템플릿</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#888' }}>결혼일</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#888' }}>상태</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#888' }}>삭제 예정</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#888' }}>생성일</th>
                      <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: '#888' }}>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvitations.map((inv) => (
                      <tr
                        key={inv.id}
                        className="border-t"
                        style={{
                          borderColor: '#E8E4DD',
                          backgroundColor: inv.is_paid === 1
                            ? '#FFF'
                            : inv.days_until_deletion <= 0 ? '#FEF2F2' : inv.days_until_deletion <= 7 ? '#FFFBEB' : '#FFF',
                        }}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs" style={{ color: '#666' }}>
                            {inv.id.slice(0, 8)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {inv.user_email && (
                            <div className="text-sm font-medium mb-1" style={{ color: '#C9A962' }}>
                              {inv.user_email}
                            </div>
                          )}
                          <span className="text-sm" style={{ color: '#2C2C2C' }}>
                            {inv.groom_name || '-'} & {inv.bride_name || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#F5F3EE', color: '#666' }}>
                            {inv.template_id}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: '#666' }}>
                          {inv.wedding_date ? formatDate(inv.wedding_date) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {inv.is_paid === 1 && (
                              <span
                                className="text-xs px-2 py-1 rounded-full font-medium inline-block w-fit"
                                style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8' }}
                              >
                                결제완료
                              </span>
                            )}
                            <span
                              className="text-xs px-2 py-1 rounded-full font-medium inline-block w-fit"
                              style={{
                                backgroundColor: inv.is_published ? '#DCFCE7' : '#FEF3C7',
                                color: inv.is_published ? '#166534' : '#92400E',
                              }}
                            >
                              {inv.is_published ? '완성' : '미완성'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {inv.is_paid === 1 ? (
                            <div className="text-sm">
                              {inv.wedding_date ? (
                                (() => {
                                  const weddingDate = new Date(inv.wedding_date)
                                  const deleteAlertDate = new Date(weddingDate)
                                  deleteAlertDate.setDate(deleteAlertDate.getDate() + 30)
                                  const now = new Date()
                                  const daysUntilAlert = Math.ceil((deleteAlertDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

                                  if (daysUntilAlert <= 0) {
                                    return (
                                      <div>
                                        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                                          삭제예정 알림
                                        </span>
                                        <div className="text-xs mt-1" style={{ color: '#D97706' }}>
                                          결혼식+30일 경과
                                        </div>
                                        <div className="text-[10px]" style={{ color: '#AAA' }}>
                                          (자동삭제 안함)
                                        </div>
                                      </div>
                                    )
                                  }
                                  return (
                                    <div>
                                      <span style={{ color: '#666' }}>{daysUntilAlert}일 후 알림</span>
                                      <div className="text-xs" style={{ color: '#AAA' }}>
                                        (결혼식+30일 / 자동삭제 안함)
                                      </div>
                                    </div>
                                  )
                                })()
                              ) : (
                                <span className="text-xs" style={{ color: '#AAA' }}>결혼일 미설정</span>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm" style={{ color: inv.days_until_deletion <= 0 ? '#DC2626' : inv.days_until_deletion <= 7 ? '#D97706' : '#666' }}>
                              {inv.days_until_deletion <= 0 ? (
                                <span className="font-medium">만료됨</span>
                              ) : (
                                <>
                                  {inv.days_until_deletion}일 후
                                  <div className="text-xs" style={{ color: '#888' }}>
                                    {inv.deletion_reason === 'incomplete' ? '(미완성)' : '(결혼식 후)'}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: '#888' }}>
                          {formatDate(inv.created_at)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <a
                              href={inv.template_id === 'parents-formal' ? `/invite/${inv.id}` : `/invitation/${inv.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 rounded text-xs"
                              style={{ backgroundColor: '#F5F3EE', color: '#666' }}
                            >
                              보기
                            </a>
                            <a
                              href={`/editor?id=${inv.id}&admin=true`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 rounded text-xs"
                              style={{ backgroundColor: '#E8E4DD', color: '#2C2C2C' }}
                            >
                              편집
                            </a>
                            <a
                              href={`/admin/customize/${inv.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 rounded text-xs"
                              style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
                            >
                              커스텀
                            </a>
                            <button
                              onClick={() => handleToggleWatermark(inv.id, inv.is_paid)}
                              className="px-3 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: inv.is_paid === 1 ? '#DBEAFE' : '#F3F4F6',
                                color: inv.is_paid === 1 ? '#1D4ED8' : '#374151',
                              }}
                            >
                              {inv.is_paid === 1 ? '워터마크OFF' : '워터마크ON'}
                            </button>
                            <button
                              onClick={() => handleDelete(inv.id)}
                              className="px-3 py-1 rounded text-xs text-white"
                              style={{ backgroundColor: deleteConfirm === inv.id ? '#991B1B' : '#DC2626' }}
                            >
                              {deleteConfirm === inv.id ? '확인' : '삭제'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredInvitations.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center" style={{ color: '#888' }}>
                          청첩장이 없습니다
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ===== Payments Tab ===== */}
        {activeTab === 'payments' && (
          <>
            {/* Pending Requests */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold" style={{ color: '#2C2C2C' }}>
                  대기 중인 요청 ({pendingPayments.length})
                </h2>
                <button
                  onClick={fetchPayments}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: '#F5F3EE', color: '#666' }}
                >
                  새로고침
                </button>
              </div>

              {pendingPayments.length === 0 ? (
                <p className="text-center py-8" style={{ color: '#888' }}>
                  대기 중인 요청이 없습니다.
                </p>
              ) : (
                <div className="space-y-4">
                  {pendingPayments.map((req) => (
                    <div
                      key={req.id}
                      className="border rounded-lg p-4"
                      style={{ borderColor: '#E8E4DD' }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-medium" style={{ color: '#2C2C2C' }}>
                            주문번호: {req.order_number}
                          </p>
                          <p className="text-sm" style={{ color: '#666' }}>
                            구매자: {req.buyer_name} ({req.buyer_phone})
                          </p>
                          {req.user_email && (
                            <p className="text-sm" style={{ color: '#888' }}>
                              계정: {req.user_email}
                            </p>
                          )}
                          <p className="text-xs" style={{ color: '#AAA' }}>
                            접수일: {new Date(req.created_at).toLocaleString('ko-KR')}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={geunnalToggle[req.id] ?? true}
                              onChange={(e) => setGeunnalToggle(prev => ({ ...prev, [req.id]: e.target.checked }))}
                              className="w-4 h-4 rounded accent-purple-500"
                            />
                            <span className="text-xs font-medium" style={{ color: '#8B75D0' }}>데이드로어</span>
                          </label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReject(req.id)}
                              disabled={processingPayment === req.id}
                              className="px-4 py-2 rounded-lg text-sm font-medium border disabled:opacity-50"
                              style={{ borderColor: '#E8E4DD', color: '#666' }}
                            >
                              거절
                            </button>
                            <button
                              onClick={() => handleApprove(req.id)}
                              disabled={processingPayment === req.id}
                              className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                              style={{ backgroundColor: '#C9A962' }}
                            >
                              {processingPayment === req.id ? '처리중...' : '승인'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Processed Requests */}
            {processedPayments.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4" style={{ color: '#2C2C2C' }}>
                  처리된 요청 ({processedPayments.length})
                </h2>
                <div className="space-y-3">
                  {processedPayments.map((req) => (
                    <div
                      key={req.id}
                      className="border rounded-lg p-3"
                      style={{ borderColor: '#E8E4DD', backgroundColor: '#F8F6F2' }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm" style={{ color: '#666' }}>
                            {req.order_number} - {req.buyer_name}
                          </p>
                          <p className="text-xs" style={{ color: '#AAA' }}>
                            {new Date(req.created_at).toLocaleString('ko-KR')}
                          </p>
                        </div>
                        <span
                          className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{
                            backgroundColor: req.status === 'approved' ? '#DCFCE7' : '#FEE2E2',
                            color: req.status === 'approved' ? '#166534' : '#991B1B',
                          }}
                        >
                          {req.status === 'approved' ? '승인됨' : '거절됨'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ===== Geunnal Tab ===== */}
        {activeTab === 'geunnal' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: '#2C2C2C' }}>데이드로어 페이지 목록</h2>
              <button
                onClick={() => setShowGeunnalForm(v => !v)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: '#8B75D0' }}
              >
                {showGeunnalForm ? '취소' : '+ 페이지 생성'}
              </button>
            </div>

            {showGeunnalForm && (
              <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#F5F3EE' }}>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    placeholder="신랑 이름"
                    value={geunnalForm.groom_name}
                    onChange={e => setGeunnalForm(f => ({ ...f, groom_name: e.target.value }))}
                    className="px-3 py-2 rounded-lg text-sm border"
                    style={{ borderColor: '#E8E4DD' }}
                  />
                  <input
                    placeholder="신부 이름"
                    value={geunnalForm.bride_name}
                    onChange={e => setGeunnalForm(f => ({ ...f, bride_name: e.target.value }))}
                    className="px-3 py-2 rounded-lg text-sm border"
                    style={{ borderColor: '#E8E4DD' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    placeholder="슬러그 (URL)"
                    value={geunnalForm.slug}
                    onChange={e => setGeunnalForm(f => ({ ...f, slug: e.target.value }))}
                    className="px-3 py-2 rounded-lg text-sm border"
                    style={{ borderColor: '#E8E4DD' }}
                  />
                  <input
                    type="date"
                    placeholder="예식일"
                    value={geunnalForm.wedding_date}
                    onChange={e => setGeunnalForm(f => ({ ...f, wedding_date: e.target.value }))}
                    className="px-3 py-2 rounded-lg text-sm border"
                    style={{ borderColor: '#E8E4DD' }}
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="password"
                    placeholder="4자리 PIN (비워두면 비밀번호 없음)"
                    maxLength={4}
                    value={geunnalForm.password}
                    onChange={e => setGeunnalForm(f => ({ ...f, password: e.target.value.replace(/\D/g, '') }))}
                    className="w-full px-3 py-2 rounded-lg text-sm border"
                    style={{ borderColor: '#E8E4DD' }}
                  />
                </div>
                <button
                  onClick={handleCreateGeunnalPage}
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: '#8B75D0' }}
                >
                  생성하기
                </button>
              </div>
            )}

            {geunnalPages.length === 0 ? (
              <div className="text-center py-12 text-sm" style={{ color: '#888' }}>
                생성된 데이드로어 페이지가 없습니다
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {geunnalPages.map(page => (
                  <GeunnalPageCard
                    key={page.id}
                    page={page}
                    password={password}
                    onDelete={() => handleDeleteGeunnalPage(page.id)}
                    onUpdated={() => fetchGeunnalPages()}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )

  // ===== Geunnal Functions =====
  async function fetchGeunnalPages() {
    try {
      const res = await fetch('/api/geunnal/pages', {
        headers: { 'x-admin-password': password },
      })
      if (res.ok) {
        const data = (await res.json()) as { pages?: GeunnalPageItem[] }
        setGeunnalPages(data.pages || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleCreateGeunnalPage() {
    const { groom_name, bride_name, slug } = geunnalForm
    if (!groom_name.trim() || !bride_name.trim() || !slug.trim()) {
      alert('신랑 이름, 신부 이름, 슬러그는 필수입니다')
      return
    }

    try {
      const body: Record<string, string> = {
        groom_name: groom_name.trim(),
        bride_name: bride_name.trim(),
        slug: slug.trim(),
      }
      if (geunnalForm.wedding_date) body.wedding_date = geunnalForm.wedding_date

      const res = await fetch('/api/geunnal/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        // Set password if provided
        const data = (await res.json()) as { page?: { id: string } }
        if (geunnalForm.password && data.page?.id) {
          await fetch(`/api/geunnal/${data.page.id}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'setup', password: geunnalForm.password }),
          })
        }

        setShowGeunnalForm(false)
        setGeunnalForm({ groom_name: '', bride_name: '', slug: '', wedding_date: '', password: '' })
        fetchGeunnalPages()
      } else {
        const errData = (await res.json()) as { error?: string }
        alert(errData.error || '생성 실패')
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDeleteGeunnalPage(pageId: string) {
    if (!confirm('이 데이드로어 페이지를 삭제하시겠습니까? 관련 모임과 데이터가 모두 삭제됩니다.')) return

    try {
      const res = await fetch(`/api/geunnal/pages/${pageId}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      })
      if (res.ok) {
        fetchGeunnalPages()
      }
    } catch (err) {
      console.error(err)
    }
  }
}

// ===== Geunnal Page Card with inline editing =====
function GeunnalPageCard({ page, password, onDelete, onUpdated }: {
  page: GeunnalPageItem
  password: string
  onDelete: () => void
  onUpdated: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    groom_name: page.groom_name,
    bride_name: page.bride_name,
    wedding_date: page.wedding_date || '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/geunnal/pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({
          groom_name: form.groom_name.trim(),
          bride_name: form.bride_name.trim(),
          wedding_date: form.wedding_date || null,
        }),
      })
      if (res.ok) {
        setEditing(false)
        onUpdated()
      } else {
        alert('수정 실패')
      }
    } catch {
      alert('수정 실패')
    } finally {
      setSaving(false)
    }
  }

  const pageUrl = `/g/${page.slug}`

  if (editing) {
    return (
      <div className="rounded-xl p-4" style={{ backgroundColor: '#FFF', border: '2px solid #8B75D0' }}>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input
            placeholder="신랑 이름"
            value={form.groom_name}
            onChange={e => setForm(f => ({ ...f, groom_name: e.target.value }))}
            className="px-3 py-2 rounded-lg text-sm border"
            style={{ borderColor: '#E8E4DD' }}
          />
          <input
            placeholder="신부 이름"
            value={form.bride_name}
            onChange={e => setForm(f => ({ ...f, bride_name: e.target.value }))}
            className="px-3 py-2 rounded-lg text-sm border"
            style={{ borderColor: '#E8E4DD' }}
          />
        </div>
        <div className="mb-3">
          <input
            type="date"
            value={form.wedding_date}
            onChange={e => setForm(f => ({ ...f, wedding_date: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg text-sm border"
            style={{ borderColor: '#E8E4DD' }}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: '#8B75D0' }}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="flex-1 py-2 rounded-lg text-sm font-medium border"
            style={{ borderColor: '#E8E4DD', color: '#666' }}
          >
            취소
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: '#FFF', border: '1px solid #E8E4DD' }}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-sm font-medium" style={{ color: '#2C2C2C' }}>
            {page.groom_name} & {page.bride_name}
          </span>
          <a
            href={pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-xs px-2 py-0.5 rounded-full hover:opacity-80"
            style={{ backgroundColor: '#EDE9FA', color: '#8B75D0' }}
          >
            /g/{page.slug} ↗
          </a>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setEditing(true)}
            className="text-xs px-3 py-1 rounded-lg hover:bg-purple-50"
            style={{ color: '#8B75D0' }}
          >
            수정
          </button>
          <button
            onClick={onDelete}
            className="text-xs px-3 py-1 rounded-lg text-red-500 hover:bg-red-50"
          >
            삭제
          </button>
        </div>
      </div>
      <div className="flex gap-4 text-xs" style={{ color: '#888' }}>
        <span>예식일: {page.wedding_date || '미정'}</span>
        <span>생성: {new Date(page.created_at).toLocaleDateString('ko-KR')}</span>
        {page.invitation_id && <span>청첩장 연결됨</span>}
      </div>
    </div>
  )
}
