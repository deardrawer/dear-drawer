'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { UserPlus, Copy, Check, Trash2, Edit2, Eye, Link2, Users } from 'lucide-react'

interface Guest {
  id: string
  invitation_id: string
  name: string
  relation: string | null
  honorific: string
  custom_message: string | null
  opened_at: string | null
  opened_count: number
  last_opened_at: string | null
  rsvp_response_id: string | null
  created_at: string
  updated_at: string
}

interface GuestStats {
  total: number
  opened: number
  unopened: number
  withRsvp: number
}

interface GuestManagerProps {
  invitationId: string | null
}

const relationOptions = [
  '이모', '삼촌', '고모', '외삼촌', '외숙모',
  '할머니', '할아버지', '외할머니', '외할아버지',
  '사촌', '조카',
  '직장상사', '직장동료', '선배', '후배',
  '친구', '지인',
  '기타'
]

const honorificOptions = [
  { value: '님께', label: '님께 (정중함)' },
  { value: '께', label: '께 (존경)' },
  { value: '님', label: '님' },
  { value: '에게', label: '에게 (친근함)' },
  { value: '', label: '없음' },
]

export default function GuestManager({ invitationId }: GuestManagerProps) {
  const [guests, setGuests] = useState<Guest[]>([])
  const [stats, setStats] = useState<GuestStats>({ total: 0, opened: 0, unopened: 0, withRsvp: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    relation: '',
    honorific: '님께',
    custom_message: '',
  })

  // Fetch guests
  const fetchGuests = useCallback(async () => {
    if (!invitationId) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/guests?invitationId=${invitationId}`)
      const data = await res.json() as { guests?: Guest[]; stats?: GuestStats }
      if (res.ok) {
        setGuests(data.guests || [])
        setStats(data.stats || { total: 0, opened: 0, unopened: 0, withRsvp: 0 })
      }
    } catch (error) {
      console.error('Failed to fetch guests:', error)
    } finally {
      setIsLoading(false)
    }
  }, [invitationId])

  useEffect(() => {
    fetchGuests()
  }, [fetchGuests])

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      relation: '',
      honorific: '님께',
      custom_message: '',
    })
    setEditingGuest(null)
  }

  // Open add dialog
  const handleOpenAddDialog = () => {
    resetForm()
    setIsAddDialogOpen(true)
  }

  // Open edit dialog
  const handleOpenEditDialog = (guest: Guest) => {
    setFormData({
      name: guest.name,
      relation: guest.relation || '',
      honorific: guest.honorific,
      custom_message: guest.custom_message || '',
    })
    setEditingGuest(guest)
    setIsAddDialogOpen(true)
  }

  // Save guest (create or update)
  const handleSaveGuest = async () => {
    if (!invitationId || !formData.name.trim()) return

    try {
      if (editingGuest) {
        // Update
        const res = await fetch(`/api/guests/${editingGuest.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (res.ok) {
          fetchGuests()
          setIsAddDialogOpen(false)
          resetForm()
        }
      } else {
        // Create
        const res = await fetch('/api/guests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invitationId,
            ...formData,
          }),
        })
        if (res.ok) {
          fetchGuests()
          setIsAddDialogOpen(false)
          resetForm()
        }
      }
    } catch (error) {
      console.error('Failed to save guest:', error)
    }
  }

  // Delete guest
  const handleDeleteGuest = async (guestId: string) => {
    if (!confirm('이 게스트를 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/guests/${guestId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchGuests()
      }
    } catch (error) {
      console.error('Failed to delete guest:', error)
    }
  }

  // Copy guest link
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

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!invitationId) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm">게스트 관리를 위해서는 먼저 청첩장을 저장해주세요.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-500">전체</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.opened}</div>
          <div className="text-xs text-green-600">열람</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-400">{stats.unopened}</div>
          <div className="text-xs text-gray-500">미열람</div>
        </div>
        <div className="bg-rose-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-rose-600">{stats.withRsvp}</div>
          <div className="text-xs text-rose-600">응답</div>
        </div>
      </div>

      {/* Add button */}
      <Button
        onClick={handleOpenAddDialog}
        className="w-full bg-rose-500 hover:bg-rose-600"
      >
        <UserPlus className="w-4 h-4 mr-2" />
        게스트 추가
      </Button>

      {/* Guest list */}
      {isLoading ? (
        <div className="py-8 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full mx-auto" />
        </div>
      ) : guests.length === 0 ? (
        <div className="py-8 text-center text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">등록된 게스트가 없습니다</p>
          <p className="text-xs mt-1">게스트를 추가하면 개인화된 링크가 생성됩니다</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {guests.map((guest) => (
            <div
              key={guest.id}
              className="border rounded-lg p-3 bg-white hover:border-rose-200 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{guest.name}</span>
                    <span className="text-xs text-gray-400">{guest.honorific}</span>
                    {guest.relation && (
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                        {guest.relation}
                      </span>
                    )}
                  </div>
                  {guest.custom_message && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {guest.custom_message}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    {guest.opened_at ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <Eye className="w-3 h-3" />
                        {guest.opened_count}회 열람
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        미열람
                      </span>
                    )}
                    {guest.last_opened_at && (
                      <span>최근: {formatDate(guest.last_opened_at)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopyLink(guest)}
                    className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                    title="링크 복사"
                  >
                    {copiedId === guest.id ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Link2 className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleOpenEditDialog(guest)}
                    className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                    title="편집"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDeleteGuest(guest.id)}
                    className="p-1.5 rounded hover:bg-red-50 transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingGuest ? '게스트 편집' : '게스트 추가'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>이름 *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="홍길동"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>관계 <span className="text-gray-400 font-normal">(선택)</span></Label>
                <select
                  value={formData.relation}
                  onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">선택</option>
                  {relationOptions.map((rel) => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  예) 이모, 고모네 가족분들
                </p>
              </div>

              <div className="space-y-2">
                <Label>호칭</Label>
                <select
                  value={formData.honorific}
                  onChange={(e) => setFormData({ ...formData, honorific: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {honorificOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>맞춤 메시지 (선택)</Label>
              <Textarea
                value={formData.custom_message}
                onChange={(e) => setFormData({ ...formData, custom_message: e.target.value })}
                placeholder="이 게스트에게만 보여줄 특별한 메시지를 입력하세요"
                rows={3}
              />
              <p className="text-xs text-gray-500">
                예: &quot;이모, 항상 감사드립니다. 꼭 와주세요!&quot;
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleSaveGuest}
              disabled={!formData.name.trim()}
              className="bg-rose-500 hover:bg-rose-600"
            >
              {editingGuest ? '저장' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
