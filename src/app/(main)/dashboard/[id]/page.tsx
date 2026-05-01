'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type RSVPData = {
  id: string
  guest_name: string
  guest_phone: string | null
  attendance: 'attending' | 'not_attending' | 'pending'
  guest_count: number
  message: string | null
  side: 'groom' | 'bride' | null
  meal_attendance: 'yes' | 'no' | null
  shuttle_bus: 'yes' | 'no' | null
  created_at: string
}

type Summary = {
  total: number
  attending: number
  notAttending: number
  pending: number
  totalGuests: number
  groomSide: number
  brideSide: number
  groomSideGuests: number
  brideSideGuests: number
  mealYes: number
  mealNo: number
  shuttleYes: number
  shuttleNo: number
}

type GuestbookMessage = {
  id: string
  guest_name: string
  message: string
  question: string | null
  created_at: string
}

const COLORS = ['#10B981', '#EF4444', '#F59E0B']

export default function DashboardPage() {
  const params = useParams()
  const invitationId = params.id as string

  const [responses, setResponses] = useState<RSVPData[]>([])
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    attending: 0,
    notAttending: 0,
    pending: 0,
    totalGuests: 0,
    groomSide: 0,
    brideSide: 0,
    groomSideGuests: 0,
    brideSideGuests: 0,
    mealYes: 0,
    mealNo: 0,
    shuttleYes: 0,
    shuttleNo: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [filterSides, setFilterSides] = useState<Set<string>>(new Set())
  const [filterMeal, setFilterMeal] = useState<string | null>(null)
  const [filterShuttle, setFilterShuttle] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [deletingRsvpId, setDeletingRsvpId] = useState<string | null>(null)
  const itemsPerPage = 10

  // 방명록 상태
  const [guestbookMessages, setGuestbookMessages] = useState<GuestbookMessage[]>([])
  const [guestbookSearchQuery, setGuestbookSearchQuery] = useState('')
  const [guestbookPage, setGuestbookPage] = useState(1)
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null)
  const [templateId, setTemplateId] = useState<string | null>(null)

  useEffect(() => {
    fetchRSVPData()
    fetchGuestbookData()
    fetchTemplateId()
  }, [invitationId])

  const fetchTemplateId = async () => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}`)
      const result = await response.json() as Record<string, unknown>
      const data = (result.invitation || result) as Record<string, unknown>
      if (data?.template_id) {
        setTemplateId(data.template_id as string)
      }
    } catch { /* ignore */ }
  }

  const fetchRSVPData = async () => {
    try {
      const response = await fetch(`/api/rsvp?invitationId=${invitationId}`)
      const data: { data?: RSVPData[]; summary?: Summary } = await response.json()
      setResponses(data.data || [])
      setSummary(data.summary || {
        total: 0,
        attending: 0,
        notAttending: 0,
        pending: 0,
        totalGuests: 0,
        groomSide: 0,
        brideSide: 0,
        groomSideGuests: 0,
        brideSideGuests: 0,
        mealYes: 0,
        mealNo: 0,
        shuttleYes: 0,
        shuttleNo: 0,
      })
    } catch (error) {
      console.error('Failed to fetch RSVP data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const chartData = [
    { name: '참석', value: summary.attending, color: '#10B981' },
    { name: '불참', value: summary.notAttending, color: '#EF4444' },
    { name: '미정', value: summary.pending, color: '#F59E0B' },
  ].filter(item => item.value > 0)

  // Filter helpers
  const hasActiveFilters = filterStatus !== null || filterSides.size > 0 || filterMeal !== null || filterShuttle !== null
  const resetFilters = () => {
    setFilterStatus(null)
    setFilterSides(new Set())
    setFilterMeal(null)
    setFilterShuttle(null)
    setCurrentPage(1)
  }
  const toggleSideFilter = (value: string) => {
    setFilterSides(prev => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
    setCurrentPage(1)
  }

  // Counts for chip badges
  const counts = {
    attending: summary.attending,
    not_attending: summary.notAttending,
    pending: summary.pending,
    groom: summary.groomSide,
    bride: summary.brideSide,
    noSide: summary.total - summary.groomSide - summary.brideSide,
    mealYes: summary.mealYes,
    mealNo: summary.mealNo,
    shuttleYes: summary.shuttleYes,
    shuttleNo: summary.shuttleNo,
  }

  const filteredResponses = responses.filter((r) => {
    if (filterStatus !== null && r.attendance !== filterStatus) return false
    if (filterSides.size > 0) {
      const sideValue = r.side === null ? 'none' : r.side
      if (!filterSides.has(sideValue)) return false
    }
    if (filterMeal !== null && r.meal_attendance !== filterMeal) return false
    if (filterShuttle !== null && r.shuttle_bus !== filterShuttle) return false
    if (searchQuery && !r.guest_name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const totalPages = Math.ceil(filteredResponses.length / itemsPerPage)
  const paginatedResponses = filteredResponses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const fetchGuestbookData = async () => {
    try {
      const response = await fetch(`/api/guestbook?invitationId=${invitationId}`)
      const data: { data?: GuestbookMessage[] } = await response.json()
      setGuestbookMessages(data.data || [])
    } catch (error) {
      console.error('Failed to fetch guestbook data:', error)
    }
  }

  const handleExportCSV = () => {
    window.open(`/api/rsvp/export?invitationId=${invitationId}`, '_blank')
  }

  const handleDeleteRsvp = async (rsvpId: string) => {
    setDeletingRsvpId(null)
    try {
      const response = await fetch(`/api/rsvp?id=${rsvpId}&invitationId=${invitationId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        fetchRSVPData()
      } else {
        alert('삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to delete RSVP:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  const handleExportGuestbookCSV = () => {
    window.open(`/api/guestbook/export?invitationId=${invitationId}`, '_blank')
  }

  const handleDeleteGuestbookMessage = async (messageId: string) => {
    if (!confirm('이 방명록 메시지를 삭제하시겠습니까?')) return

    setDeletingMessageId(messageId)
    try {
      const response = await fetch(`/api/guestbook?messageId=${messageId}&invitationId=${invitationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setGuestbookMessages((prev) => prev.filter((msg) => msg.id !== messageId))
      } else {
        alert('삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to delete guestbook message:', error)
      alert('삭제에 실패했습니다.')
    } finally {
      setDeletingMessageId(null)
    }
  }

  // 방명록 필터링 및 페이지네이션
  const filteredGuestbookMessages = guestbookMessages.filter((msg) =>
    guestbookSearchQuery ? msg.guest_name.toLowerCase().includes(guestbookSearchQuery.toLowerCase()) : true
  )
  const guestbookTotalPages = Math.ceil(filteredGuestbookMessages.length / itemsPerPage)
  const paginatedGuestbookMessages = filteredGuestbookMessages.slice(
    (guestbookPage - 1) * itemsPerPage,
    guestbookPage * itemsPerPage
  )

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

  // FilterChip inline component
  const FilterChip = ({ label, count, isActive, activeClass, onClick }: {
    label: string; count: number; isActive: boolean; activeClass: string; onClick: () => void
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors active:scale-95',
        isActive ? activeClass : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
      )}
    >
      {label}
      <span className={cn(
        'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-semibold',
        isActive ? 'bg-white/30 text-inherit' : 'bg-gray-100 text-gray-500'
      )}>
        {count}
      </span>
    </button>
  )

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-200 border-t-rose-600" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">RSVP 대시보드</h1>
            <p className="text-sm text-gray-500 mt-1">참석 응답을 확인하고 관리하세요</p>
          </div>
          <div className="flex gap-2">
            <Link href={
              templateId === 'narrative-parents' || templateId === 'parents'
                ? `/editor/parents?id=${invitationId}`
                : templateId === 'narrative-exhibit' || templateId === 'exhibit'
                ? `/editor/feed?id=${invitationId}`
                : templateId === 'narrative-thankyou'
                ? `/editor/thank-you?id=${invitationId}`
                : templateId === 'narrative-the-simple'
                ? `/editor/the-simple?id=${invitationId}`
                : templateId === 'narrative-essay'
                ? `/editor/essay?id=${invitationId}`
                : templateId === 'narrative-magazine' || templateId === 'narrative-film' || templateId === 'narrative-record'
                ? `/editor/feed?id=${invitationId}`
                : `/editor?id=${invitationId}`
            }>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">에디터로 돌아가기</Button>
            </Link>
            <Button onClick={handleExportCSV} size="sm" className="text-xs sm:text-sm">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards — compact on mobile */}
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4 mb-4 md:mb-8">
        <Card className="p-0">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-sm font-medium text-gray-500 truncate">총 응답</p>
            <div className="text-xl sm:text-3xl font-bold mt-1">{summary.total}</div>
          </CardContent>
        </Card>
        <Card className="p-0">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-sm font-medium text-green-600 truncate">참석</p>
            <div className="text-xl sm:text-3xl font-bold text-green-600 mt-1">{summary.attending}</div>
          </CardContent>
        </Card>
        <Card className="p-0">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-sm font-medium text-red-600 truncate">불참</p>
            <div className="text-xl sm:text-3xl font-bold text-red-600 mt-1">{summary.notAttending}</div>
          </CardContent>
        </Card>
        <Card className="p-0">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-sm font-medium text-gray-500 truncate">예상 참석</p>
            <div className="text-xl sm:text-3xl font-bold text-rose-600 mt-1">{summary.totalGuests}<span className="text-sm sm:text-lg font-normal text-gray-400">명</span></div>
          </CardContent>
        </Card>
        <Card className="p-0">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-sm font-medium text-orange-600 truncate">식사</p>
            <div className="text-xl sm:text-3xl font-bold text-orange-600 mt-1">{summary.mealYes}<span className="text-sm sm:text-lg font-normal text-gray-400">명</span></div>
            <p className="text-[10px] text-gray-400 mt-0.5 hidden sm:block">안함 {summary.mealNo}명</p>
          </CardContent>
        </Card>
        <Card className="p-0">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-sm font-medium text-purple-600 truncate">버스</p>
            <div className="text-xl sm:text-3xl font-bold text-purple-600 mt-1">{summary.shuttleYes}<span className="text-sm sm:text-lg font-normal text-gray-400">명</span></div>
            <p className="text-[10px] text-gray-400 mt-0.5 hidden sm:block">미이용 {summary.shuttleNo}명</p>
          </CardContent>
        </Card>
      </div>

      {/* Side Stats Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-6 md:mb-8">
        <Card className="p-0">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-sm font-medium text-blue-600">신랑측 참석</p>
            <div className="text-xl sm:text-3xl font-bold text-blue-600 mt-1">{summary.groomSideGuests}<span className="text-sm sm:text-lg font-normal text-gray-400 ml-0.5">명</span></div>
            <p className="text-[10px] text-gray-400 mt-0.5">응답 {summary.groomSide}건</p>
          </CardContent>
        </Card>
        <Card className="p-0">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-sm font-medium text-pink-600">신부측 참석</p>
            <div className="text-xl sm:text-3xl font-bold text-pink-600 mt-1">{summary.brideSideGuests}<span className="text-sm sm:text-lg font-normal text-gray-400 ml-0.5">명</span></div>
            <p className="text-[10px] text-gray-400 mt-0.5">응답 {summary.brideSide}건</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="mb-6 md:mb-8">
        <CardContent className="pt-4 pb-3 px-3 sm:pt-5 sm:pb-4 sm:px-4">
          {/* Search + Reset row */}
          <div className="flex items-center gap-2 sm:gap-3 mb-3">
            <div className="relative flex-1">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <Input
                placeholder="이름 검색..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2"
                >
                  초기화
                </button>
              )}
              <span className="text-xs text-gray-400 tabular-nums">{filteredResponses.length}건</span>
            </div>
          </div>

          {/* Filter chip rows */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="w-8 sm:w-14 text-[10px] sm:text-xs font-medium text-gray-500 shrink-0">참석</span>
              <FilterChip label="참석" count={counts.attending} isActive={filterStatus === 'attending'} activeClass="bg-green-100 text-green-700 border-green-300" onClick={() => { setFilterStatus(prev => prev === 'attending' ? null : 'attending'); setCurrentPage(1) }} />
              <FilterChip label="불참" count={counts.not_attending} isActive={filterStatus === 'not_attending'} activeClass="bg-red-100 text-red-700 border-red-300" onClick={() => { setFilterStatus(prev => prev === 'not_attending' ? null : 'not_attending'); setCurrentPage(1) }} />
              <FilterChip label="미정" count={counts.pending} isActive={filterStatus === 'pending'} activeClass="bg-yellow-100 text-yellow-700 border-yellow-300" onClick={() => { setFilterStatus(prev => prev === 'pending' ? null : 'pending'); setCurrentPage(1) }} />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="w-8 sm:w-14 text-[10px] sm:text-xs font-medium text-gray-500 shrink-0">소속</span>
              <FilterChip label="신랑측" count={counts.groom} isActive={filterSides.has('groom')} activeClass="bg-blue-100 text-blue-700 border-blue-300" onClick={() => toggleSideFilter('groom')} />
              <FilterChip label="신부측" count={counts.bride} isActive={filterSides.has('bride')} activeClass="bg-pink-100 text-pink-700 border-pink-300" onClick={() => toggleSideFilter('bride')} />
              <FilterChip label="미지정" count={counts.noSide} isActive={filterSides.has('none')} activeClass="bg-gray-200 text-gray-700 border-gray-400" onClick={() => toggleSideFilter('none')} />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="w-8 sm:w-14 text-[10px] sm:text-xs font-medium text-gray-500 shrink-0">식사</span>
              <FilterChip label="식사" count={counts.mealYes} isActive={filterMeal === 'yes'} activeClass="bg-orange-100 text-orange-700 border-orange-300" onClick={() => { setFilterMeal(prev => prev === 'yes' ? null : 'yes'); setCurrentPage(1) }} />
              <FilterChip label="안함" count={counts.mealNo} isActive={filterMeal === 'no'} activeClass="bg-orange-50 text-orange-600 border-orange-200" onClick={() => { setFilterMeal(prev => prev === 'no' ? null : 'no'); setCurrentPage(1) }} />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="w-8 sm:w-14 text-[10px] sm:text-xs font-medium text-gray-500 shrink-0">버스</span>
              <FilterChip label="이용" count={counts.shuttleYes} isActive={filterShuttle === 'yes'} activeClass="bg-purple-100 text-purple-700 border-purple-300" onClick={() => { setFilterShuttle(prev => prev === 'yes' ? null : 'yes'); setCurrentPage(1) }} />
              <FilterChip label="미이용" count={counts.shuttleNo} isActive={filterShuttle === 'no'} activeClass="bg-purple-50 text-purple-600 border-purple-200" onClick={() => { setFilterShuttle(prev => prev === 'no' ? null : 'no'); setCurrentPage(1) }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart and Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Pie Chart */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">참석 현황</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
                아직 응답이 없습니다
              </div>
            )}
          </CardContent>
        </Card>

        {/* Response List */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 sm:pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg">응답 목록</CardTitle>
              {hasActiveFilters && (
                <span className="text-xs sm:text-sm text-gray-500">필터 적용: {filteredResponses.length}건</span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {paginatedResponses.length > 0 ? (
              <>
                {/* Mobile: Card layout */}
                <div className="md:hidden space-y-3">
                  {paginatedResponses.map((r) => (
                    <div key={r.id} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{r.guest_name}</span>
                          {r.side === 'groom' ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700">신랑</span>
                          ) : r.side === 'bride' ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-pink-100 text-pink-700">신부</span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${getAttendanceColor(r.attendance)}`}>
                            {getAttendanceLabel(r.attendance)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setDeletingRsvpId(r.id)}
                            className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        {r.attendance === 'attending' && (
                          <span className="text-gray-600">{r.guest_count}명</span>
                        )}
                        {r.attendance === 'attending' && r.meal_attendance && (
                          <span className={`px-1.5 py-0.5 rounded ${r.meal_attendance === 'yes' ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-500'}`}>
                            {r.meal_attendance === 'yes' ? '식사' : '식사안함'}
                          </span>
                        )}
                        {r.attendance === 'attending' && r.shuttle_bus && (
                          <span className={`px-1.5 py-0.5 rounded ${r.shuttle_bus === 'yes' ? 'bg-purple-50 text-purple-600' : 'bg-gray-50 text-gray-500'}`}>
                            {r.shuttle_bus === 'yes' ? '버스이용' : '버스미이용'}
                          </span>
                        )}
                        <span className="text-gray-400 ml-auto">{new Date(r.created_at).toLocaleDateString('ko-KR')}</span>
                      </div>
                      {r.message && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{r.message}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop: Table layout */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium">이름</th>
                        <th className="text-left py-3 px-2 font-medium">연락처</th>
                        <th className="text-left py-3 px-2 font-medium">소속</th>
                        <th className="text-left py-3 px-2 font-medium">참석</th>
                        <th className="text-left py-3 px-2 font-medium">식사</th>
                        <th className="text-left py-3 px-2 font-medium">대절버스</th>
                        <th className="text-left py-3 px-2 font-medium">인원</th>
                        <th className="text-left py-3 px-2 font-medium">메시지</th>
                        <th className="text-left py-3 px-2 font-medium">응답일</th>
                        <th className="text-left py-3 px-2 font-medium">관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedResponses.map((r) => (
                        <tr key={r.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-2 font-medium">{r.guest_name}</td>
                          <td className="py-3 px-2 text-gray-500">{r.guest_phone || '-'}</td>
                          <td className="py-3 px-2">
                            {r.side === 'groom' ? (
                              <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">신랑측</span>
                            ) : r.side === 'bride' ? (
                              <span className="px-2 py-1 rounded-full text-xs bg-pink-100 text-pink-700">신부측</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${getAttendanceColor(r.attendance)}`}>
                              {getAttendanceLabel(r.attendance)}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            {r.attendance === 'attending' ? (
                              r.meal_attendance === 'yes' ? (
                                <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">식사</span>
                              ) : r.meal_attendance === 'no' ? (
                                <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">식사안함</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            {r.attendance === 'attending' ? (
                              r.shuttle_bus === 'yes' ? (
                                <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">이용</span>
                              ) : r.shuttle_bus === 'no' ? (
                                <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">미이용</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-2">{r.attendance === 'attending' ? r.guest_count : '-'}</td>
                          <td className="py-3 px-2 text-gray-500 max-w-[200px] truncate">
                            {r.message || '-'}
                          </td>
                          <td className="py-3 px-2 text-gray-500">
                            {new Date(r.created_at).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="py-3 px-2">
                            <button
                              type="button"
                              onClick={() => setDeletingRsvpId(r.id)}
                              className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                              title="삭제"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-xs sm:text-sm text-gray-500">
                      {filteredResponses.length}개 중 {(currentPage - 1) * itemsPerPage + 1}-
                      {Math.min(currentPage * itemsPerPage, filteredResponses.length)}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        이전
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        다음
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center text-gray-400 text-sm">
                {searchQuery || hasActiveFilters
                  ? '검색 결과가 없습니다'
                  : '아직 응답이 없습니다'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Guestbook Section */}
      <div className="mt-6 md:mt-8">
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg">방명록 관리</CardTitle>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">총 {guestbookMessages.length}개의 메시지</p>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="이름 검색..."
                  value={guestbookSearchQuery}
                  onChange={(e) => {
                    setGuestbookSearchQuery(e.target.value)
                    setGuestbookPage(1)
                  }}
                  className="flex-1 sm:w-40 h-9 text-sm"
                />
                <Button onClick={handleExportGuestbookCSV} variant="outline" size="sm" className="shrink-0 text-xs sm:text-sm">
                  <svg className="w-4 h-4 sm:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">CSV</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {paginatedGuestbookMessages.length > 0 ? (
              <>
                {/* Mobile: Card layout */}
                <div className="md:hidden space-y-3">
                  {paginatedGuestbookMessages.map((msg) => (
                    <div key={msg.id} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-medium text-sm">{msg.guest_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">{new Date(msg.created_at).toLocaleDateString('ko-KR')}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteGuestbookMessage(msg.id)}
                            disabled={deletingMessageId === msg.id}
                            className="text-xs text-gray-300 hover:text-red-500 transition-colors"
                          >
                            {deletingMessageId === msg.id ? '...' : '삭제'}
                          </button>
                        </div>
                      </div>
                      {msg.question && (
                        <p className="text-[11px] text-gray-400 mb-1">Q. {msg.question}</p>
                      )}
                      <p className="text-xs text-gray-700 leading-relaxed">{msg.message}</p>
                    </div>
                  ))}
                </div>

                {/* Desktop: Table layout */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium">이름</th>
                        <th className="text-left py-3 px-2 font-medium">질문</th>
                        <th className="text-left py-3 px-2 font-medium">메시지</th>
                        <th className="text-left py-3 px-2 font-medium">등록일</th>
                        <th className="text-left py-3 px-2 font-medium">관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedGuestbookMessages.map((msg) => (
                        <tr key={msg.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-2 font-medium">{msg.guest_name}</td>
                          <td className="py-3 px-2 text-gray-500 max-w-[150px] truncate">
                            {msg.question || '-'}
                          </td>
                          <td className="py-3 px-2 text-gray-700 max-w-[250px]">
                            {msg.message}
                          </td>
                          <td className="py-3 px-2 text-gray-500">
                            {new Date(msg.created_at).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="py-3 px-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteGuestbookMessage(msg.id)}
                              disabled={deletingMessageId === msg.id}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              {deletingMessageId === msg.id ? '...' : '삭제'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {guestbookTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-xs sm:text-sm text-gray-500">
                      {filteredGuestbookMessages.length}개 중 {(guestbookPage - 1) * itemsPerPage + 1}-
                      {Math.min(guestbookPage * itemsPerPage, filteredGuestbookMessages.length)}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGuestbookPage(p => Math.max(1, p - 1))}
                        disabled={guestbookPage === 1}
                      >
                        이전
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGuestbookPage(p => Math.min(guestbookTotalPages, p + 1))}
                        disabled={guestbookPage === guestbookTotalPages}
                      >
                        다음
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center text-gray-400 text-sm">
                {guestbookSearchQuery
                  ? '검색 결과가 없습니다'
                  : '아직 방명록 메시지가 없습니다'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
            <Button variant="destructive" onClick={() => deletingRsvpId && handleDeleteRsvp(deletingRsvpId)}>삭제</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
