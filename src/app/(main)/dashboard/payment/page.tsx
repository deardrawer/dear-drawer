'use client'

import { useState, Suspense } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function PaymentForm() {
  const { user, status } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const invitationId = searchParams.get('invitationId')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [form, setForm] = useState({
    orderNumber: '',
    buyerName: '',
    buyerPhone: '',
  })

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩중...</p>
      </div>
    )
  }

  if (status === 'unauthenticated' || !user) {
    router.push('/login')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.orderNumber || !form.buyerName || !form.buyerPhone) {
      alert('모든 필드를 입력해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/payment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: form.orderNumber,
          buyerName: form.buyerName,
          buyerPhone: form.buyerPhone,
          invitationId: invitationId || undefined,
        }),
      })

      if (res.ok) {
        setIsSubmitted(true)
      } else {
        const data = await res.json() as { error?: string }
        alert(data.error || '제출에 실패했습니다.')
      }
    } catch {
      alert('제출에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">접수 완료</h2>
            <p className="text-gray-600 mb-6">
              결제 확인 후 승인해드리겠습니다.<br />
              승인 완료 시 청첩장이 활성화됩니다.
            </p>
            <Button onClick={() => router.push('/my-invitations')} className="w-full">
              내 청첩장으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">워터마크 제거 요청</h1>
          <p className="text-sm text-gray-600 mb-4">
            디어드로어에서 모바일 청첩장 결제 완료 후 주문번호를 입력해주세요.
          </p>

          <a
            href="https://www.deardrawer.com/invitation/?idx=8"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full mb-6"
          >
            <Button variant="outline" className="w-full bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              디어드로어에서 결제하기
            </Button>
          </a>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="orderNumber">주문번호 *</Label>
              <Input
                id="orderNumber"
                value={form.orderNumber}
                onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
                placeholder="예: 202501150001"
                required
              />
              <p className="text-xs text-gray-500">
                아임웹 주문 완료 후 안내된 주문번호를 입력하세요.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyerName">구매자명 *</Label>
              <Input
                id="buyerName"
                value={form.buyerName}
                onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
                placeholder="홍길동"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyerPhone">연락처 *</Label>
              <Input
                id="buyerPhone"
                value={form.buyerPhone}
                onChange={(e) => setForm({ ...form, buyerPhone: e.target.value })}
                placeholder="010-1234-5678"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? '제출 중...' : '결제 확인 요청'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSubmitPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩중...</p>
      </div>
    }>
      <PaymentForm />
    </Suspense>
  )
}
