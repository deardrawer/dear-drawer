'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'qrcode'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import SlugSettings from '@/components/dashboard/SlugSettings'

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
}

type GuestbookMessage = {
  id: string
  guest_name: string
  message: string
  question: string | null
  created_at: string
}

type InvitationInfo = {
  groom_name: string
  bride_name: string
  wedding_date: string
  wedding_time: string
  venue_name: string
  venue_address: string
  slug: string | null
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
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSide, setFilterSide] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // 방명록 상태
  const [guestbookMessages, setGuestbookMessages] = useState<GuestbookMessage[]>([])
  const [guestbookSearchQuery, setGuestbookSearchQuery] = useState('')
  const [guestbookPage, setGuestbookPage] = useState(1)
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null)

  // 공유 상태
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null)
  const [copied, setCopied] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  // 공유 URL
  const baseUrl = 'https://invite.deardrawer.com'
  const invitationUrl = invitationInfo?.slug
    ? `${baseUrl}/i/${invitationInfo.slug}`
    : `${baseUrl}/i/${invitationId}`

  useEffect(() => {
    fetchRSVPData()
    fetchGuestbookData()
    fetchInvitationInfo()
  }, [invitationId])

  // QR 코드 생성
  useEffect(() => {
    if (invitationUrl && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, invitationUrl, {
        width: 150,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })

      QRCode.toDataURL(invitationUrl, {
        width: 1024,
        margin: 2,
      }).then(setQrCodeUrl)
    }
  }, [invitationUrl])

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

  const filteredResponses = responses
    .filter((r) => {
      if (filterStatus !== 'all' && r.attendance !== filterStatus) return false
      if (filterSide !== 'all') {
        if (filterSide === 'none' && r.side !== null) return false
        if (filterSide !== 'none' && r.side !== filterSide) return false
      }
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

  const fetchInvitationInfo = async () => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}`)
      const data: {
        groom_name?: string
        bride_name?: string
        wedding_date?: string
        wedding_time?: string
        venue_name?: string
        venue_address?: string
        slug?: string | null
      } = await response.json()
      if (data) {
        setInvitationInfo({
          groom_name: data.groom_name || '',
          bride_name: data.bride_name || '',
          wedding_date: data.wedding_date || '',
          wedding_time: data.wedding_time || '',
          venue_name: data.venue_name || '',
          venue_address: data.venue_address || '',
          slug: data.slug || null,
        })
      }
    } catch (error) {
      console.error('Failed to fetch invitation info:', error)
    }
  }

  const handleExportCSV = () => {
    window.open(`/api/rsvp/export?invitationId=${invitationId}`, '_blank')
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(invitationUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadQR = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a')
      link.download = `qrcode-${invitationInfo?.slug || invitationId}.png`
      link.href = qrCodeUrl
      link.click()
    }
  }

  const handleKakaoShare = () => {
    const kakaoWindow = window as typeof window & {
      Kakao?: {
        isInitialized?: () => boolean
        Share?: { sendDefault: (config: object) => void }
      }
    }

    if (typeof window !== 'undefined' && kakaoWindow.Kakao?.Share && kakaoWindow.Kakao.isInitialized?.()) {
      const formattedDate = invitationInfo?.wedding_date
        ? new Date(invitationInfo.wedding_date).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })
        : '날짜 미정'

      kakaoWindow.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: `${invitationInfo?.groom_name || '신랑'} ❤️ ${invitationInfo?.bride_name || '신부'}의 결혼식`,
          description: `${formattedDate}\n${invitationInfo?.venue_name || ''}`,
          imageUrl: 'https://invite.deardrawer.com/og-image.png',
          link: {
            mobileWebUrl: invitationUrl,
            webUrl: invitationUrl,
          },
        },
        buttons: [
          {
            title: '모바일 청첩장 보기',
            link: {
              mobileWebUrl: invitationUrl,
              webUrl: invitationUrl,
            },
          },
        ],
      })
    } else {
      navigator.clipboard.writeText(invitationUrl)
      alert('카카오톡 공유를 사용할 수 없어 링크가 복사되었습니다.')
    }
  }

  const handleSMSShare = () => {
    const formattedDate = invitationInfo?.wedding_date
      ? new Date(invitationInfo.wedding_date).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        })
      : ''

    const details = [formattedDate, invitationInfo?.wedding_time, invitationInfo?.venue_name].filter(Boolean).join(' / ')
    const message = `${invitationInfo?.groom_name || '신랑'} ♥ ${invitationInfo?.bride_name || '신부'} 결혼합니다\n\n${details || '저희 결혼식에 초대합니다.'}\n\n청첩장 보기: ${invitationUrl}`
    window.open(`sms:?body=${encodeURIComponent(message)}`)
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

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-gray-900">RSVP 대시보드</h1>
          <p className="text-gray-500 mt-1">참석 응답을 확인하고 관리하세요</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/editor?id=${invitationId}`}>
            <Button variant="outline">에디터로 돌아가기</Button>
          </Link>
          <Button onClick={handleExportCSV}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CSV 내보내기
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">총 응답</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">참석</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{summary.attending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">불참</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{summary.notAttending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">예상 참석 인원</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-600">{summary.totalGuests}명</div>
          </CardContent>
        </Card>
      </div>

      {/* Side Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">신랑측 참석 인원</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{summary.groomSideGuests}<span className="text-lg font-normal text-gray-400 ml-1">명</span></div>
            <p className="text-xs text-gray-400 mt-1">응답 {summary.groomSide}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-pink-600">신부측 참석 인원</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-600">{summary.brideSideGuests}<span className="text-lg font-normal text-gray-400 ml-1">명</span></div>
            <p className="text-xs text-gray-400 mt-1">응답 {summary.brideSide}건</p>
          </CardContent>
        </Card>
      </div>

      {/* Slug Settings */}
      <div className="mb-8">
        <SlugSettings invitationId={invitationId} />
      </div>

      {/* Share Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>청첩장 공유</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 링크 공유 */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">청첩장 링크</p>
                <div className="flex gap-2">
                  <Input value={invitationUrl} readOnly className="flex-1 text-sm" />
                  <Button onClick={handleCopyLink} variant="outline">
                    {copied ? '복사됨!' : '복사'}
                  </Button>
                </div>
              </div>

              {/* 공유 버튼들 */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">공유하기</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleKakaoShare}
                    className="flex-1 h-12"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="#3C1E1E">
                      <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.643 1.765 4.966 4.412 6.286l-.893 3.27a.3.3 0 00.455.334l3.862-2.552c.67.097 1.357.148 2.055.148 5.523 0 10-3.463 10-7.777C22 6.463 17.523 3 12 3z" />
                    </svg>
                    카카오톡
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSMSShare}
                    className="flex-1 h-12"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    문자
                  </Button>
                </div>
              </div>
            </div>

            {/* QR 코드 */}
            <div className="flex flex-col items-center">
              <p className="text-sm font-medium text-gray-700 mb-2">QR 코드</p>
              <canvas ref={qrCanvasRef} className="rounded-lg border" />
              <Button
                variant="outline"
                onClick={handleDownloadQR}
                className="mt-3"
                size="sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                QR 다운로드
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart and Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pie Chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>참석 현황</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
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
              <div className="h-[250px] flex items-center justify-center text-gray-400">
                아직 응답이 없습니다
              </div>
            )}
          </CardContent>
        </Card>

        {/* Response Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>응답 목록</CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="이름 검색..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-40"
                />
                <select
                  value={filterSide}
                  onChange={(e) => {
                    setFilterSide(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">전체 소속</option>
                  <option value="groom">신랑측</option>
                  <option value="bride">신부측</option>
                  <option value="none">미지정</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">전체</option>
                  <option value="attending">참석</option>
                  <option value="not_attending">불참</option>
                  <option value="pending">미정</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {paginatedResponses.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium">이름</th>
                        <th className="text-left py-3 px-2 font-medium">연락처</th>
                        <th className="text-left py-3 px-2 font-medium">소속</th>
                        <th className="text-left py-3 px-2 font-medium">참석</th>
                        <th className="text-left py-3 px-2 font-medium">인원</th>
                        <th className="text-left py-3 px-2 font-medium">메시지</th>
                        <th className="text-left py-3 px-2 font-medium">응답일</th>
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
                          <td className="py-3 px-2">{r.attendance === 'attending' ? r.guest_count : '-'}</td>
                          <td className="py-3 px-2 text-gray-500 max-w-[200px] truncate">
                            {r.message || '-'}
                          </td>
                          <td className="py-3 px-2 text-gray-500">
                            {new Date(r.created_at).toLocaleDateString('ko-KR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-500">
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
              <div className="py-12 text-center text-gray-400">
                {searchQuery || filterStatus !== 'all'
                  ? '검색 결과가 없습니다'
                  : '아직 응답이 없습니다'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Guestbook Section */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>방명록 관리</CardTitle>
                <p className="text-sm text-gray-500 mt-1">총 {guestbookMessages.length}개의 메시지</p>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="이름 검색..."
                  value={guestbookSearchQuery}
                  onChange={(e) => {
                    setGuestbookSearchQuery(e.target.value)
                    setGuestbookPage(1)
                  }}
                  className="w-40"
                />
                <Button onClick={handleExportGuestbookCSV} variant="outline">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV 내보내기
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {paginatedGuestbookMessages.length > 0 ? (
              <>
                <div className="overflow-x-auto">
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
                    <p className="text-sm text-gray-500">
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
              <div className="py-12 text-center text-gray-400">
                {guestbookSearchQuery
                  ? '검색 결과가 없습니다'
                  : '아직 방명록 메시지가 없습니다'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
