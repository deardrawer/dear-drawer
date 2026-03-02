'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import GuestList from '@/components/admin/GuestList'
import TemplateSection from '@/components/admin/TemplateSection'
import { Modal, ModalBody, ModalFooter } from '@/components/admin/ui/Modal'
import { Button } from '@/components/admin/ui/Button'
import { Input, Textarea, Select } from '@/components/admin/ui/Input'
import { AdminToast } from '@/components/admin/ui/Toast'

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean
      init: (key: string) => void
      Share?: {
        sendDefault: (options: KakaoShareOptions) => void
      }
    }
  }
}

interface KakaoShareOptions {
  objectType: 'feed'
  content: {
    title: string
    description: string
    imageUrl: string
    link: {
      mobileWebUrl: string
      webUrl: string
    }
  }
  buttons: Array<{
    title: string
    link: {
      mobileWebUrl: string
      webUrl: string
    }
  }>
}

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

interface RsvpResponse {
  id: string
  guest_name: string
  guest_phone: string | null
  attendance: 'attending' | 'not_attending' | 'pending'
  guest_count: number
  message: string | null
  side: 'groom' | 'bride' | null
  created_at: string
}

interface RsvpSummary {
  total: number
  attending: number
  notAttending: number
  pending: number
  totalGuests: number
  groomSide: number
  brideSide: number
  groomSideGuests: number
  brideSideGuests: number
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
  const [invitationInfo, setInvitationInfo] = useState<{ kakaoThumbnail?: string; groomName?: string; brideName?: string; themeColor?: string; accentColor?: string } | null>(null)

  // RSVP 응답
  const [rsvpResponses, setRsvpResponses] = useState<RsvpResponse[]>([])
  const [rsvpSummary, setRsvpSummary] = useState<RsvpSummary | null>(null)
  const [rsvpFilter, setRsvpFilter] = useState<'all' | 'attending' | 'not_attending' | 'pending' | 'groom' | 'bride'>('all')
  const [rsvpSearch, setRsvpSearch] = useState('')
  const [rsvpSort, setRsvpSort] = useState<'date' | 'name' | 'count'>('date')
  const [deletingRsvpId, setDeletingRsvpId] = useState<string | null>(null)

  // 게스트 추가/수정 모달
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [guestType, setGuestType] = useState<'individual' | 'group'>('individual')
  const [guestForm, setGuestForm] = useState({
    name: '',
    relation: '',
    honorific: '님께',
    intro_greeting: '초대합니다.',
    greeting_template_id: '',
    custom_message: '',
  })
  const [formErrors, setFormErrors] = useState<{ name?: string }>({})

  // 아코디언 섹션
  const [openSections, setOpenSections] = useState<string[]>(['guests'])

  // 헤더 메뉴
  const [showHeaderMenu, setShowHeaderMenu] = useState(false)

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

  // 부모님 공유 모달
  const [showShareModal, setShowShareModal] = useState(false)

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

      const [guestsRes, templatesRes, inviteRes, rsvpRes] = await Promise.all([
        fetch(`/api/invite/${inviteId}/admin/guests`, { headers }),
        fetch(`/api/invite/${inviteId}/admin/templates`, { headers }),
        fetch(`/api/invite/${inviteId}`),
        fetch(`/api/rsvp?invitationId=${inviteId}`),
      ])

      if (guestsRes.status === 401 || templatesRes.status === 401) {
        localStorage.removeItem(`admin_token_${inviteId}`)
        router.replace(`/invite/${inviteId}/admin`)
        return
      }

      const guestsData: { guests?: unknown[]; stats?: unknown } = await guestsRes.json()
      const templatesData: { templates?: unknown[] } = await templatesRes.json()
      const inviteData: { invitation?: { content?: string; groom_name?: string; bride_name?: string } } = await inviteRes.json()
      const rsvpData: { data?: RsvpResponse[]; summary?: RsvpSummary } = await rsvpRes.json()

      setGuests((guestsData.guests || []) as Guest[])
      setStats((guestsData.stats || null) as GuestStats | null)
      setTemplates((templatesData.templates || []) as Template[])
      setRsvpResponses(rsvpData.data || [])
      setRsvpSummary(rsvpData.summary || null)

      // 청첩장 정보 설정 (카카오 공유용)
      if (inviteData.invitation) {
        const content = inviteData.invitation.content ? JSON.parse(inviteData.invitation.content) : {}
        // kakaoThumbnail이 객체일 수도 있고 문자열일 수도 있음
        const kakaoThumb = content?.meta?.kakaoThumbnail
        const kakaoThumbnailUrl = typeof kakaoThumb === 'string'
          ? kakaoThumb
          : kakaoThumb?.url

        // mainImage도 객체일 수 있음 (FAMILY 템플릿)
        const mainImageUrl = typeof content?.mainImage === 'string'
          ? content?.mainImage
          : content?.mainImage?.url

        // 갤러리 이미지도 객체일 수 있음
        const galleryFirstUrl = typeof content?.gallery?.[0] === 'string'
          ? content?.gallery?.[0]
          : content?.gallery?.[0]?.url || content?.gallery?.images?.[0]?.url

        // 상대 경로를 절대 경로로 변환 (이미지 URL이 /api/r2/... 형태일 수 있음)
        const toAbsUrl = (url: string | undefined | null): string => {
          if (!url || url.trim() === '') return ''
          if (url.startsWith('http')) return url
          if (url.startsWith('/')) return `${window.location.origin}${url}`
          return url
        }
        // 유효한 이미지 URL 찾기 (우선순위: kakaoThumbnail > mainImage > gallery)
        const validThumbnail = [kakaoThumbnailUrl, mainImageUrl, galleryFirstUrl]
          .map(u => toAbsUrl(u))
          .find(url => url !== '')

        // 테마 색상 추출
        const colorThemeId = content?.colorTheme || 'burgundy'
        const themeMap: Record<string, { primary: string; accent: string }> = {
          burgundy: { primary: '#722F37', accent: '#C9A962' },
          navy: { primary: '#1B2A4A', accent: '#C9A962' },
          green: { primary: '#2D5A3D', accent: '#C9A962' },
          pink: { primary: '#B5616F', accent: '#D4A976' },
          brown: { primary: '#6B4C3B', accent: '#C9A962' },
          black: { primary: '#1A1A1A', accent: '#C9A962' },
        }
        const themeColors = themeMap[colorThemeId] || themeMap.burgundy

        setInvitationInfo({
          kakaoThumbnail: validThumbnail || '',
          groomName: inviteData.invitation.groom_name,
          brideName: inviteData.invitation.bride_name,
          themeColor: themeColors.primary,
          accentColor: themeColors.accent,
        })
      }
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
    setGuestType('individual')
    setGuestForm({
      name: '',
      relation: '',
      honorific: '님께',
      intro_greeting: '초대합니다.',
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

  // RSVP 삭제
  const handleDeleteRsvp = async (rsvpId: string) => {
    try {
      const res = await fetch(`/api/rsvp?id=${rsvpId}&invitationId=${inviteId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setRsvpResponses((prev) => prev.filter((r) => r.id !== rsvpId))
        setDeletingRsvpId(null)
        fetchData()
        showToastMsg('삭제되었습니다', 'success')
      } else {
        showToastMsg('삭제에 실패했습니다', 'error')
      }
    } catch {
      showToastMsg('오류가 발생했습니다', 'error')
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

  // 부모님께 공유 - 링크 복사
  const handleCopyShareLink = async () => {
    const shareUrl = `${window.location.origin}/invite/${inviteId}/admin`
    try {
      await navigator.clipboard.writeText(shareUrl)
      showToastMsg('링크가 복사되었습니다', 'success')
    } catch {
      showToastMsg('링크 복사에 실패했습니다', 'error')
    }
  }

  // 부모님께 공유 - 카카오톡
  const handleKakaoShare = () => {
    const shareUrl = `${window.location.origin}/invite/${inviteId}/admin`
    const guideUrl = `${window.location.origin}/invite/${inviteId}/admin/guide`

    // 이미지 URL 유효성 검사 - 빈 문자열, undefined, null 모두 체크
    const defaultImage = 'https://invite.deardrawer.com/og-image.png'
    const thumbnailUrl = invitationInfo?.kakaoThumbnail
    const imageUrl = (thumbnailUrl && thumbnailUrl.trim() !== '' && thumbnailUrl.startsWith('http'))
      ? thumbnailUrl
      : defaultImage

    try {
      // SDK 초기화 확인 및 초기화
      if (window.Kakao && !window.Kakao.isInitialized()) {
        const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || '0890847927f3189d845391481ead8ecc'
        window.Kakao.init(kakaoKey)
      }

      if (window.Kakao?.Share?.sendDefault) {
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: '청첩장 게스트 관리 페이지',
            description: '하객분들께 보낼 청첩장 링크를 관리할 수 있어요',
            imageUrl: imageUrl,
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl,
            },
          },
          buttons: [
            {
              title: '사용 가이드',
              link: {
                mobileWebUrl: guideUrl,
                webUrl: guideUrl,
              },
            },
            {
              title: '관리 페이지 열기',
              link: {
                mobileWebUrl: shareUrl,
                webUrl: shareUrl,
              },
            },
          ],
        })
      } else {
        // SDK 아직 로딩 중 - 링크 복사로 대체
        handleCopyShareLink()
        showToastMsg('카카오톡 공유 준비 중입니다. 링크가 복사되었습니다.', 'info')
      }
    } catch (error) {
      console.error('Kakao share error:', error)
      handleCopyShareLink()
      showToastMsg('카카오톡 공유에 실패했습니다. 링크가 복사되었습니다.', 'error')
    }
  }

  // 가이드 페이지로 이동
  const handleGoToGuide = () => {
    router.push(`/invite/${inviteId}/admin/guide`)
  }

  // 호칭 옵션
  const honorificOptions = [
    { value: '님께', label: '님께' },
    { value: '께', label: '께' },
    { value: '님', label: '님' },
    { value: '에게', label: '에게' },
    { value: '', label: '사용안함' },
  ]

  // 템플릿 옵션
  const templateOptions = [
    { value: '', label: '직접 작성' },
    ...templates.map((t) => ({
      value: t.id,
      label: `${t.name}${t.is_default ? ' (기본)' : ''}`,
    })),
  ]

  // RSVP 필터링/검색/정렬
  const filteredRsvpResponses = useMemo(() => {
    let filtered = [...rsvpResponses]

    // 필터
    if (rsvpFilter === 'groom' || rsvpFilter === 'bride') {
      filtered = filtered.filter((r) => r.side === rsvpFilter)
    } else if (rsvpFilter !== 'all') {
      filtered = filtered.filter((r) => r.attendance === rsvpFilter)
    }

    // 검색
    if (rsvpSearch.trim()) {
      const query = rsvpSearch.trim().toLowerCase()
      filtered = filtered.filter((r) => r.guest_name.toLowerCase().includes(query))
    }

    // 정렬
    filtered.sort((a, b) => {
      if (rsvpSort === 'name') {
        return a.guest_name.localeCompare(b.guest_name, 'ko')
      }
      if (rsvpSort === 'count') {
        return b.guest_count - a.guest_count
      }
      // date (최신순)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return filtered
  }, [rsvpResponses, rsvpFilter, rsvpSearch, rsvpSort])

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

        {/* 모바일 메뉴 버튼 */}
        <div className="relative">
          <button
            onClick={() => setShowHeaderMenu(!showHeaderMenu)}
            className="p-2 rounded-lg transition-all active:scale-95"
            style={{ backgroundColor: showHeaderMenu ? '#E8E4DD' : '#F5F3EE' }}
            aria-label="메뉴 열기"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="5" r="1.5" fill="#555" />
              <circle cx="12" cy="12" r="1.5" fill="#555" />
              <circle cx="12" cy="19" r="1.5" fill="#555" />
            </svg>
          </button>

          {/* 드롭다운 메뉴 */}
          {showHeaderMenu && (
            <>
              {/* 오버레이 */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowHeaderMenu(false)}
              />
              {/* 메뉴 */}
              <div
                className="absolute right-0 top-full mt-2 z-50 py-2 rounded-xl shadow-lg min-w-[160px]"
                style={{ backgroundColor: '#FFF', border: '1px solid #E8E4DD' }}
              >
                <button
                  onClick={() => {
                    setShowHeaderMenu(false)
                    handleGoToGuide()
                  }}
                  className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 transition-colors hover:bg-gray-50"
                  style={{ color: '#2C2C2C' }}
                >
                  <span className="text-base">📖</span>
                  도움말
                </button>
                <button
                  onClick={() => {
                    setShowHeaderMenu(false)
                    setShowShareModal(true)
                  }}
                  className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 transition-colors hover:bg-gray-50"
                  style={{ color: '#2C2C2C' }}
                >
                  <span className="text-base">📤</span>
                  부모님께 공유
                </button>
                <div className="h-px mx-4 my-1" style={{ backgroundColor: '#E8E4DD' }} />
                <button
                  onClick={() => {
                    setShowHeaderMenu(false)
                    openPasswordModal()
                  }}
                  className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 transition-colors hover:bg-gray-50"
                  style={{ color: '#2C2C2C' }}
                >
                  <span className="text-base">🔒</span>
                  비밀번호 변경
                </button>
                <button
                  onClick={() => {
                    setShowHeaderMenu(false)
                    handleLogout()
                  }}
                  className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 transition-colors hover:bg-gray-50"
                  style={{ color: '#DC2626' }}
                >
                  <span className="text-base">🚪</span>
                  로그아웃
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* 통계 */}
      {stats && (
        <div className="px-4 py-4 grid grid-cols-4 gap-2">
          {[
            { label: '전체', value: stats.total, color: '#2C2C2C' },
            { label: '열람', value: stats.opened, color: '#4CAF50' },
            { label: '미열람', value: stats.notOpened, color: '#FF9800' },
            { label: 'RSVP', value: rsvpSummary?.total || stats.withRsvp, color: '#C9A962' },
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
                kakaoThumbnail={invitationInfo?.kakaoThumbnail}
                groomName={invitationInfo?.groomName}
                brideName={invitationInfo?.brideName}
              />
            </div>
          </div>
        )}
      </div>

      {/* RSVP 응답 섹션 */}
      {(
        <div className="px-4 mb-4">
          <button
            onClick={() => toggleSection('rsvp')}
            className="w-full flex items-center justify-between p-4 rounded-t-lg"
            style={{
              backgroundColor: '#FFF',
              borderBottom: openSections.includes('rsvp') ? '1px solid #E8E4DD' : 'none',
              borderRadius: openSections.includes('rsvp') ? '12px 12px 0 0' : '12px',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">📋</span>
              <span className="font-semibold" style={{ color: '#2C2C2C' }}>
                RSVP 응답
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: '#C9A962', color: '#FFF' }}
              >
                {rsvpResponses.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* CSV 내보내기 버튼 */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(`/api/rsvp/export?invitationId=${inviteId}`)
                }}
                className="p-1.5 rounded-lg transition-all active:scale-95"
                style={{ backgroundColor: '#F5F3EE' }}
                title="CSV 내보내기"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
              <span
                className="transition-transform duration-200"
                style={{
                  transform: openSections.includes('rsvp') ? 'rotate(180deg)' : 'rotate(0deg)',
                  color: '#888',
                }}
              >
                ▼
              </span>
            </div>
          </button>

          {openSections.includes('rsvp') && (
            <div
              className="rounded-b-lg overflow-hidden"
              style={{ backgroundColor: '#FFF' }}
            >
              {/* 요약 카드 */}
              {rsvpSummary && (
                <div className="px-4 pt-4 pb-2">
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[
                      { label: '참석', value: rsvpSummary.attending, color: '#4CAF50' },
                      { label: '불참', value: rsvpSummary.notAttending, color: '#EF4444' },
                      { label: '미정', value: rsvpSummary.pending, color: '#F59E0B' },
                      { label: '식사인원', value: `${rsvpSummary.totalGuests}명`, color: '#C9A962' },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="text-center py-2.5 rounded-lg"
                        style={{ backgroundColor: '#F8F6F2' }}
                      >
                        <div className="text-xl font-bold" style={{ color: item.color }}>
                          {item.value}
                        </div>
                        <div className="text-[10px] font-medium mt-0.5" style={{ color: '#888' }}>
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 참석률 프로그레스 바 */}
                  {rsvpSummary.total > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium" style={{ color: '#555' }}>
                          참석률 {Math.round((rsvpSummary.attending / rsvpSummary.total) * 100)}%
                        </span>
                        <span className="text-[10px]" style={{ color: '#AAA' }}>
                          {rsvpSummary.attending}/{rsvpSummary.total}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#E8E4DD' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(rsvpSummary.attending / rsvpSummary.total) * 100}%`,
                            backgroundColor: '#4CAF50',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 신랑측/신부측 분리 */}
                  {(rsvpSummary.groomSide > 0 || rsvpSummary.brideSide > 0) && (
                    <div className="flex items-center justify-center gap-3 py-2">
                      <span className="text-xs" style={{ color: '#555' }}>
                        신랑측 <span className="font-semibold">{rsvpSummary.groomSide}명</span>
                        <span style={{ color: '#AAA' }}>({rsvpSummary.groomSideGuests}명)</span>
                      </span>
                      <span style={{ color: '#DDD' }}>·</span>
                      <span className="text-xs" style={{ color: '#555' }}>
                        신부측 <span className="font-semibold">{rsvpSummary.brideSide}명</span>
                        <span style={{ color: '#AAA' }}>({rsvpSummary.brideSideGuests}명)</span>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 필터 탭 */}
              <div className="px-4 pb-2">
                <div className="flex gap-1.5 overflow-x-auto">
                  {([
                    { key: 'all' as const, label: '전체', count: rsvpResponses.length },
                    { key: 'attending' as const, label: '참석', count: rsvpSummary?.attending || 0 },
                    { key: 'not_attending' as const, label: '불참', count: rsvpSummary?.notAttending || 0 },
                    { key: 'pending' as const, label: '미정', count: rsvpSummary?.pending || 0 },
                    ...((rsvpSummary?.groomSide || 0) > 0 || (rsvpSummary?.brideSide || 0) > 0 ? [
                      { key: 'groom' as const, label: '신랑측', count: rsvpSummary?.groomSide || 0 },
                      { key: 'bride' as const, label: '신부측', count: rsvpSummary?.brideSide || 0 },
                    ] : []),
                  ]).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setRsvpFilter(tab.key)}
                      className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={{
                        backgroundColor: rsvpFilter === tab.key ? '#2C2C2C' : '#F5F3EE',
                        color: rsvpFilter === tab.key ? '#FFF' : '#888',
                      }}
                    >
                      {tab.label} {tab.count}
                    </button>
                  ))}
                </div>
              </div>

              {/* 검색 + 정렬 */}
              <div className="px-4 pb-3 flex gap-2">
                <div className="flex-1 relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#AAA" strokeWidth="2" strokeLinecap="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="이름 검색"
                    value={rsvpSearch}
                    onChange={(e) => setRsvpSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border-none outline-none"
                    style={{ backgroundColor: '#F8F6F2', color: '#2C2C2C' }}
                  />
                </div>
                <select
                  value={rsvpSort}
                  onChange={(e) => setRsvpSort(e.target.value as 'date' | 'name' | 'count')}
                  className="px-3 py-2 text-xs rounded-lg border-none outline-none appearance-none cursor-pointer"
                  style={{ backgroundColor: '#F8F6F2', color: '#555' }}
                >
                  <option value="date">최신순</option>
                  <option value="name">이름순</option>
                  <option value="count">인원순</option>
                </select>
              </div>

              {/* RSVP 목록 */}
              <div className="px-4 pb-4 space-y-2">
                {filteredRsvpResponses.length > 0 ? (
                  filteredRsvpResponses.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: '#F8F6F2' }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm" style={{ color: '#2C2C2C' }}>
                              {r.guest_name}
                            </span>
                            {r.side && (
                              <span className="text-[10px]" style={{ color: '#AAA' }}>
                                {r.side === 'groom' ? '신랑측' : '신부측'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                              style={{
                                backgroundColor:
                                  r.attendance === 'attending' ? '#DCFCE7' :
                                  r.attendance === 'not_attending' ? '#FEE2E2' : '#FEF9C3',
                                color:
                                  r.attendance === 'attending' ? '#166534' :
                                  r.attendance === 'not_attending' ? '#991B1B' : '#854D0E',
                              }}
                            >
                              {r.attendance === 'attending' ? '참석' :
                               r.attendance === 'not_attending' ? '불참' : '미정'}
                              {r.attendance === 'attending' && r.guest_count > 0 && ` ${r.guest_count}명`}
                            </span>
                            <span className="text-[10px]" style={{ color: '#AAA' }}>
                              {new Date(r.created_at).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setDeletingRsvpId(r.id)}
                          className="p-1.5 rounded-lg transition-all active:scale-95 shrink-0 ml-2"
                          style={{ color: '#CCC' }}
                          title="삭제"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </div>
                      {r.message && (
                        <p className="text-xs mt-2 leading-relaxed" style={{ color: '#888' }}>
                          &ldquo;{r.message}&rdquo;
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm" style={{ color: '#AAA' }}>
                      {rsvpSearch || rsvpFilter !== 'all' ? '검색 결과가 없습니다' : '응답이 없습니다'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* RSVP 삭제 확인 모달 */}
      {deletingRsvpId && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingRsvpId(null)}
          title="RSVP 응답 삭제"
          position="bottom"
        >
          <ModalBody>
            <div className="text-center py-4">
              <p className="text-sm" style={{ color: '#555' }}>
                이 RSVP 응답을 삭제하시겠습니까?
              </p>
              <p className="text-xs mt-2" style={{ color: '#AAA' }}>
                삭제된 응답은 복구할 수 없습니다.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <div className="flex gap-3 w-full">
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => setDeletingRsvpId(null)}
              >
                취소
              </Button>
              <button
                onClick={() => handleDeleteRsvp(deletingRsvpId)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                style={{ backgroundColor: '#EF4444', color: '#FFF' }}
              >
                삭제
              </button>
            </div>
          </ModalFooter>
        </Modal>
      )}

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
          {/* 개인/단체 탭 - 추가 모드에서만 표시 */}
          {!editingGuest && (
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: '#E8E4DD' }}>
              <button
                type="button"
                onClick={() => {
                  setGuestType('individual')
                  setGuestForm({ ...guestForm, name: '', relation: '', honorific: '님께' })
                }}
                className="flex-1 py-2.5 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: guestType === 'individual' ? '#2C2C2C' : '#FFF',
                  color: guestType === 'individual' ? '#FFF' : '#888',
                }}
              >
                개인
              </button>
              <button
                type="button"
                onClick={() => {
                  setGuestType('group')
                  setGuestForm({ ...guestForm, name: '', relation: '', honorific: '' })
                }}
                className="flex-1 py-2.5 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: guestType === 'group' ? '#2C2C2C' : '#FFF',
                  color: guestType === 'group' ? '#FFF' : '#888',
                }}
              >
                단체
              </button>
            </div>
          )}

          {guestType === 'individual' ? (
            <>
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
                  helperText="예) 이모, 삼촌, 직장 상사"
                />
                <Select
                  label="호칭"
                  value={guestForm.honorific}
                  options={honorificOptions}
                  onChange={(value) => setGuestForm({ ...guestForm, honorific: value })}
                />
              </div>
            </>
          ) : (
            <>
              <Input
                label="단체명 *"
                value={guestForm.name}
                onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                placeholder="○○회사 사우분들"
                error={formErrors.name}
                helperText="예) ○○회사 사우분들, ○○고 동창회 친구들"
              />
              <Input
                label="관계 (선택)"
                value={guestForm.relation}
                onChange={(e) => setGuestForm({ ...guestForm, relation: e.target.value })}
                placeholder="직장"
                helperText="예) 직장, 동창, 동호회"
              />
            </>
          )}

          <Input
            label="모시는 글 (첫문장)"
            value={guestForm.intro_greeting}
            onChange={(e) => setGuestForm({ ...guestForm, intro_greeting: e.target.value })}
            placeholder="초대합니다."
            helperText="예) 초대합니다, 소중한 분을 초대합니다"
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
              label="맞춤 메시지 (선택)"
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
                style={{ backgroundColor: invitationInfo?.themeColor || '#722F37' }}
              >
                <div
                  className="mx-auto max-w-[260px] py-8 px-6 text-center"
                  style={{
                    backgroundColor: '#F7F4EF',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                  }}
                >
                  <div className="h-px w-[60px] mx-auto mb-4" style={{ backgroundColor: invitationInfo?.accentColor || '#C9A962' }} />
                  {guestForm.relation && (
                    <p className="text-xs mb-1" style={{ color: '#666' }}>
                      {guestForm.relation}
                    </p>
                  )}
                  <p
                    className="text-xl"
                    style={{ color: '#2C2C2C', fontFamily: "'Noto Serif KR', Georgia, serif" }}
                  >
                    {guestForm.name}{guestForm.honorific ? ` ${guestForm.honorific}` : ''}
                  </p>
                  <div className="h-px w-[60px] mx-auto mt-4" style={{ backgroundColor: invitationInfo?.accentColor || '#C9A962' }} />
                </div>
              </div>
            </div>
          )}

          {/* 편지지 미리보기 (Parents 템플릿 스타일) */}
          {guestForm.name && (guestForm.greeting_template_id || guestForm.custom_message) && (() => {
            let greetingContent = ''
            if (guestForm.greeting_template_id) {
              const selectedTemplate = templates.find(t => t.id === guestForm.greeting_template_id)
              if (selectedTemplate) {
                greetingContent = selectedTemplate.content
              }
            } else {
              greetingContent = guestForm.custom_message
            }

            // 표시명 생성
            const honorificSuffix = guestForm.honorific ? ` ${guestForm.honorific}` : ''
            const displayGreetingTo = guestForm.intro_greeting || (guestForm.relation
              ? `${guestForm.name} ${guestForm.relation}${honorificSuffix}`
              : `${guestForm.name}${honorificSuffix}`)

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
                  style={{ backgroundColor: invitationInfo?.themeColor || '#722F37' }}
                >
                  <div
                    className="mx-auto max-w-[280px] py-6 px-5 text-center rounded-xl"
                    style={{
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    }}
                  >
                    <p className="text-[10px] tracking-[2px] mb-3" style={{ color: invitationInfo?.accentColor || '#C9A962' }}>
                      WEDDING INVITATION
                    </p>
                    <div className="h-px w-[40px] mx-auto mb-3" style={{ backgroundColor: invitationInfo?.accentColor || '#C9A962' }} />
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
                    <div className="h-px w-[40px] mx-auto mb-2" style={{ backgroundColor: invitationInfo?.accentColor || '#C9A962' }} />
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

      {/* 부모님께 공유 모달 */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="부모님께 관리 페이지 공유"
        position="bottom"
      >
        <ModalBody className="space-y-4">
          <div className="text-center py-4">
            <div className="text-4xl mb-3">👨‍👩‍👧</div>
            <p className="text-sm" style={{ color: '#555' }}>
              부모님도 게스트 관리를 할 수 있어요
            </p>
            <p className="text-xs mt-2" style={{ color: '#888' }}>
              관리 페이지 링크를 공유하면<br />
              부모님이 직접 하객분들께 청첩장을 보낼 수 있어요
            </p>
          </div>

          {/* 공유 버튼들 */}
          <div className="flex gap-3">
            <button
              onClick={handleKakaoShare}
              className="flex-1 flex flex-col items-center gap-2 py-4 rounded-xl transition-all active:scale-[0.98]"
              style={{ backgroundColor: '#FEE500' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#3C1E1E">
                <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.47 1.607 4.647 4.03 5.938-.128.469-.823 3.015-.853 3.227 0 0-.017.169.09.234.107.066.232.029.232.029.307-.043 3.558-2.313 4.118-2.71.457.063.922.098 1.383.098 5.523 0 10-3.477 10-7.768C22 6.477 17.523 3 12 3z"/>
              </svg>
              <span className="text-xs font-medium" style={{ color: '#3C1E1E' }}>
                카카오톡 공유
              </span>
            </button>
            <button
              onClick={handleCopyShareLink}
              className="flex-1 flex flex-col items-center gap-2 py-4 rounded-xl transition-all active:scale-[0.98]"
              style={{ backgroundColor: '#F5F3EE' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              <span className="text-xs font-medium" style={{ color: '#555' }}>
                링크 복사
              </span>
            </button>
          </div>

          {/* 안내 문구 */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: '#FFFBF0', border: '1px solid #F5E6B8' }}
          >
            <div className="flex items-start gap-2">
              <span className="text-sm">💡</span>
              <div className="text-xs" style={{ color: '#8B7355' }}>
                <p className="font-medium mb-1">PIN 번호는 별도로 전달해주세요</p>
                <p>보안을 위해 PIN 번호는 카카오톡 메시지에 포함되지 않아요. 전화나 문자로 따로 알려주세요.</p>
              </div>
            </div>
          </div>

          {/* 가이드 링크 */}
          <button
            onClick={() => {
              setShowShareModal(false)
              handleGoToGuide()
            }}
            className="w-full py-3 text-sm font-medium rounded-xl transition-all"
            style={{ backgroundColor: '#F5F3EE', color: '#555' }}
          >
            📖 사용 가이드 보기
          </button>
        </ModalBody>
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
