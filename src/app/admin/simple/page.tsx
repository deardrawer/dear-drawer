'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PaymentRequest {
  id: number
  user_id: string
  invitation_id: string | null
  order_number: string
  buyer_name: string
  buyer_phone: string
  status: string
  created_at: string
  user_email?: string
}

export default function AdminSimplePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const [requests, setRequests] = useState<PaymentRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [processingId, setProcessingId] = useState<number | null>(null)

  // 로그인 상태 확인
  useEffect(() => {
    const loggedIn = localStorage.getItem('admin_logged_in') === 'true'
    setIsLoggedIn(loggedIn)
    setIsCheckingAuth(false)
  }, [])

  // 로그인 후 데이터 로드
  useEffect(() => {
    if (isLoggedIn) {
      fetchRequests()
    }
  }, [isLoggedIn])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setIsLoggingIn(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json() as { success?: boolean; error?: string }

      if (data.success) {
        localStorage.setItem('admin_logged_in', 'true')
        setIsLoggedIn(true)
        setPassword('')
      } else {
        setLoginError(data.error || '비밀번호가 올바르지 않습니다.')
      }
    } catch {
      setLoginError('로그인에 실패했습니다.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_logged_in')
    setIsLoggedIn(false)
    setRequests([])
  }

  const fetchRequests = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/payment-requests')
      if (res.ok) {
        const data = await res.json() as { requests?: PaymentRequest[] }
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (requestId: number) => {
    if (!confirm('이 결제를 승인하시겠습니까?')) return

    setProcessingId(requestId)
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      })

      if (res.ok) {
        alert('승인되었습니다.')
        fetchRequests()
      } else {
        const data = await res.json() as { error?: string }
        alert(data.error || '승인에 실패했습니다.')
      }
    } catch {
      alert('승인에 실패했습니다.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (requestId: number) => {
    if (!confirm('이 결제를 거절하시겠습니까?')) return

    setProcessingId(requestId)
    try {
      const res = await fetch('/api/admin/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      })

      if (res.ok) {
        alert('거절되었습니다.')
        fetchRequests()
      } else {
        const data = await res.json() as { error?: string }
        alert(data.error || '거절에 실패했습니다.')
      }
    } catch {
      alert('거절에 실패했습니다.')
    } finally {
      setProcessingId(null)
    }
  }

  // 인증 상태 확인 중
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩중...</p>
      </div>
    )
  }

  // 로그인 폼
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h1 className="text-xl font-bold text-gray-900 mb-6 text-center">
              관리자 로그인
            </h1>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="w-full"
                  autoFocus
                />
              </div>

              {loginError && (
                <p className="text-sm text-red-500 text-center">{loginError}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoggingIn || !password}
              >
                {isLoggingIn ? '확인 중...' : '로그인'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // 승인 목록
  const pendingRequests = requests.filter(r => r.status === 'pending')
  const processedRequests = requests.filter(r => r.status !== 'pending')

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">결제 승인 관리</h1>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            로그아웃
          </Button>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-500">로딩중...</p>
          </div>
        ) : (
          <>
            {/* 대기 중인 요청 */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                대기 중인 요청 ({pendingRequests.length})
              </h2>

              {pendingRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">대기 중인 요청이 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-medium text-gray-900">
                            주문번호: {request.order_number}
                          </p>
                          <p className="text-sm text-gray-600">
                            구매자: {request.buyer_name} ({request.buyer_phone})
                          </p>
                          {request.user_email && (
                            <p className="text-sm text-gray-500">
                              계정: {request.user_email}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            접수일: {new Date(request.created_at).toLocaleString('ko-KR')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(request.id)}
                            disabled={processingId === request.id}
                          >
                            거절
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            disabled={processingId === request.id}
                          >
                            {processingId === request.id ? '처리중...' : '승인'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 처리된 요청 */}
            {processedRequests.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  처리된 요청 ({processedRequests.length})
                </h2>
                <div className="space-y-3">
                  {processedRequests.map((request) => (
                    <div
                      key={request.id}
                      className="border border-gray-100 rounded-lg p-3 bg-gray-50"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-700">
                            {request.order_number} - {request.buyer_name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(request.created_at).toLocaleString('ko-KR')}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            request.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {request.status === 'approved' ? '승인됨' : '거절됨'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
