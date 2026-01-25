'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import GuestList from '@/components/admin/GuestList'
import TemplateSection from '@/components/admin/TemplateSection'
import { Modal, ModalBody, ModalFooter } from '@/components/admin/ui/Modal'
import { Button } from '@/components/admin/ui/Button'
import { Input, Textarea, Select } from '@/components/admin/ui/Input'
import { AdminToast } from '@/components/admin/ui/Toast'

interface Guest {
  id: string
  name: string
  relation: string | null
  honorific: string
  intro_greeting: string | null
  greeting_template_id: string | null
  custom_message: string | null
  opened_count: number
  last_opened_at: string | null
  personalLink: string
  templateName: string | null
}

interface GuestStats {
  total: number
  opened: number
  notOpened: number
  withRsvp: number
}

interface Template {
  id: string
  name: string
  content: string
  is_default: number
}

export default function AdminDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const inviteId = params.inviteId as string

  const [guests, setGuests] = useState<Guest[]>([])
  const [stats, setStats] = useState<GuestStats | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  // 게스트 추가/수정 모달
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [guestForm, setGuestForm] = useState({
    name: '',
    relation: '',
    honorific: '님께',
    intro_greeting: '',
    greeting_template_id: '',
    custom_message: '',
  })
  const [formErrors, setFormErrors] = useState<{ name?: string }>({})

  // 아코디언 섹션
  const [openSections, setOpenSections] = useState<string[]>(['guests'])

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    )
  }

  // 비밀번호 변경
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState(['', '', '', ''])
  const [confirmPassword, setConfirmPassword] = useState(['', '', '', ''])
  const [showConfirmInput, setShowConfirmInput] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const newPasswordRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  const confirmPasswordRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  // 토스트
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' as 'success' | 'error' | 'info' })

  const showToastMsg = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000)
  }

  // 인증 확인 및 데이터 로드
  useEffect(() => {
    const storedToken = localStorage.getItem(`admin_token_${inviteId}`)
    if (!storedToken) {
      router.replace(`/invite/${inviteId}/admin`)
      return
    }
    setToken(storedToken)
  }, [inviteId, router])

  const fetchData = useCallback(async () => {
    if (!token) return

    setIsLoading(true)
    try {
      const headers = { Authorization: `Bearer ${token}` }

      const [guestsRes, templatesRes] = await Promise.all([
        fetch(`/api/invite/${inviteId}/admin/guests`, { headers }),
        fetch(`/api/invite/${inviteId}/admin/templates`, { headers }),
      ])

      if (guestsRes.status === 401 || templatesRes.status === 401) {
        localStorage.removeItem(`admin_token_${inviteId}`)
        router.replace(`/invite/${inviteId}/admin`)
        return
      }

      const guestsData: { guests?: unknown[]; stats?: unknown } = await guestsRes.json()
      const templatesData: { templates?: unknown[] } = await templatesRes.json()

      setGuests((guestsData.guests || []) as Guest[])
      setStats((guestsData.stats || null) as GuestStats | null)
      setTemplates((templatesData.templates || []) as Template[])
    } catch (error) {
      console.error('Fetch error:', error)
      showToastMsg('데이터를 불러오는데 실패했습니다', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [token, inviteId, router])

  useEffect(() => {
    if (token) fetchData()
  }, [token, fetchData])

  // 게스트 모달 열기 (추가)
  const openAddGuestModal = () => {
    setEditingGuest(null)
    setGuestForm({
      name: '',
      relation: '',
      honorific: '님께',
      intro_greeting: '',
      greeting_template_id: '',
      custom_message: '',
    })
    setFormErrors({})
    setShowGuestModal(true)
  }

  // 게스트 모달 열기 (수정)
  const openEditGuestModal = (guest: Guest) => {
    setEditingGuest(guest)
    setGuestForm({
      name: guest.name,
      relation: guest.relation || '',
      honorific: guest.honorific,
      intro_greeting: guest.intro_greeting || '',
      greeting_template_id: guest.greeting_template_id || '',
      custom_message: guest.custom_message || '',
    })
    setFormErrors({})
    setShowGuestModal(true)
  }

  // 게스트 모달 닫기
  const closeGuestModal = () => {
    setShowGuestModal(false)
    setEditingGuest(null)
    setFormErrors({})
  }

  // 게스트 저장 (추가/수정)
  const handleSaveGuest = async () => {
    // 유효성 검사
    if (!guestForm.name.trim()) {
      setFormErrors({ name: '이름을 입력해주세요' })
      return
    }

    setIsSaving(true)
    setFormErrors({})

    try {
      const url = editingGuest
        ? `/api/invite/${inviteId}/admin/guests/${editingGuest.id}`
        : `/api/invite/${inviteId}/admin/guests`

      const res = await fetch(url, {
        method: editingGuest ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: guestForm.name,
          relation: guestForm.relation || undefined,
          honorific: guestForm.honorific,
          intro_greeting: guestForm.intro_greeting || undefined,
          greeting_template_id: guestForm.greeting_template_id || undefined,
          custom_message: guestForm.custom_message || undefined,
        }),
      })

      if (res.ok) {
        closeGuestModal()
        fetchData()
        showToastMsg(editingGuest ? '수정되었습니다' : '게스트가 추가되었습니다', 'success')
      } else {
        const data: { error?: string } = await res.json()
        showToastMsg(data.error || '저장에 실패했습니다', 'error')
      }
    } catch {
      showToastMsg('오류가 발생했습니다', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // 게스트 삭제
  const handleDeleteGuest = async (guestId: string) => {
    try {
      const res = await fetch(`/api/invite/${inviteId}/admin/guests/${guestId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        fetchData()
        showToastMsg('삭제되었습니다', 'success')
      }
    } catch {
      showToastMsg('삭제에 실패했습니다', 'error')
    }
  }

  // 로그아웃
  const handleLogout = () => {
    localStorage.removeItem(`admin_token_${inviteId}`)
    router.replace(`/invite/${inviteId}/admin`)
  }

  // 비밀번호 변경 모달 열기
  const openPasswordModal = () => {
    setNewPassword(['', '', '', ''])
    setConfirmPassword(['', '', '', ''])
    setShowConfirmInput(false)
    setPasswordError('')
    setShowPasswordModal(true)
    setTimeout(() => newPasswordRefs[0].current?.focus(), 100)
  }

  // 비밀번호 변경 모달 닫기
  const closePasswordModal = () => {
    setShowPasswordModal(false)
    setNewPassword(['', '', '', ''])
    setConfirmPassword(['', '', '', ''])
    setShowConfirmInput(false)
    setPasswordError('')
  }

  // 새 비밀번호 입력 핸들러
  const handleNewPasswordChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return

    const updated = [...newPassword]
    updated[index] = value
    setNewPassword(updated)
    setPasswordError('')

    if (value && index < 3) {
      newPasswordRefs[index + 1].current?.focus()
    } else if (value && index === 3) {
      const full = [...updated.slice(0, 3), value].join('')
      if (full.length === 4) {
        setShowConfirmInput(true)
        setTimeout(() => confirmPasswordRefs[0].current?.focus(), 100)
      }
    }
  }

  // 확인 비밀번호 입력 핸들러
  const handleConfirmPasswordChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return

    const updated = [...confirmPassword]
    updated[index] = value
    setConfirmPassword(updated)
    setPasswordError('')

    if (value && index < 3) {
      confirmPasswordRefs[index + 1].current?.focus()
    }
  }

  // 비밀번호 키 입력 핸들러
  const handlePasswordKeyDown = (index: number, e: React.KeyboardEvent, isConfirm: boolean) => {
    const currentPassword = isConfirm ? confirmPassword : newPassword
    const refs = isConfirm ? confirmPasswordRefs : newPasswordRefs

    if (e.key === 'Backspace' && !currentPassword[index] && index > 0) {
      refs[index - 1].current?.focus()
    }
    if (e.key === 'Backspace' && isConfirm && index === 0 && !confirmPassword[0]) {
      setShowConfirmInput(false)
      newPasswordRefs[3].current?.focus()
    }
  }

  // 비밀번호 붙여넣기 핸들러
  const handlePasswordPaste = (e: React.ClipboardEvent, isConfirm: boolean) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (pastedData.length === 4) {
      if (isConfirm) {
        setConfirmPassword(pastedData.split(''))
      } else {
        setNewPassword(pastedData.split(''))
        setShowConfirmInput(true)
        setTimeout(() => confirmPasswordRefs[0].current?.focus(), 100)
      }
    }
  }

  // 비밀번호 초기화
  const handleResetPasswordInput = () => {
    setNewPassword(['', '', '', ''])
    setConfirmPassword(['', '', '', ''])
    setShowConfirmInput(false)
    setPasswordError('')
    newPasswordRefs[0].current?.focus()
  }

  // 비밀번호 변경 제출
  const handleChangePassword = async () => {
    const fullNewPassword = newPassword.join('')
    const fullConfirmPassword = confirmPassword.join('')

    if (fullNewPassword.length !== 4) {
      setPasswordError('4자리 숫자를 모두 입력해주세요')
      return
    }

    if (fullConfirmPassword.length !== 4) {
      setPasswordError('확인 비밀번호를 입력해주세요')
      confirmPasswordRefs[0].current?.focus()
      return
    }

    if (fullNewPassword !== fullConfirmPassword) {
      setPasswordError('비밀번호가 일치하지 않습니다')
      setConfirmPassword(['', '', '', ''])
      confirmPasswordRefs[0].current?.focus()
      return
    }

    setIsChangingPassword(true)
    setPasswordError('')

    try {
      const res = await fetch(`/api/invite/${inviteId}/admin/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newPassword: fullNewPassword,
          confirmPassword: fullConfirmPassword,
        }),
      })

      const data: { success?: boolean; token?: string; error?: string } = await res.json()

      if (res.ok && data.success) {
        if (data.token) {
          localStorage.setItem(`admin_token_${inviteId}`, data.token)
          setToken(data.token)
        }
        closePasswordModal()
        showToastMsg('비밀번호가 변경되었습니다', 'success')
      } else {
        setPasswordError(data.error || '변경에 실패했습니다')
      }
    } catch {
      setPasswordError('오류가 발생했습니다')
    } finally {
      setIsChangingPassword(false)
    }
  }

  // 템플릿 저장 (추가/수정)
  const handleSaveTemplate = async (
    templateData: { name: string; content: string },
    editingId?: string
  ) => {
    try {
      const url = editingId
        ? `/api/invite/${inviteId}/admin/templates/${editingId}`
        : `/api/invite/${inviteId}/admin/templates`

      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(templateData),
      })

      if (res.ok) {
        fetchData()
        showToastMsg(editingId ? '수정되었습니다' : '추가되었습니다', 'success')
      } else {
        const data: { error?: string } = await res.json()
        showToastMsg(data.error || '저장에 실패했습니다', 'error')
      }
    } catch {
      showToastMsg('오류가 발생했습니다', 'error')
    }
  }

  // 템플릿 삭제
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const res = await fetch(`/api/invite/${inviteId}/admin/templates/${templateId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        fetchData()
        showToastMsg('삭제되었습니다', 'success')
      }
    } catch {
      showToastMsg('삭제에 실패했습니다', 'error')
    }
  }

  // 호칭 옵션
  const honorificOptions = [
    { value: '님께', label: '님께' },
    { value: '께', label: '께' },
    { value: '님', label: '님' },
    { value: '에게', label: '에게' },
  ]

  // 템플릿 옵션
  const templateOptions = [
    { value: '', label: '직접 작성' },
    ...templates.map((t) => ({
      value: t.id,
      label: `${t.name}${t.is_default ? ' (기본)' : ''}`,
    })),
  ]

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#F5F3EE' }}
      >
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: '#C9A962', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen pb-24"
      style={{ backgroundColor: '#F5F3EE' }}
    >
      {/* 헤더 */}
      <header
        className="sticky top-0 z-40 px-4 py-4 flex items-center justify-between"
        style={{ backgroundColor: '#F5F3EE', borderBottom: '1px solid #E8E4DD' }}
      >
        <div>
          <div className="text-xs tracking-[2px]" style={{ color: '#C9A962' }}>
            GUEST MANAGER
          </div>
          <h1 className="text-lg font-semibold" style={{ color: '#2C2C2C' }}>
            게스트 관리
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={openPasswordModal}>
            🔐
          </Button>
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            로그아웃
          </Button>
        </div>
      </header>

      {/* 통계 */}
      {stats && (
        <div className="px-4 py-4 grid grid-cols-4 gap-2">
          {[
            { label: '전체', value: stats.total, color: '#2C2C2C' },
            { label: '열람', value: stats.opened, color: '#4CAF50' },
            { label: '미열람', value: stats.notOpened, color: '#FF9800' },
            { label: 'RSVP', value: stats.withRsvp, color: '#C9A962' },
          ].map((item) => (
            <div
              key={item.label}
              className="text-center py-3 rounded-lg"
              style={{ backgroundColor: '#FFF' }}
            >
              <div className="text-2xl font-semibold" style={{ color: item.color }}>
                {item.value}
              </div>
              <div className="text-xs font-medium" style={{ color: '#888' }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 게스트 섹션 (아코디언) */}
      <div className="px-4 mb-4">
        <button
          onClick={() => toggleSection('guests')}
          className="w-full flex items-center justify-between p-4 rounded-t-lg"
          style={{
            backgroundColor: '#FFF',
            borderBottom: openSections.includes('guests') ? '1px solid #E8E4DD' : 'none',
            borderRadius: openSections.includes('guests') ? '12px 12px 0 0' : '12px',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">👥</span>
            <span className="font-semibold" style={{ color: '#2C2C2C' }}>
              게스트 목록
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: '#C9A962', color: '#FFF' }}
            >
              {guests.length}
            </span>
          </div>
          <span
            className="transition-transform duration-200"
            style={{
              transform: openSections.includes('guests') ? 'rotate(180deg)' : 'rotate(0deg)',
              color: '#888',
            }}
          >
            ▼
          </span>
        </button>

        {openSections.includes('guests') && (
          <div
            className="rounded-b-lg overflow-hidden"
            style={{ backgroundColor: '#FFF' }}
          >
            <div className="p-4">
              <GuestList
                guests={guests}
                inviteId={inviteId}
                onEdit={openEditGuestModal}
                onDelete={handleDeleteGuest}
                onAdd={openAddGuestModal}
                onShowToast={(msg) => showToastMsg(msg, 'info')}
              />
            </div>
          </div>
        )}
      </div>

      {/* 인사말 템플릿 섹션 */}
      <div className="px-4 mb-4">
        <TemplateSection
          templates={templates}
          isOpen={openSections.includes('templates')}
          onToggle={() => toggleSection('templates')}
          onSave={handleSaveTemplate}
          onDelete={handleDeleteTemplate}
          onShowToast={(msg) => showToastMsg(msg, 'info')}
        />
      </div>

      {/* 게스트 추가/수정 모달 */}
      <Modal
        isOpen={showGuestModal}
        onClose={closeGuestModal}
        title={editingGuest ? '게스트 수정' : '게스트 추가'}
        position="bottom"
      >
        <ModalBody className="space-y-4">
          <Input
            label="이름 *"
            value={guestForm.name}
            onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
            placeholder="홍길동"
            error={formErrors.name}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="관계 (선택)"
              value={guestForm.relation}
              onChange={(e) => setGuestForm({ ...guestForm, relation: e.target.value })}
              placeholder="이모"
              helperText="예) 이모, 고모네 가족분들"
            />
            <Select
              label="호칭"
              value={guestForm.honorific}
              options={honorificOptions}
              onChange={(value) => setGuestForm({ ...guestForm, honorific: value })}
            />
          </div>

          <Input
            label="모시는 글 (첫문장)"
            value={guestForm.intro_greeting}
            onChange={(e) => setGuestForm({ ...guestForm, intro_greeting: e.target.value })}
            placeholder="소중한 분께"
            helperText="예) 소중한 분께, ○○님께, 초대합니다"
          />

          {templates.length > 0 && (
            <Select
              label="인사말 템플릿"
              value={guestForm.greeting_template_id}
              options={templateOptions}
              onChange={(value) => setGuestForm({ ...guestForm, greeting_template_id: value })}
            />
          )}

          {!guestForm.greeting_template_id && (
            <Textarea
              label="맞춤 메시지"
              value={guestForm.custom_message}
              onChange={(e) => setGuestForm({ ...guestForm, custom_message: e.target.value })}
              placeholder="이 게스트에게만 보여줄 특별한 메시지"
              rows={3}
            />
          )}

          {/* 봉투 미리보기 (Parents 템플릿 스타일) */}
          {guestForm.name && (
            <div className="rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2" style={{ backgroundColor: '#F8F6F2' }}>
                <span className="text-sm">✉️</span>
                <span className="text-xs font-medium" style={{ color: '#888' }}>
                  봉투 앞면 미리보기
                </span>
              </div>
              {/* 봉투 앞면 */}
              <div
                className="py-10 px-6"
                style={{ backgroundColor: '#722F37' }}
              >
                <div
                  className="mx-auto max-w-[260px] py-8 px-6 text-center"
                  style={{
                    backgroundColor: '#F7F4EF',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                  }}
                >
                  <div className="h-px w-[60px] mx-auto mb-4" style={{ backgroundColor: '#C9A962' }} />
                  {guestForm.relation && (
                    <p className="text-xs mb-1" style={{ color: '#666' }}>
                      {guestForm.relation}
                    </p>
                  )}
                  <p
                    className="text-xl"
                    style={{ color: '#2C2C2C', fontFamily: "'Noto Serif KR', Georgia, serif" }}
                  >
                    {guestForm.name} {guestForm.honorific}
                  </p>
                  <div className="h-px w-[60px] mx-auto mt-4" style={{ backgroundColor: '#C9A962' }} />
                </div>
              </div>
            </div>
          )}

          {/* 편지지 미리보기 (Parents 템플릿 스타일) */}
          {guestForm.name && (guestForm.greeting_template_id || guestForm.custom_message) && (() => {
            // 인사말 내용 결정
            let greetingContent = ''
            if (guestForm.greeting_template_id) {
              const selectedTemplate = templates.find(t => t.id === guestForm.greeting_template_id)
              if (selectedTemplate) {
                greetingContent = selectedTemplate.content
                  .replace(/\{이름\}/g, guestForm.name || '홍길동')
                  .replace(/\{관계\}/g, guestForm.relation || '지인')
              }
            } else {
              greetingContent = guestForm.custom_message
            }

            // 표시명 생성
            const displayGreetingTo = guestForm.intro_greeting || (guestForm.relation
              ? `${guestForm.name} ${guestForm.relation} ${guestForm.honorific}`
              : `${guestForm.name} ${guestForm.honorific}`)

            return (
              <div className="rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2" style={{ backgroundColor: '#F8F6F2' }}>
                  <span className="text-sm">📜</span>
                  <span className="text-xs font-medium" style={{ color: '#888' }}>
                    편지지 미리보기
                  </span>
                </div>
                <div
                  className="py-6 px-4"
                  style={{ backgroundColor: '#722F37' }}
                >
                  <div
                    className="mx-auto max-w-[280px] py-6 px-5 text-center rounded-xl"
                    style={{
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    }}
                  >
                    <p className="text-[10px] tracking-[2px] mb-3" style={{ color: '#C9A962' }}>
                      WEDDING INVITATION
                    </p>
                    <div className="h-px w-[40px] mx-auto mb-3" style={{ backgroundColor: '#C9A962' }} />
                    <p
                      className="text-sm mb-4"
                      style={{ color: '#2C2C2C', fontFamily: "'Noto Serif KR', Georgia, serif" }}
                    >
                      {displayGreetingTo}
                    </p>
                    <div
                      className="text-xs leading-relaxed mb-4 whitespace-pre-line"
                      style={{ color: '#555' }}
                    >
                      {greetingContent}
                    </div>
                    <div className="h-px w-[40px] mx-auto mb-2" style={{ backgroundColor: '#C9A962' }} />
                    <p className="text-[10px]" style={{ color: '#888' }}>
                      아버지 ○○○ · 어머니 ○○○ 드림
                    </p>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* 청첩장 미리보기 링크 */}
          {editingGuest && (
            <a
              href={`/invite/${inviteId}?guest=${editingGuest.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium transition-all"
              style={{ backgroundColor: '#2C2C2C', color: '#FFF' }}
            >
              <span>📱</span>
              청첩장 미리보기
            </a>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={isSaving}
            onClick={handleSaveGuest}
          >
            {editingGuest ? '저장하기' : '추가하기'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* 비밀번호 변경 모달 */}
      <Modal
        isOpen={showPasswordModal}
        onClose={closePasswordModal}
        title="비밀번호 변경"
        position="bottom"
      >
        <ModalBody className="space-y-4">
          <p className="text-center text-sm" style={{ color: '#888' }}>
            {showConfirmInput ? '확인을 위해 한번 더 입력해주세요' : '새로운 4자리 숫자 비밀번호'}
          </p>

          {/* 새 비밀번호 입력 */}
          <div className={`flex justify-center gap-3 ${showConfirmInput ? 'opacity-50' : ''}`}>
            {newPassword.map((digit, index) => (
              <input
                key={`new-${index}`}
                ref={newPasswordRefs[index]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleNewPasswordChange(index, e.target.value)}
                onKeyDown={(e) => handlePasswordKeyDown(index, e, false)}
                onPaste={index === 0 ? (e) => handlePasswordPaste(e, false) : undefined}
                disabled={showConfirmInput}
                className="w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-150 focus:outline-none disabled:cursor-not-allowed"
                style={{
                  borderColor: passwordError && !showConfirmInput ? '#DC2626' : showConfirmInput ? '#C9A962' : '#E8E4DD',
                  backgroundColor: showConfirmInput ? '#FFFBF0' : '#FFF',
                  color: '#2C2C2C',
                }}
              />
            ))}
          </div>

          {/* 확인 비밀번호 입력 */}
          {showConfirmInput && (
            <div className="flex justify-center gap-3">
              {confirmPassword.map((digit, index) => (
                <input
                  key={`confirm-${index}`}
                  ref={confirmPasswordRefs[index]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleConfirmPasswordChange(index, e.target.value)}
                  onKeyDown={(e) => handlePasswordKeyDown(index, e, true)}
                  onPaste={index === 0 ? (e) => handlePasswordPaste(e, true) : undefined}
                  className="w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-150 focus:outline-none"
                  style={{
                    borderColor: passwordError ? '#DC2626' : '#E8E4DD',
                    backgroundColor: '#FFF',
                    color: '#2C2C2C',
                  }}
                />
              ))}
            </div>
          )}

          {/* 에러 메시지 */}
          {passwordError && (
            <p className="text-center text-sm" style={{ color: '#DC2626' }}>
              {passwordError}
            </p>
          )}

          {/* 다시 입력하기 버튼 */}
          {(newPassword.some((d) => d) || showConfirmInput) && (
            <button
              onClick={handleResetPasswordInput}
              className="w-full py-2 text-sm font-medium"
              style={{ color: '#888' }}
            >
              다시 입력하기
            </button>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={isChangingPassword}
            disabled={!showConfirmInput || confirmPassword.some((d) => !d)}
            onClick={handleChangePassword}
          >
            변경하기
          </Button>
        </ModalFooter>
      </Modal>

      {/* 토스트 */}
      <AdminToast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
      />
    </div>
  )
}
