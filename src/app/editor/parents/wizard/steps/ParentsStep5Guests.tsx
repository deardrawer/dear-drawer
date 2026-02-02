'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Users, Copy, Check, Eye, KeyRound, AlertTriangle } from 'lucide-react'
import type { ParentsInvitationData } from '../../page'

interface Guest {
  id: string
  invitation_id: string
  name: string
  relation: string | null
  honorific: string
  intro_greeting: string | null
  custom_message: string | null
  opened_at: string | null
  opened_count: number
  last_opened_at: string | null
  created_at: string
}

interface GuestStats {
  total: number
  opened: number
  unopened: number
  withRsvp: number
}

interface ParentsStep5GuestsProps {
  data: ParentsInvitationData
  updateData: (updates: Partial<ParentsInvitationData>) => void
  updateNestedData: (path: string, value: unknown) => void
  invitationId: string | null
  selectedGuest?: { name: string; honorific: string; relation?: string; intro_greeting?: string; custom_message?: string } | null
  onSelectGuest?: (guest: { name: string; honorific: string; relation?: string; intro_greeting?: string; custom_message?: string } | null) => void
}

export default function ParentsStep5Guests({
  invitationId,
  selectedGuest,
  onSelectGuest,
}: ParentsStep5GuestsProps) {
  const [guests, setGuests] = useState<Guest[]>([])
  const [guestStats, setGuestStats] = useState<GuestStats>({ total: 0, opened: 0, unopened: 0, withRsvp: 0 })
  const [isLoadingGuests, setIsLoadingGuests] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // 비밀번호 리셋 관련 상태
  const [hasPassword, setHasPassword] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 게스트 목록 불러오기
  const fetchGuests = useCallback(async () => {
    if (!invitationId) return

    setIsLoadingGuests(true)
    try {
      const res = await fetch(`/api/guests?invitationId=${invitationId}`)
      const result = await res.json() as { guests?: Guest[]; stats?: GuestStats }
      if (res.ok) {
        setGuests(result.guests || [])
        setGuestStats(result.stats || { total: 0, opened: 0, unopened: 0, withRsvp: 0 })
      }
    } catch (error) {
      console.error('Failed to fetch guests:', error)
    } finally {
      setIsLoadingGuests(false)
    }
  }, [invitationId])

  useEffect(() => {
    fetchGuests()
  }, [fetchGuests])

  // 비밀번호 상태 확인
  const checkPasswordStatus = useCallback(async () => {
    if (!invitationId) return
    try {
      const res = await fetch(`/api/invite/${invitationId}/admin/owner-reset`)
      const data = await res.json() as { hasPassword?: boolean }
      if (res.ok) {
        setHasPassword(!!data.hasPassword)
      }
    } catch (error) {
      console.error('Failed to check password status:', error)
    }
  }, [invitationId])

  useEffect(() => {
    checkPasswordStatus()
  }, [checkPasswordStatus])

  // 비밀번호 리셋
  const handleResetPassword = async () => {
    if (!invitationId) return

    setIsResetting(true)
    setResetMessage(null)

    try {
      const res = await fetch(`/api/invite/${invitationId}/admin/owner-reset`, {
        method: 'DELETE',
      })
      const data = await res.json() as { success?: boolean; message?: string; error?: string }

      if (data.success) {
        setResetMessage({ type: 'success', text: data.message || '비밀번호가 리셋되었습니다' })
        setHasPassword(false)
        setShowResetConfirm(false)
      } else {
        setResetMessage({ type: 'error', text: data.error || '리셋에 실패했습니다' })
      }
    } catch (error) {
      console.error('Failed to reset password:', error)
      setResetMessage({ type: 'error', text: '오류가 발생했습니다' })
    } finally {
      setIsResetting(false)
    }
  }

  // 링크 복사
  const handleCopyLink = async (guest: Guest) => {
    const baseUrl = window.location.origin
    const link = `${baseUrl}/i/${invitationId}?guest=${guest.id}`

    try {
      await navigator.clipboard.writeText(link)
      setCopiedId(guest.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div className="p-6 space-y-8">
      {/* 안내 */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-base text-purple-800 font-medium mb-1">게스트 설정</p>
        <p className="text-sm text-purple-700">
          💙 게스트별로 맞춤 청첩장 링크를 생성하고 관리할 수 있습니다.
        </p>
      </div>

      {/* 게스트 관리 페이지 버튼 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
            <Users className="w-3 h-3 text-amber-600" />
          </div>
          게스트 관리
        </h3>
        <p className="text-sm text-blue-600">💙 게스트를 추가하고 개별 링크를 생성할 수 있습니다.</p>

        {invitationId ? (
          <a
            href={`/invite/${invitationId}/admin`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm transition-colors"
          >
            <Users className="w-4 h-4" />
            게스트 관리 페이지 열기
          </a>
        ) : (
          <div className="text-center py-4 px-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">
              게스트를 관리하려면 먼저 청첩장을 저장해주세요
            </p>
          </div>
        )}
      </section>

      {/* 비밀번호 설정/리셋 */}
      {invitationId && (
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
              <KeyRound className="w-3 h-3 text-gray-600" />
            </div>
            관리자 비밀번호
          </h3>
          <p className="text-sm text-gray-600">
            게스트 관리 페이지 접근을 위한 4자리 비밀번호입니다.
          </p>

          {/* 비밀번호 상태 표시 */}
          <div className={`p-3 rounded-lg text-sm ${hasPassword ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
            {hasPassword ? '비밀번호가 설정되어 있습니다' : '비밀번호가 설정되지 않았습니다'}
          </div>

          {/* 리셋 메시지 */}
          {resetMessage && (
            <div className={`p-3 rounded-lg text-sm ${resetMessage.type === 'success' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
              {resetMessage.text}
            </div>
          )}

          {/* 리셋 버튼 또는 확인 대화상자 */}
          {hasPassword && !showResetConfirm && (
            <Button
              variant="outline"
              onClick={() => setShowResetConfirm(true)}
              className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
            >
              <KeyRound className="w-4 h-4 mr-2" />
              비밀번호 리셋
            </Button>
          )}

          {showResetConfirm && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">비밀번호를 리셋하시겠습니까?</p>
                  <p className="text-sm text-red-600 mt-1">
                    기존 비밀번호가 삭제됩니다. 게스트 관리 페이지에서 새 비밀번호를 설정해야 합니다.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowResetConfirm(false)}
                  disabled={isResetting}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleResetPassword}
                  disabled={isResetting}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  {isResetting ? '리셋 중...' : '리셋 확인'}
                </Button>
              </div>
            </div>
          )}

          {!hasPassword && (
            <p className="text-xs text-gray-500">
              게스트 관리 페이지에서 처음 접속 시 새 비밀번호를 설정할 수 있습니다.
            </p>
          )}
        </section>
      )}

      {/* 통계 */}
      {invitationId && guestStats.total > 0 && (
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">게스트 통계</h3>
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-gray-900">{guestStats.total}</p>
              <p className="text-xs text-gray-500">전체</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">{guestStats.opened}</p>
              <p className="text-xs text-gray-500">열람</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-gray-400">{guestStats.unopened}</p>
              <p className="text-xs text-gray-500">미열람</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">{guestStats.withRsvp}</p>
              <p className="text-xs text-gray-500">RSVP</p>
            </div>
          </div>
        </section>
      )}

      {/* 미리보기용 게스트 선택 */}
      {guests.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">미리보기 게스트 선택</h3>
          <p className="text-xs text-blue-600">
            💙 게스트를 선택하면 봉투 미리보기에서 확인할 수 있어요
            {selectedGuest && (
              <span className="ml-2 text-blue-500 font-medium">
                (선택: {selectedGuest.name})
              </span>
            )}
          </p>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {guests.map((guest) => {
              const isSelected = selectedGuest?.name === guest.name && selectedGuest?.honorific === guest.honorific
              return (
                <div
                  key={guest.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                    isSelected ? 'bg-blue-50 ring-2 ring-blue-400' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => {
                    if (onSelectGuest) {
                      if (isSelected) {
                        onSelectGuest(null)
                      } else {
                        onSelectGuest({
                          name: guest.name,
                          honorific: guest.honorific,
                          relation: guest.relation || undefined,
                          intro_greeting: guest.intro_greeting || undefined,
                          custom_message: guest.custom_message || undefined
                        })
                      }
                    }
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{guest.name}</span>
                      {guest.relation && (
                        <span className="text-[10px] text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                          {guest.relation}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                      {guest.opened_count > 0 ? (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>{guest.opened_count}회</span>
                        </>
                      ) : (
                        <span>미열람</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCopyLink(guest); }}
                    className="p-2 rounded hover:bg-gray-200"
                    title="링크 복사"
                  >
                    {copiedId === guest.id ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* 빈 상태 */}
      {!isLoadingGuests && guests.length === 0 && invitationId && (
        <div className="text-center py-8 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">등록된 게스트가 없습니다</p>
          <p className="text-xs mt-1">관리 페이지에서 게스트를 추가해주세요</p>
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoadingGuests && (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}

      {/* 도움말 */}
      <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-2">
        <p className="font-medium text-gray-900">게스트 관리 안내</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>게스트별로 맞춤 청첩장 링크를 생성할 수 있습니다.</li>
          <li>게스트별로 다른 인사말과 메시지를 설정할 수 있습니다.</li>
          <li>열람 여부와 RSVP 응답을 확인할 수 있습니다.</li>
          <li>게스트 목록을 CSV로 내보낼 수 있습니다.</li>
        </ul>
      </div>
    </div>
  )
}
