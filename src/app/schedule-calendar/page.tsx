'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, List, Plus } from 'lucide-react'
import CommonHeader from '@/components/CommonHeader'
import FullCalendarComponent from '@/components/FullCalendarComponent'
import type { EventInput } from '@fullcalendar/core'

// 이벤트 타입 정의
interface LocalEvent {
  id: string
  category: string
  subCategory?: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
  }
  end: {
    dateTime?: string
    date?: string
  }
  location?: string
  participant: {
    id: string
    name: string
    level: string | number
  }
  companions?: {
    id: string
    name: string
    level: string | number
  }[]
  createdBy: {
    id: string
    name: string
    level: string | number
  }
  createdAt: string
}

export default function ScheduleCalendarPage() {
  const { user, isAuthenticated, loading } = useUser()
  const router = useRouter()
  const [events, setEvents] = useState<LocalEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar')

  // 이벤트 로드
  useEffect(() => {
    if (isAuthenticated) {
      loadEvents()
    }
  }, [isAuthenticated])

  const loadEvents = async () => {
    try {
      setLoadingEvents(true)
      const response = await fetch('/api/schedule')
      if (!response.ok) {
        throw new Error('일정을 불러오는데 실패했습니다.')
      }
      const data = await response.json()
      setEvents(data.events || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoadingEvents(false)
    }
  }

  // FullCalendar용 이벤트 변환
  const convertToFullCalendarEvents = (events: LocalEvent[]): EventInput[] => {
    return events.map(event => {
      const startDate = event.start.dateTime || event.start.date
      const endDate = event.end.dateTime || event.end.date
      
      if (!startDate) return null
      
      const eventData: EventInput = {
        id: event.id,
        title: event.summary,
        start: startDate,
        backgroundColor: getEventColor(event.category),
        borderColor: getEventColor(event.category),
        extendedProps: {
          category: event.category,
          subCategory: event.subCategory,
          description: event.description,
          location: event.location,
          participant: event.participant,
          companions: event.companions
        }
      }
      
      if (endDate) {
        eventData.end = endDate
      }
      
      return eventData
    }).filter((event): event is NonNullable<typeof event> => event !== null)
  }

  // 이벤트 카테고리별 색상
  const getEventColor = (category: string) => {
    const colors: { [key: string]: string } = {
      '출장/외근': '#3B82F6',
      '반차/연차': '#10B981',
      '회의': '#F59E0B',
      '교육': '#8B5CF6',
      '기타': '#6B7280'
    }
    return colors[category] || '#6B7280'
  }

  // 날짜 선택 핸들러
  const handleDateSelect = (selectInfo: any) => {
    console.log('Selected date:', selectInfo)
    // 여기에 새 이벤트 생성 모달 열기 로직 추가
  }

  // 이벤트 클릭 핸들러
  const handleEventClick = (clickInfo: any) => {
    console.log('Event clicked:', clickInfo)
    // 여기에 이벤트 상세보기/편집 모달 열기 로직 추가
  }

  // 이벤트 드래그 핸들러
  const handleEventDrop = (dropInfo: any) => {
    console.log('Event dropped:', dropInfo)
    // 여기에 이벤트 날짜 변경 로직 추가
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    router.push('/')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CommonHeader currentUser={user} isAdmin={user?.level === 'admin'} />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">일정 관리</h1>
            <p className="text-gray-600">팀 일정을 확인하고 관리하세요</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              onClick={() => setViewMode('calendar')}
              className="flex items-center gap-2"
            >
              <CalendarDays className="w-4 h-4" />
              캘린더
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2"
            >
              <List className="w-4 h-4" />
              목록
            </Button>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              일정 추가
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {viewMode === 'calendar' ? (
          <Card>
            <CardContent className="p-6">
              <FullCalendarComponent
                events={convertToFullCalendarEvents(events)}
                onDateSelect={handleDateSelect}
                onEventClick={handleEventClick}
                onEventDrop={handleEventDrop}
                height="600px"
                initialView="dayGridMonth"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {loadingEvents ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">일정을 불러오는 중...</p>
              </div>
            ) : events.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <CalendarDays className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 일정이 없습니다</h3>
                  <p className="text-gray-600">새로운 일정을 추가해보세요.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {events.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge 
                              style={{ backgroundColor: getEventColor(event.category) }}
                              className="text-white"
                            >
                              {event.category}
                            </Badge>
                            {event.subCategory && (
                              <Badge variant="outline">{event.subCategory}</Badge>
                            )}
                          </div>
                          <h3 className="font-medium text-gray-900 mb-1">{event.summary}</h3>
                          {event.description && (
                            <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>참석자: {event.participant.name}</span>
                            {event.location && <span>장소: {event.location}</span>}
                            <span>
                              {event.start.dateTime 
                                ? new Date(event.start.dateTime).toLocaleString('ko-KR')
                                : event.start.date 
                                  ? new Date(event.start.date).toLocaleDateString('ko-KR')
                                  : '날짜 없음'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
