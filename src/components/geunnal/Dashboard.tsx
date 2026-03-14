'use client'
import { useState, useEffect } from 'react'
import { Calendar, Image as ImageIcon, MessageSquare, CheckCircle, Clock, FileQuestion } from 'lucide-react'
import { GeunnalEvent, GeunnalSubmission } from '@/types/geunnal'
import GeunnalCard from './Card'
import { BlobAvatarById } from './BlobAvatar'

interface DashboardProps {
  pageId: string
  token: string
}

type DashboardTab = 'events' | 'photos' | 'messages'

export default function Dashboard({ pageId, token }: DashboardProps) {
  const [events, setEvents] = useState<GeunnalEvent[]>([])
  const [submissions, setSubmissions] = useState<GeunnalSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<DashboardTab>('events')

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch events
      const eventsRes = await fetch(`/api/geunnal/events?pageId=${pageId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (eventsRes.ok) {
        const eventsResponse = (await eventsRes.json()) as { events: GeunnalEvent[] }
        const eventsData = eventsResponse.events
        setEvents(eventsData)

        // Fetch submissions for all events
        const allSubmissions: GeunnalSubmission[] = []
        for (const event of eventsData) {
          try {
            const submissionsRes = await fetch(
              `/api/geunnal/submissions?eventId=${event.id}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              }
            )

            if (submissionsRes.ok) {
              const submissionsResponse = (await submissionsRes.json()) as { submissions: GeunnalSubmission[] }
              allSubmissions.push(...submissionsResponse.submissions)
            }
          } catch (error) {
            console.error(`Failed to fetch submissions for event ${event.id}:`, error)
          }
        }

        setSubmissions(allSubmissions)
      }
    } catch (error) {
      console.error('Fetch dashboard data error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [pageId, token])

  // Calculate stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingEvents = events.filter((event) => {
    if (event.date === 'TBD') return false
    const eventDate = new Date(event.date)
    eventDate.setHours(0, 0, 0, 0)
    return eventDate.getTime() >= today.getTime()
  })

  const completedEvents = events.filter((event) => {
    if (event.date === 'TBD') return false
    const eventDate = new Date(event.date)
    eventDate.setHours(0, 0, 0, 0)
    return eventDate.getTime() < today.getTime()
  })

  const tbdEvents = events.filter((event) => event.date === 'TBD')

  const photoSubmissions = submissions.filter((s) => s.photo_url)
  const messageSubmissions = submissions.filter((s) => s.message)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7FD] flex items-center justify-center">
        <div className="text-[#9B8CC4]">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F7FD] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E4F0] px-5 py-4">
        <h1 className="text-xl font-bold text-[#2A2240]">통계 & 추억</h1>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#E8E4F0] px-5">
        <div className="flex gap-4">
          {[
            { value: 'events', label: '이벤트', icon: Calendar },
            { value: 'photos', label: '사진', icon: ImageIcon },
            { value: 'messages', label: '메시지', icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value as DashboardTab)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.value
                    ? 'border-[#8B75D0] text-[#8B75D0]'
                    : 'border-transparent text-[#9B8CC4]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-5 py-5">
        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <GeunnalCard className="text-center">
                <div className="text-3xl font-bold text-[#8B75D0] mb-1">
                  {events.length}
                </div>
                <div className="text-sm text-[#5A5270]">전체 이벤트</div>
              </GeunnalCard>

              <GeunnalCard className="text-center">
                <div className="text-3xl font-bold text-[#D4899A] mb-1">
                  {submissions.length}
                </div>
                <div className="text-sm text-[#5A5270]">받은 응답</div>
              </GeunnalCard>
            </div>

            {/* Event Stats */}
            <GeunnalCard>
              <h3 className="font-semibold text-[#2A2240] mb-4">이벤트 상태</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#F9F7FD] rounded-xl">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-[#8B75D0]" />
                    <span className="text-sm text-[#2A2240]">예정</span>
                  </div>
                  <span className="font-bold text-[#8B75D0]">
                    {upcomingEvents.length}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#F9F7FD] rounded-xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[#9B8CC4]" />
                    <span className="text-sm text-[#2A2240]">완료</span>
                  </div>
                  <span className="font-bold text-[#9B8CC4]">
                    {completedEvents.length}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#F9F7FD] rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileQuestion className="w-5 h-5 text-[#D4899A]" />
                    <span className="text-sm text-[#2A2240]">미정</span>
                  </div>
                  <span className="font-bold text-[#D4899A]">
                    {tbdEvents.length}
                  </span>
                </div>
              </div>
            </GeunnalCard>

            {/* Cost Summary */}
            <GeunnalCard>
              <h3 className="font-semibold text-[#2A2240] mb-4">총 비용</h3>
              <div className="p-4 bg-[#EDE9FA] rounded-xl text-center">
                <div className="text-2xl font-bold text-[#8B75D0] mb-1">
                  {events
                    .reduce((sum, event) => sum + (event.total_cost || 0), 0)
                    .toLocaleString('ko-KR')}원
                </div>
                <div className="text-sm text-[#5A5270]">
                  {events.filter((e) => e.total_cost).length}개 이벤트
                </div>
              </div>
            </GeunnalCard>
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <div className="space-y-4">
            {photoSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="w-12 h-12 text-[#C5BAE8] mx-auto mb-3" />
                <p className="text-[#9B8CC4]">아직 받은 사진이 없습니다</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-[#8B75D0] mb-1">
                    {photoSubmissions.length}
                  </div>
                  <div className="text-sm text-[#5A5270]">받은 사진</div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {photoSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="aspect-square rounded-lg overflow-hidden bg-[#F9F7FD] border border-[#E8E4F0]"
                    >
                      <img
                        src={submission.photo_url!}
                        alt="Submission"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="space-y-4">
            {messageSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-[#C5BAE8] mx-auto mb-3" />
                <p className="text-[#9B8CC4]">아직 받은 메시지가 없습니다</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-[#8B75D0] mb-1">
                    {messageSubmissions.length}
                  </div>
                  <div className="text-sm text-[#5A5270]">받은 메시지</div>
                </div>

                <div className="space-y-3">
                  {messageSubmissions.map((submission) => (
                    <GeunnalCard key={submission.id}>
                      <div className="flex items-start gap-3">
                        <BlobAvatarById
                          id={submission.avatar_id}
                          size={48}
                          showBorder={false}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-[#2A2240] mb-1">
                            {submission.is_anonymous ? '익명' : submission.guest_name}
                          </div>
                          <p className="text-sm text-[#5A5270] leading-relaxed">
                            {submission.message}
                          </p>
                          <div className="text-xs text-[#9B8CC4] mt-2">
                            {new Date(submission.created_at).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                    </GeunnalCard>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
