'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

type InvitationSummary = {
  id: string
  title: string
  groom_name: string
  bride_name: string
  wedding_date: string
  slug: string
  is_published: boolean
  is_paid: boolean
  created_at: string
  updated_at: string
  template_id: string
  rsvp_count?: number
}

export default function MyInvitationsPage() {
  const { user, status } = useAuth()
  const router = useRouter()
  const [invitations, setInvitations] = useState<InvitationSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchInvitations()
    }
  }, [status, router])

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/invitations')
      const data: { invitations?: InvitationSummary[] } = await response.json()
      setInvitations(data.invitations || [])
    } catch (error) {
      console.error('Failed to fetch invitations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/invitations/${deleteId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setInvitations(invitations.filter((inv) => inv.id !== deleteId))
      }
    } catch (error) {
      console.error('Failed to delete invitation:', error)
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-200 border-t-rose-600" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">내 청첩장</h1>
          <p className="text-gray-500 mt-1">생성한 청첩장을 관리하세요</p>
        </div>
        <Link href="/gallery">
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 청첩장 만들기
          </Button>
        </Link>
      </div>

      {invitations.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              아직 청첩장이 없습니다
            </h3>
            <p className="text-gray-400 mb-6">
              템플릿을 선택하고 나만의 청첩장을 만들어보세요
            </p>
            <Link href="/gallery">
              <Button>청첩장 만들기</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invitations.map((invitation) => (
            <Card key={invitation.id} className="overflow-hidden">
              {/* Preview Thumbnail */}
              <div className="aspect-[3/4] bg-gradient-to-b from-rose-50 to-white relative">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-3">
                    <span className="text-lg font-serif text-rose-600">W</span>
                  </div>
                  <h3 className="font-medium text-gray-900">
                    {invitation.groom_name} & {invitation.bride_name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(invitation.wedding_date)}
                  </p>
                </div>
                <div className="absolute top-2 left-2 flex gap-1">
                  {!invitation.is_published && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                      임시저장
                    </span>
                  )}
                  {invitation.is_paid ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      결제완료
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      미결제
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {invitation.title || `${invitation.groom_name} & ${invitation.bride_name}`}
                    </p>
                    <p className="text-xs text-gray-400">
                      수정: {new Date(invitation.updated_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  {invitation.rsvp_count !== undefined && (
                    <span className="text-xs px-2 py-1 bg-rose-50 text-rose-600 rounded-full">
                      RSVP {invitation.rsvp_count}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-2">
                  <Link href={`/editor?id=${invitation.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      편집
                    </Button>
                  </Link>
                  <Link href={`/dashboard/${invitation.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      통계
                    </Button>
                  </Link>
                  <Link href={invitation.slug ? `/i/${invitation.slug}` : `/invitation/${invitation.id}`} target="_blank">
                    <Button variant="outline" size="sm" className="w-full">
                      보기
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {!invitation.is_paid && (
                    <Link href={`/dashboard/payment?invitationId=${invitation.id}`}>
                      <Button size="sm" className="w-full bg-rose-500 hover:bg-rose-600">
                        결제 요청
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteId(invitation.id)}
                    className={`${!invitation.is_paid ? '' : 'col-span-2'} text-red-500 hover:text-red-600 hover:bg-red-50`}
                  >
                    삭제
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>청첩장 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 청첩장을 삭제하시겠습니까?
              <br />
              삭제된 청첩장은 복구할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
