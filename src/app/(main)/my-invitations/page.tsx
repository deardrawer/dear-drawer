'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  wedding_time: string
  venue_name: string
  slug: string
  is_published: boolean
  is_paid: boolean
  created_at: string
  updated_at: string
  template_id: string
  rsvp_count?: number
  main_image?: string
  content?: string
}

// PARENTS 템플릿 컬러 테마 맵핑
const PARENTS_COLOR_MAP: Record<string, string> = {
  burgundy: '#722F37',
  navy: '#1E3A5F',
  sage: '#7D8471',
  dustyRose: '#C4A4A4',
  emerald: '#2D5A4A',
  slateBlue: '#6B7B8C',
}

// 이미지 URL 추출 헬퍼 (객체/문자열 모두 대응)
function extractImageUrl(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null && 'url' in value) {
    return (value as { url: string }).url || ''
  }
  return ''
}

// content JSON에서 커버 이미지와 인트로 정보 추출
function parseInvitationContent(content?: string) {
  if (!content) return { coverImage: '', kakaoThumbnail: '', introTitle: '', introSubTitle: '', senderSide: '', envelopeTheme: '' }
  try {
    const parsed = JSON.parse(content)

    // 카카오 공유용 이미지 우선순위: kakaoThumbnail > ogImage > coverImage > mainImage > gallery[0]
    const kakaoThumbnail =
      extractImageUrl(parsed.meta?.kakaoThumbnail) ||
      extractImageUrl(parsed.meta?.ogImage) ||
      extractImageUrl(parsed.media?.coverImage) ||
      extractImageUrl(parsed.mainImage) ||
      extractImageUrl(parsed.gallery?.images?.[0]) ||
      ''

    // 카드 미리보기용 커버 이미지 (media.coverImage > mainImage > gallery[0])
    const coverImage =
      extractImageUrl(parsed.media?.coverImage) ||
      extractImageUrl(parsed.mainImage) ||
      extractImageUrl(parsed.gallery?.images?.[0]) ||
      ''

    // PARENTS 템플릿의 colorTheme ID를 실제 hex 컬러로 변환
    const colorThemeId = parsed.colorTheme || 'burgundy'
    const envelopeTheme = PARENTS_COLOR_MAP[colorThemeId] || '#722F37'

    return {
      coverImage,
      kakaoThumbnail,
      introTitle: parsed.intro?.mainTitle || parsed.design?.coverTitle || '',
      introSubTitle: parsed.intro?.subTitle || '',
      senderSide: parsed.sender?.side || '', // groom or bride (혼주용 템플릿)
      envelopeTheme, // 혼주용 봉투 테마 컬러 (hex)
    }
  } catch {
    return { coverImage: '', kakaoThumbnail: '', introTitle: '', introSubTitle: '', senderSide: '', envelopeTheme: '' }
  }
}

// 템플릿 ID로 표시 이름 가져오기
function getTemplateDisplayName(templateId: string, senderSide?: string) {
  switch (templateId) {
    case 'narrative-parents':
    case 'parents':
    case 'parents-formal':
      if (senderSide === 'groom') return '신랑 혼주용'
      if (senderSide === 'bride') return '신부 혼주용'
      return '혼주용'
    case 'narrative-our':
    case 'our':
      return 'OUR'
    case 'narrative-family':
    case 'family':
      return 'FAMILY'
    default:
      return templateId || '기본'
  }
}

// 템플릿 배지 색상
function getTemplateBadgeColor(templateId: string, senderSide?: string) {
  if (templateId === 'narrative-parents' || templateId === 'parents' || templateId === 'parents-formal') {
    if (senderSide === 'groom') return 'bg-blue-100 text-blue-700'
    if (senderSide === 'bride') return 'bg-pink-100 text-pink-700'
    return 'bg-purple-100 text-purple-700'
  }
  if (templateId === 'narrative-our' || templateId === 'our') {
    return 'bg-rose-100 text-rose-700'
  }
  if (templateId === 'narrative-family' || templateId === 'family') {
    return 'bg-amber-100 text-amber-700'
  }
  return 'bg-gray-100 text-gray-600'
}

type RSVPData = {
  id: string
  guest_name: string
  guest_phone: string | null
  attendance: 'attending' | 'not_attending' | 'pending'
  guest_count: number
  message: string | null
  side: 'groom' | 'bride' | null
  created_at: string
}

type GuestbookMessage = {
  id: string
  guest_name: string
  message: string
  question: string | null
  created_at: string
}

export default function MyInvitationsPage() {
  const { user, status } = useAuth()
  const router = useRouter()
  const [invitations, setInvitations] = useState<InvitationSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

  // 필터 상태
  const [filterType, setFilterType] = useState<'all' | 'our' | 'family' | 'parents'>('all')

  // 미리보기 모달 상태
  const [previewInvitation, setPreviewInvitation] = useState<InvitationSummary | null>(null)

  // 공유 모달 상태
  const [shareInvitation, setShareInvitation] = useState<InvitationSummary | null>(null)
  const [copied, setCopied] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  // 관리 모달 상태
  const [manageInvitation, setManageInvitation] = useState<InvitationSummary | null>(null)
  const [rsvpData, setRsvpData] = useState<RSVPData[]>([])
  const [guestbookData, setGuestbookData] = useState<GuestbookMessage[]>([])
  const [isLoadingManageData, setIsLoadingManageData] = useState(false)
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null)
  const [customSlug, setCustomSlug] = useState('')
  const [isUpdatingSlug, setIsUpdatingSlug] = useState(false)
  const [slugError, setSlugError] = useState('')
  const manageQrCanvasRef = useRef<HTMLCanvasElement>(null)
  const [manageQrCodeUrl, setManageQrCodeUrl] = useState('')

  // RSVP 필터/검색/정렬
  const [rsvpFilter, setRsvpFilter] = useState<'all' | 'attending' | 'not_attending' | 'pending' | 'groom' | 'bride'>('all')
  const [rsvpSearch, setRsvpSearch] = useState('')
  const [rsvpSort, setRsvpSort] = useState<'date' | 'name' | 'count'>('date')
  const [deletingRsvpId, setDeletingRsvpId] = useState<string | null>(null)

  // 공유 URL
  const baseUrl = 'https://invite.deardrawer.com'
  const getInvitationUrl = (inv: InvitationSummary) => {
    const isParentsTemplate =
      inv.template_id === 'narrative-parents' ||
      inv.template_id === 'parents' ||
      inv.template_id === 'parents-formal'
    const path = isParentsTemplate ? '/invite' : '/i'
    return inv.slug ? `${baseUrl}${path}/${inv.slug}` : `${baseUrl}${path}/${inv.id}`
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchInvitations()
    }
  }, [status, router])

  // 공유 모달 열릴 때 QR 코드 생성
  useEffect(() => {
    if (shareInvitation) {
      // 캔버스가 마운트될 시간을 주고 QR 코드 생성
      const timer = setTimeout(() => {
        generateQRCode(shareInvitation)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [shareInvitation])

  // 관리 모달 열릴 때 데이터 로드
  useEffect(() => {
    if (manageInvitation) {
      fetchManageData(manageInvitation.id)
      setCustomSlug(manageInvitation.slug || '')
      generateManageQRCode(manageInvitation)
      setRsvpFilter('all')
      setRsvpSearch('')
      setRsvpSort('date')
    }
  }, [manageInvitation])

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

  const fetchManageData = async (invitationId: string) => {
    setIsLoadingManageData(true)
    try {
      const [rsvpRes, guestbookRes] = await Promise.all([
        fetch(`/api/rsvp?invitationId=${invitationId}`),
        fetch(`/api/guestbook?invitationId=${invitationId}`),
      ])
      const rsvpJson: { data?: typeof rsvpData } = await rsvpRes.json()
      const guestbookJson: { data?: typeof guestbookData } = await guestbookRes.json()
      setRsvpData(rsvpJson.data || [])
      setGuestbookData(guestbookJson.data || [])
    } catch (error) {
      console.error('Failed to fetch manage data:', error)
    } finally {
      setIsLoadingManageData(false)
    }
  }

  const generateQRCode = async (inv: InvitationSummary) => {
    const url = getInvitationUrl(inv)
    try {
      if (qrCanvasRef.current) {
        await QRCode.toCanvas(qrCanvasRef.current, url, {
          width: 150,
          margin: 2,
        })
      }
      const dataUrl = await QRCode.toDataURL(url, { width: 1024, margin: 2 })
      setQrCodeUrl(dataUrl)
    } catch (error) {
      console.error('Failed to generate QR code:', error)
    }
  }

  const generateManageQRCode = async (inv: InvitationSummary) => {
    const url = getInvitationUrl(inv)
    try {
      if (manageQrCanvasRef.current) {
        await QRCode.toCanvas(manageQrCanvasRef.current, url, {
          width: 120,
          margin: 2,
        })
      }
      const dataUrl = await QRCode.toDataURL(url, { width: 1024, margin: 2 })
      setManageQrCodeUrl(dataUrl)
    } catch (error) {
      console.error('Failed to generate QR code:', error)
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

  // 청첩장 복제 (최신 버전 기준)
  const handleDuplicate = async (invitation: InvitationSummary) => {
    if (duplicatingId) return

    setDuplicatingId(invitation.id)
    try {
      // 최신 데이터를 API에서 직접 조회
      const latestRes = await fetch(`/api/invitations/${invitation.id}`)
      if (!latestRes.ok) {
        alert('청첩장 정보를 불러올 수 없습니다.')
        return
      }
      const latestData = await latestRes.json() as { invitation?: Record<string, unknown> }
      const latest = latestData.invitation

      if (!latest) {
        alert('청첩장을 찾을 수 없습니다.')
        return
      }

      // 최신 content 사용
      const content = latest.content
        ? (typeof latest.content === 'string' ? JSON.parse(latest.content) : latest.content)
        : {}

      // slug, is_published 등은 복제하지 않음 (새 청첩장으로 시작)
      const payload = {
        template_id: latest.template_id || invitation.template_id,
        groom_name: latest.groom_name || invitation.groom_name,
        bride_name: latest.bride_name || invitation.bride_name,
        wedding_date: latest.wedding_date || invitation.wedding_date,
        wedding_time: latest.wedding_time || invitation.wedding_time,
        venue_name: latest.venue_name || invitation.venue_name,
        content: JSON.stringify(content),
      }

      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        alert('청첩장이 복제되었습니다!')
        fetchInvitations() // 목록 새로고침
      } else {
        const data = await response.json() as { error?: string }
        alert(data.error || '복제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to duplicate invitation:', error)
      alert('복제에 실패했습니다.')
    } finally {
      setDuplicatingId(null)
    }
  }

  // 공유 모달용 핸들러
  const handleCopyLink = () => {
    if (!shareInvitation) return
    navigator.clipboard.writeText(getInvitationUrl(shareInvitation))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadQR = () => {
    if (qrCodeUrl && shareInvitation) {
      const link = document.createElement('a')
      link.download = `qrcode-${shareInvitation.slug || shareInvitation.id}.png`
      link.href = qrCodeUrl
      link.click()
    }
  }

  const handleKakaoShare = () => {
    if (!shareInvitation) return
    const url = getInvitationUrl(shareInvitation)
    const { kakaoThumbnail } = parseInvitationContent(shareInvitation.content)

    const kakaoWindow = window as typeof window & {
      Kakao?: {
        isInitialized?: () => boolean
        Share?: { sendDefault: (config: object) => void }
      }
    }

    if (typeof window !== 'undefined' && kakaoWindow.Kakao?.Share && kakaoWindow.Kakao.isInitialized?.()) {
      const formattedDate = shareInvitation.wedding_date
        ? new Date(shareInvitation.wedding_date).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })
        : '날짜 미정'

      // 이미지 URL 결정 (kakaoThumbnail > ogImage > coverImage > 기본 이미지)
      let imageUrl = 'https://invite.deardrawer.com/og-image.png'
      if (kakaoThumbnail) {
        if (kakaoThumbnail.startsWith('https://')) {
          imageUrl = kakaoThumbnail
        } else if (kakaoThumbnail.startsWith('/')) {
          imageUrl = `https://invite.deardrawer.com${kakaoThumbnail}`
        }
      }

      kakaoWindow.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: `${shareInvitation.groom_name || '신랑'} ❤️ ${shareInvitation.bride_name || '신부'}의 결혼식`,
          description: `${formattedDate}\n${shareInvitation.venue_name || ''}`,
          imageUrl,
          link: { mobileWebUrl: url, webUrl: url },
        },
        buttons: [{ title: '모바일 청첩장 보기', link: { mobileWebUrl: url, webUrl: url } }],
      })
    } else {
      navigator.clipboard.writeText(url)
      alert('카카오톡 공유를 사용할 수 없어 링크가 복사되었습니다.')
    }
  }

  const handleSMSShare = () => {
    if (!shareInvitation) return
    const url = getInvitationUrl(shareInvitation)
    const formattedDate = shareInvitation.wedding_date
      ? new Date(shareInvitation.wedding_date).toLocaleDateString('ko-KR', {
          year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
        })
      : ''
    const details = [formattedDate, shareInvitation.wedding_time, shareInvitation.venue_name].filter(Boolean).join(' / ')
    const message = `${shareInvitation.groom_name || '신랑'} ♥ ${shareInvitation.bride_name || '신부'} 결혼합니다\n\n${details || '저희 결혼식에 초대합니다.'}\n\n청첩장 보기: ${url}`
    window.open(`sms:?body=${encodeURIComponent(message)}`)
  }

  // 관리 모달 - 링크 관리용 핸들러
  const handleManageCopyLink = () => {
    if (!manageInvitation) return
    navigator.clipboard.writeText(getInvitationUrl(manageInvitation))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleManageDownloadQR = () => {
    if (manageQrCodeUrl && manageInvitation) {
      const link = document.createElement('a')
      link.download = `qrcode-${manageInvitation.slug || manageInvitation.id}.png`
      link.href = manageQrCodeUrl
      link.click()
    }
  }

  const handleExportRSVP = () => {
    if (!manageInvitation) return
    window.open(`/api/rsvp/export?invitationId=${manageInvitation.id}`, '_blank')
  }

  const handleExportGuestbook = () => {
    if (!manageInvitation) return
    window.open(`/api/guestbook/export?invitationId=${manageInvitation.id}`, '_blank')
  }

  const handleDeleteGuestbookMessage = async (messageId: string) => {
    if (!manageInvitation || !confirm('이 방명록 메시지를 삭제하시겠습니까?')) return

    setDeletingMessageId(messageId)
    try {
      const response = await fetch(`/api/guestbook?messageId=${messageId}&invitationId=${manageInvitation.id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setGuestbookData((prev) => prev.filter((msg) => msg.id !== messageId))
      }
    } catch (error) {
      console.error('Failed to delete guestbook message:', error)
    } finally {
      setDeletingMessageId(null)
    }
  }

  const handleDeleteRsvp = async (rsvpId: string) => {
    if (!manageInvitation) return
    setDeletingRsvpId(null)
    try {
      const response = await fetch(`/api/rsvp?id=${rsvpId}&invitationId=${manageInvitation.id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setRsvpData((prev) => prev.filter((r) => r.id !== rsvpId))
      }
    } catch (error) {
      console.error('Failed to delete RSVP:', error)
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

  const calculateDaysLeft = (invitation: InvitationSummary) => {
    const now = new Date()
    if (invitation.is_paid) {
      if (!invitation.wedding_date) return null
      const weddingDate = new Date(invitation.wedding_date)
      const deleteDate = new Date(weddingDate.getTime() + 30 * 24 * 60 * 60 * 1000)
      const daysLeft = Math.ceil((deleteDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return { days: daysLeft, type: 'wedding' as const }
    } else {
      const createdDate = new Date(invitation.created_at)
      const deleteDate = new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      const daysLeft = Math.ceil((deleteDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return { days: daysLeft, type: 'created' as const }
    }
  }

  const getAttendanceLabel = (attendance: string) => {
    switch (attendance) {
      case 'attending': return '참석'
      case 'not_attending': return '불참'
      case 'pending': return '미정'
      default: return attendance
    }
  }

  const getAttendanceColor = (attendance: string) => {
    switch (attendance) {
      case 'attending': return 'bg-green-100 text-green-700'
      case 'not_attending': return 'bg-red-100 text-red-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const rsvpSummary = useMemo(() => {
    const attending = rsvpData.filter(r => r.attendance === 'attending')
    return {
      total: rsvpData.length,
      attending: attending.length,
      notAttending: rsvpData.filter(r => r.attendance === 'not_attending').length,
      pending: rsvpData.filter(r => r.attendance === 'pending').length,
      totalGuests: attending.reduce((sum, r) => sum + (r.guest_count || 1), 0),
      groomSide: attending.filter(r => r.side === 'groom').length,
      brideSide: attending.filter(r => r.side === 'bride').length,
      groomSideGuests: attending.filter(r => r.side === 'groom').reduce((sum, r) => sum + (r.guest_count || 1), 0),
      brideSideGuests: attending.filter(r => r.side === 'bride').reduce((sum, r) => sum + (r.guest_count || 1), 0),
    }
  }, [rsvpData])

  // RSVP 필터링/검색/정렬
  const filteredRsvpData = useMemo(() => {
    let filtered = [...rsvpData]

    if (rsvpFilter === 'groom' || rsvpFilter === 'bride') {
      filtered = filtered.filter((r) => r.side === rsvpFilter)
    } else if (rsvpFilter !== 'all') {
      filtered = filtered.filter((r) => r.attendance === rsvpFilter)
    }

    if (rsvpSearch.trim()) {
      const query = rsvpSearch.trim().toLowerCase()
      filtered = filtered.filter((r) => r.guest_name.toLowerCase().includes(query))
    }

    filtered.sort((a, b) => {
      if (rsvpSort === 'name') return a.guest_name.localeCompare(b.guest_name, 'ko')
      if (rsvpSort === 'count') return b.guest_count - a.guest_count
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return filtered
  }, [rsvpData, rsvpFilter, rsvpSearch, rsvpSort])

  // 전체 통계
  const stats = {
    total: invitations.length,
    paid: invitations.filter(inv => inv.is_paid).length,
    totalRsvp: invitations.reduce((sum, inv) => sum + (inv.rsvp_count || 0), 0),
  }

  // 필터링된 청첩장
  const filteredInvitations = invitations.filter(inv => {
    if (filterType === 'all') return true
    if (filterType === 'our') return inv.template_id === 'narrative-our' || inv.template_id === 'our'
    if (filterType === 'family') return inv.template_id === 'narrative-family' || inv.template_id === 'family'
    if (filterType === 'parents') return inv.template_id === 'narrative-parents' || inv.template_id === 'parents' || inv.template_id === 'parents-formal'
    return true
  })

  // 스켈레톤 카드 컴포넌트
  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="aspect-[9/16] bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="flex gap-2 mt-4">
          <div className="h-8 bg-gray-100 rounded flex-1" />
          <div className="h-8 bg-gray-100 rounded flex-1" />
          <div className="h-8 bg-gray-100 rounded flex-1" />
        </div>
      </div>
    </div>
  )

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* 스켈레톤 헤더 */}
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-6 mb-8 animate-pulse">
          <div className="h-6 bg-white/50 rounded w-32 mb-2" />
          <div className="h-4 bg-white/30 rounded w-48" />
        </div>
        {/* 스켈레톤 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 히어로 헤더 */}
      <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-purple-50 rounded-2xl p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">내 청첩장</h1>
            {stats.total > 0 ? (
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-rose-400 rounded-full" />
                  총 {stats.total}개
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                  결제완료 {stats.paid}개
                </span>
                {stats.totalRsvp > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-400 rounded-full" />
                    RSVP {stats.totalRsvp}명
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">아직 청첩장이 없습니다</p>
            )}
          </div>
          <Link href="/templates">
            <Button className="bg-black hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              새 청첩장 만들기
            </Button>
          </Link>
        </div>
      </div>

      {/* 필터 바 */}
      {invitations.length > 0 && (
        <div className="mb-6">
          {/* 템플릿 필터 탭 */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
            {[
              { key: 'all', label: '전체' },
              { key: 'our', label: 'OUR' },
              { key: 'family', label: 'FAMILY' },
              { key: 'parents', label: 'PARENTS' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterType(tab.key as typeof filterType)}
                className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                  filterType === tab.key
                    ? 'bg-white text-gray-900 shadow-sm font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {invitations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 md:p-12">
          {/* 감성 일러스트 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full mb-6">
              <span className="text-5xl">💌</span>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">아직 청첩장이 없습니다</h3>
            <p className="text-gray-500">세상에 하나뿐인 우리의 이야기를 담아보세요</p>
          </div>

          {/* 3단계 안내 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 max-w-3xl mx-auto">
            <div className="text-center p-4 rounded-xl bg-gray-50">
              <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-rose-600 font-semibold">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">템플릿 선택</h4>
              <p className="text-sm text-gray-500">OUR, FAMILY, PARENTS 중 선택</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gray-50">
              <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-rose-600 font-semibold">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">스토리 초안 작성</h4>
              <p className="text-sm text-gray-500">질문에 답하면 초안을 작성해드려요</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gray-50">
              <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-rose-600 font-semibold">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">공유하기</h4>
              <p className="text-sm text-gray-500">카카오톡, 문자로 손쉽게 공유</p>
            </div>
          </div>

          {/* CTA 버튼 */}
          <div className="text-center">
            <Link href="/editor?step=4">
              <Button size="lg" className="bg-black hover:bg-gray-800 px-8 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                청첩장 만들기
              </Button>
            </Link>
          </div>
        </div>
      ) : filteredInvitations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-gray-500">해당 템플릿의 청첩장이 없습니다</p>
          <button
            onClick={() => setFilterType('all')}
            className="mt-4 text-sm text-rose-600 hover:text-rose-700 font-medium"
          >
            전체 보기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvitations.map((invitation) => {
            const daysInfo = calculateDaysLeft(invitation)
            const { coverImage, introTitle, introSubTitle, senderSide, envelopeTheme } = parseInvitationContent(invitation.content)
            const displayImage = coverImage || invitation.main_image
            const templateName = getTemplateDisplayName(invitation.template_id, senderSide)
            const templateBadgeColor = getTemplateBadgeColor(invitation.template_id, senderSide)
            const isParentsTemplate = invitation.template_id === 'narrative-parents' || invitation.template_id === 'parents' || invitation.template_id === 'parents-formal'

            return (
              <Card key={invitation.id} className="overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div
                  className="aspect-[9/16] relative cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
                  onClick={() => setPreviewInvitation(invitation)}
                >
                  {/* 혼주용 템플릿: 항상 봉투 스타일 미리보기 */}
                  {isParentsTemplate ? (
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center"
                      style={{ backgroundColor: envelopeTheme || '#722F37' }}
                    >
                      {/* 봉투 미리보기 */}
                      <div className="w-[70%] aspect-[3/4] bg-gradient-to-b from-[#F7F4EF] to-[#EDE9E3] rounded-none shadow-lg flex flex-col items-center justify-center relative">
                        {/* 실링 왁스 장식 */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-8 h-8">
                          <img src="/images/shilling2.png" alt="" className="w-full h-full object-contain" />
                        </div>
                        {/* 구분선 */}
                        <div className="w-10 h-px bg-[#C9A962] mb-3 mt-8" />
                        {/* 받는 분 */}
                        <p className="text-[#2C2C2C] text-base tracking-wide">소중한분께</p>
                        {/* 구분선 */}
                        <div className="w-10 h-px bg-[#C9A962] mt-3" />
                      </div>
                      {/* 힌트 텍스트 */}
                      <p className="text-white/60 text-xs mt-4">터치하여 열기</p>
                    </div>
                  ) : displayImage ? (
                    /* OUR/FAMILY: 커버 이미지 */
                    <>
                      <img
                        src={displayImage}
                        alt="청첩장 커버"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      {/* 인트로 텍스트 오버레이 */}
                      <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-center p-4">
                        {introSubTitle && (
                          <p className="text-xs text-white/80 tracking-widest mb-2">{introSubTitle}</p>
                        )}
                        {introTitle && (
                          <h3 className="text-white text-lg font-light tracking-wide">{introTitle}</h3>
                        )}
                        {!introTitle && !introSubTitle && (
                          <h3 className="text-white text-lg font-light">
                            {invitation.groom_name} & {invitation.bride_name}
                          </h3>
                        )}
                      </div>
                    </>
                  ) : (
                    /* 기본: 그라데이션 배경 */
                    <div className="absolute inset-0 bg-gradient-to-b from-rose-50 to-white flex flex-col items-center justify-center text-center p-4">
                      <h3 className="font-medium text-gray-900 text-lg">
                        {invitation.groom_name} & {invitation.bride_name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{formatDate(invitation.wedding_date)}</p>
                    </div>
                  )}

                  {/* 상단 배지 */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {/* 템플릿 타입 배지 */}
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${templateBadgeColor}`}>
                      {templateName}
                    </span>
                    {/* 결제 상태 배지 */}
                    {invitation.is_paid ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">결제완료</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">미결제</span>
                    )}
                  </div>

                  {/* 하단 정보 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    {daysInfo && daysInfo.days > 0 && (
                      <div className={`px-2 py-1 rounded text-xs mb-2 inline-block ${invitation.is_paid ? 'bg-blue-500/80 text-white' : 'bg-orange-500/80 text-white'}`}>
                        {invitation.is_paid ? `예식일 +30일 후 삭제 (D-${daysInfo.days})` : `${daysInfo.days}일 후 자동 삭제`}
                      </div>
                    )}
                    <p className="text-xs text-white/90">클릭하여 미리보기</p>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">
                        {invitation.title || `${invitation.groom_name} & ${invitation.bride_name}`}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-400">수정: {new Date(invitation.updated_at).toLocaleDateString('ko-KR')}</p>
                    </div>
                    {invitation.rsvp_count !== undefined && invitation.rsvp_count > 0 && (
                      <span className="text-xs px-2 py-1 bg-rose-50 text-rose-600 rounded-full">RSVP {invitation.rsvp_count}</span>
                    )}
                  </div>

                  <p className="text-[10px] sm:text-xs text-gray-400 mb-3">
                    {invitation.is_paid ? '예식일로부터 30일 후 자동 삭제됩니다' : '결제하지 않은 청첩장은 생성일로부터 7일 후 자동 삭제됩니다'}
                  </p>

                  {/* 상단: 주요 액션 (에디터 편집, 워터마크 제거) */}
                  <div className={`grid gap-2 mb-2 ${invitation.is_paid ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    <Link href={invitation.template_id === 'narrative-parents' || invitation.template_id === 'parents' ? `/editor/parents?id=${invitation.id}` : `/editor?id=${invitation.id}`} className={invitation.is_paid ? 'col-span-1' : ''}>
                      <Button size="sm" className="w-full bg-gray-900 hover:bg-gray-800 text-white">에디터 편집하기</Button>
                    </Link>
                    {!invitation.is_paid && (
                      <Link href={`/dashboard/payment?invitationId=${invitation.id}`}>
                        <Button size="sm" className="w-full bg-rose-500 hover:bg-rose-600 text-white">워터마크 제거하기</Button>
                      </Link>
                    )}
                  </div>
                  {/* 하단: 보조 액션 (복제, 공유, 관리, 삭제) */}
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => handleDuplicate(invitation)}
                      disabled={duplicatingId === invitation.id}
                    >
                      {duplicatingId === invitation.id ? '...' : '복제'}
                    </Button>
                    <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setShareInvitation(invitation)}>
                      공유
                    </Button>
                    <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setManageInvitation(invitation)}>
                      관리
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(invitation.id)}
                      className="w-full text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      삭제
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>청첩장 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 청첩장을 삭제하시겠습니까?<br />삭제된 청첩장은 복구할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>취소</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 미리보기 모달 */}
      <Dialog open={!!previewInvitation} onOpenChange={() => setPreviewInvitation(null)}>
        <DialogContent className="max-w-[430px] p-0 overflow-hidden max-h-[95vh]">
          <div className="flex flex-col">
            {previewInvitation && !previewInvitation.is_paid && (
              <div className="bg-rose-50 px-4 py-3 text-center border-b">
                <p className="text-sm text-rose-600 font-medium">결제 후 워터마크가 제거됩니다</p>
              </div>
            )}
            <div className="relative w-full h-[85vh]">
              <Button variant="ghost" size="sm" onClick={() => setPreviewInvitation(null)} className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white">
                닫기
              </Button>
              {previewInvitation && (
                <iframe
                  src={
                    previewInvitation.template_id === 'narrative-parents' ||
                    previewInvitation.template_id === 'parents' ||
                    previewInvitation.template_id === 'parents-formal'
                      ? `/invite/${previewInvitation.id}?preview=true`
                      : `/i/${previewInvitation.id}?preview=true`
                  }
                  className="w-full h-full border-0"
                  title="청첩장 미리보기"
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 공유 모달 */}
      <Dialog open={!!shareInvitation} onOpenChange={() => setShareInvitation(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>청첩장 공유</DialogTitle>
            <DialogDescription>
              {shareInvitation?.groom_name} & {shareInvitation?.bride_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">청첩장 링크</p>
              <div className="flex gap-2">
                <Input value={shareInvitation ? getInvitationUrl(shareInvitation) : ''} readOnly className="flex-1 text-sm" />
                <Button onClick={handleCopyLink} variant="outline" size="sm">
                  {copied ? '복사됨!' : '복사'}
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">공유하기</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleKakaoShare} className="flex-1">
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="#3C1E1E">
                    <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.643 1.765 4.966 4.412 6.286l-.893 3.27a.3.3 0 00.455.334l3.862-2.552c.67.097 1.357.148 2.055.148 5.523 0 10-3.463 10-7.777C22 6.463 17.523 3 12 3z" />
                  </svg>
                  카카오톡
                </Button>
                <Button variant="outline" onClick={handleSMSShare} className="flex-1">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  문자
                </Button>
              </div>
            </div>

            <div className="flex flex-col items-center pt-2 border-t">
              <p className="text-sm font-medium text-gray-700 mb-2">QR 코드</p>
              <canvas ref={qrCanvasRef} className="rounded-lg border" />
              <Button variant="outline" onClick={handleDownloadQR} className="mt-2" size="sm">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                QR 다운로드
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 관리 모달 (탭) */}
      <Dialog open={!!manageInvitation} onOpenChange={() => setManageInvitation(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {manageInvitation?.groom_name} & {manageInvitation?.bride_name} 청첩장 관리
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="rsvp" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="rsvp">RSVP ({rsvpSummary.total})</TabsTrigger>
              <TabsTrigger value="guestbook">방명록 ({guestbookData.length})</TabsTrigger>
            </TabsList>

            {isLoadingManageData ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-200 border-t-rose-600" />
              </div>
            ) : (
              <>
                {/* RSVP 탭 */}
                <TabsContent value="rsvp" className="flex-1 overflow-auto mt-4">
                  <div className="space-y-4">
                    {/* 요약 카드 */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{rsvpSummary.attending}</p>
                        <p className="text-xs text-green-600">참석</p>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">{rsvpSummary.notAttending}</p>
                        <p className="text-xs text-red-600">불참</p>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600">{rsvpSummary.pending}</p>
                        <p className="text-xs text-yellow-600">미정</p>
                      </div>
                      <div className="p-3 bg-rose-50 rounded-lg">
                        <p className="text-2xl font-bold text-rose-600">{rsvpSummary.totalGuests}명</p>
                        <p className="text-xs text-rose-600">식사인원</p>
                      </div>
                    </div>

                    {/* 참석률 프로그레스 바 */}
                    {rsvpSummary.total > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-600">
                            참석률 {Math.round((rsvpSummary.attending / rsvpSummary.total) * 100)}%
                          </span>
                          <span className="text-xs text-gray-400">
                            {rsvpSummary.attending}/{rsvpSummary.total}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${(rsvpSummary.attending / rsvpSummary.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* 신랑측/신부측 분리 */}
                    {(rsvpSummary.groomSide > 0 || rsvpSummary.brideSide > 0) && (
                      <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
                        <span>
                          신랑측 <span className="font-semibold">{rsvpSummary.groomSide}명</span>
                          <span className="text-gray-400">({rsvpSummary.groomSideGuests}명)</span>
                        </span>
                        <span className="text-gray-300">|</span>
                        <span>
                          신부측 <span className="font-semibold">{rsvpSummary.brideSide}명</span>
                          <span className="text-gray-400">({rsvpSummary.brideSideGuests}명)</span>
                        </span>
                      </div>
                    )}

                    {/* 필터 탭 + CSV */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex gap-1 overflow-x-auto flex-1">
                        {([
                          { key: 'all' as const, label: '전체', count: rsvpData.length },
                          { key: 'attending' as const, label: '참석', count: rsvpSummary.attending },
                          { key: 'not_attending' as const, label: '불참', count: rsvpSummary.notAttending },
                          { key: 'pending' as const, label: '미정', count: rsvpSummary.pending },
                          ...(rsvpSummary.groomSide > 0 || rsvpSummary.brideSide > 0 ? [
                            { key: 'groom' as const, label: '신랑측', count: rsvpSummary.groomSide },
                            { key: 'bride' as const, label: '신부측', count: rsvpSummary.brideSide },
                          ] : []),
                        ]).map((tab) => (
                          <button
                            key={tab.key}
                            onClick={() => setRsvpFilter(tab.key)}
                            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                              rsvpFilter === tab.key
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {tab.label} {tab.count}
                          </button>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" onClick={handleExportRSVP} className="flex-shrink-0 h-7 px-2 text-xs">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        CSV
                      </Button>
                    </div>

                    {/* 검색 + 정렬 */}
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <svg
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <circle cx="11" cy="11" r="8" strokeWidth={2} />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth={2} />
                        </svg>
                        <Input
                          placeholder="이름 검색"
                          value={rsvpSearch}
                          onChange={(e) => setRsvpSearch(e.target.value)}
                          className="pl-8 h-8 text-xs"
                        />
                      </div>
                      <select
                        value={rsvpSort}
                        onChange={(e) => setRsvpSort(e.target.value as 'date' | 'name' | 'count')}
                        className="h-8 px-2 text-xs border border-gray-200 rounded-md bg-white text-gray-600"
                      >
                        <option value="date">최신순</option>
                        <option value="name">이름순</option>
                        <option value="count">인원순</option>
                      </select>
                    </div>

                    {/* RSVP 목록 */}
                    {filteredRsvpData.length > 0 ? (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {filteredRsvpData.map((r) => (
                          <div key={r.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm text-gray-900">{r.guest_name}</span>
                                  {r.side && (
                                    <span className="text-[10px] text-gray-400">
                                      {r.side === 'groom' ? '신랑측' : '신부측'}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getAttendanceColor(r.attendance)}`}>
                                    {getAttendanceLabel(r.attendance)}
                                    {r.attendance === 'attending' && r.guest_count > 0 && ` ${r.guest_count}명`}
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    {new Date(r.created_at).toLocaleDateString('ko-KR')}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => setDeletingRsvpId(r.id)}
                                className="p-1 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                                title="삭제"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                </svg>
                              </button>
                            </div>
                            {r.message && (
                              <p className="text-xs text-gray-500 mt-2">&ldquo;{r.message}&rdquo;</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-400 py-8">
                        {rsvpSearch || rsvpFilter !== 'all' ? '검색 결과가 없습니다' : '아직 RSVP 응답이 없습니다'}
                      </p>
                    )}
                  </div>
                </TabsContent>

                {/* 방명록 탭 */}
                <TabsContent value="guestbook" className="flex-1 overflow-auto mt-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">총 {guestbookData.length}개의 메시지</p>
                      <Button variant="outline" size="sm" onClick={handleExportGuestbook}>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        CSV 내보내기
                      </Button>
                    </div>

                    {guestbookData.length > 0 ? (
                      <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-white">
                            <tr className="border-b">
                              <th className="text-left py-2 px-2 font-medium">이름</th>
                              <th className="text-left py-2 px-2 font-medium">메시지</th>
                              <th className="text-left py-2 px-2 font-medium">등록일</th>
                              <th className="text-left py-2 px-2 font-medium">관리</th>
                            </tr>
                          </thead>
                          <tbody>
                            {guestbookData.map((msg) => (
                              <tr key={msg.id} className="border-b">
                                <td className="py-2 px-2 font-medium">{msg.guest_name}</td>
                                <td className="py-2 px-2 text-gray-700 max-w-[200px]">{msg.message}</td>
                                <td className="py-2 px-2 text-gray-500 text-xs">
                                  {new Date(msg.created_at).toLocaleDateString('ko-KR')}
                                </td>
                                <td className="py-2 px-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteGuestbookMessage(msg.id)}
                                    disabled={deletingMessageId === msg.id}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 px-2"
                                  >
                                    {deletingMessageId === msg.id ? '...' : '삭제'}
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center text-gray-400 py-8">아직 방명록 메시지가 없습니다</p>
                    )}
                  </div>
                </TabsContent>
              </>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* RSVP 삭제 확인 Dialog */}
      <Dialog open={!!deletingRsvpId} onOpenChange={() => setDeletingRsvpId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>RSVP 응답 삭제</DialogTitle>
            <DialogDescription>
              이 RSVP 응답을 삭제하시겠습니까?<br />삭제된 응답은 복구할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingRsvpId(null)}>취소</Button>
            <Button variant="destructive" onClick={() => deletingRsvpId && handleDeleteRsvp(deletingRsvpId)}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 모바일 플로팅 버튼 */}
      <div className="fixed bottom-6 right-6 md:hidden z-40">
        <Link href="/editor?step=4">
          <Button
            size="lg"
            className="rounded-full w-14 h-14 p-0 bg-black hover:bg-gray-800 shadow-2xl hover:scale-110 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Button>
        </Link>
      </div>
    </div>
  )
}
