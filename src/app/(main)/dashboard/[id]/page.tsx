export const runtime = 'edge'

'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type RSVPData = {
  id: string
  guest_name: string
  guest_phone: string | null
  attendance: 'attending' | 'not_attending' | 'pending'
  guest_count: number
  message: string | null
  created_at: string
}

type Summary = {
  total: number
  attending: number
  notAttending: number
  pending: number
  totalGuests: number
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
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchRSVPData()
  }, [invitationId])

  const fetchRSVPData = async () => {
    try {
      const response = await fetch(`/api/rsvp?invitationId=${invitationId}`)
      const data = await response.json()
      setResponses(data.data || [])
      setSummary(data.summary || {
        total: 0,
        attending: 0,
        notAttending: 0,
        pending: 0,
        totalGuests: 0,
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
      if (searchQuery && !r.guest_name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })

  const totalPages = Math.ceil(filteredResponses.length / itemsPerPage)
  const paginatedResponses = filteredResponses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleExportCSV = () => {
    window.open(`/api/rsvp/export?invitationId=${invitationId}`, '_blank')
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
    </div>
  )
}
