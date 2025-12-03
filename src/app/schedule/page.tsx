'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Plus, ChevronLeft, ChevronRight, Check, X, Clock, Calendar as CalendarIcon } from 'lucide-react'
import BusinessTripModal from '@/components/BusinessTripModal'
import LeaveRequestModal from '@/components/LeaveRequestModal'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'

// Event Type Definition
interface CalendarEvent {
  id: string
  title: string
  start: string | Date
  end?: string | Date
  backgroundColor?: string
  allDay?: boolean
  extendedProps?: {
    type: string
    description?: string
    location?: string
    participant?: string
    status?: string
    category?: string
    participantId?: string
    leaveType?: string
    totalDays?: number
    tripType?: string
    subType?: string
    startTime?: string
    endTime?: string
    reason?: string
    projectName?: string
    projectId?: string
  }
}

// Todo Type Definition
interface Todo {
  id: string
  title: string
  completed: boolean
  dueDate?: string
  priority?: 'low' | 'medium' | 'high'
  category?: string
}

export default function SchedulePage() {
  const { user, isAuthenticated, loading } = useUser()
  const router = useRouter()
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [monthView, setMonthView] = useState<1 | 2 | 3>(1)
  const [viewType, setViewType] = useState<'month' | 'week' | 'day' | 'list'>('month')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  
  // 카테고리 필터
  const [categoryFilters, setCategoryFilters] = useState({
    project: true,
    business_trip: true,
    leave: true,
    other: true
  })
  const [isBusinessTripModalOpen, setIsBusinessTripModalOpen] = useState(false)
  const [selectedBusinessTrip, setSelectedBusinessTrip] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false)
  const [selectedTodo, setSelectedTodo] = useState<any>(null)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState<any>(null)
  
  // 사이드바 토글 상태
  const [showEventList, setShowEventList] = useState(true)

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/')
    }
  }, [loading, isAuthenticated, router])

  // Fetch events
  const fetchEvents = useCallback(async () => {
    if (!user) return
    
    setIsLoadingEvents(true)
    try {
      const [scheduleRes, businessTripRes, leaveRes, eventsRes, todosRes] = await Promise.all([
        fetch(`/api/schedule?startDate=2024-01-01&endDate=2025-12-31`, { 
          headers: { 'x-user-level': String(user.level || '1') } 
        }),
        fetch('/api/business-trips', {
          headers: { 
            'x-user-level': String(user.level || '1'),
            'x-user-id': user.id
          }
        }),
        fetch('/api/leave-requests', { 
          headers: { 'x-user-level': String(user.level || '1') } 
        }),
        fetch('/api/events', { 
          headers: { 
            'x-user-level': String(user.level || '1'), 
            'x-user-id': user.id 
          } 
        }),
        fetch('/api/todos', {
          headers: { 'x-user-id': user.id }
        }).catch(() => ({ ok: false, json: async () => ({ data: [] }) }))
      ])

      const newEvents: CalendarEvent[] = []

      // 1. 프로젝트 일정 (조완, 공시, 현시)
      if (scheduleRes.ok) {
        const data = await scheduleRes.json()
        if (data.projectEvents) {
          data.projectEvents.forEach((e: any) => {
            const bgColor = e.eventType === '조완' ? '#10B981' : 
                           e.eventType === '공시' ? '#3B82F6' : 
                           e.eventType === '현시' ? '#F59E0B' : '#8B5CF6'
            newEvents.push({
              id: e.id,
              title: `[${e.eventType}] ${e.project?.projectName || ''}`,
              start: e.eventDate,
              allDay: true,
              backgroundColor: bgColor,
              extendedProps: {
                type: 'project',
                description: e.description,
                status: e.eventType
              }
            })
          })
        }
      }

      // 2. 외근/출장
      if (businessTripRes.ok) {
        const trips = await businessTripRes.json()
        if (Array.isArray(trips)) {
          trips.forEach((trip: any) => {
            // 출장 유형 결정
            const tripTypeLabel = trip.trip_type === 'business_trip' ? '출장' : '외근'
            
            // 세부 유형 (AS, SS, 시운전 등)
            const subTypeLabel = trip.sub_type ? ` - ${trip.sub_type}` : ''
            
            // 프로젝트 정보
            const projectInfo = trip.project_name ? ` / ${trip.project_name}` : ''
            
            newEvents.push({
              id: `trip-${trip.id}`,
              title: `[${tripTypeLabel}${subTypeLabel}] ${trip.user_name}${projectInfo}`,
              start: trip.start_date + (trip.start_time ? `T${trip.start_time}` : ''),
              end: trip.end_date + (trip.end_time ? `T${trip.end_time}` : ''),
              backgroundColor: '#8B5CF6', // 보라색 통일
              extendedProps: {
                type: 'business_trip',
                tripType: trip.trip_type,
                category: trip.category,
                subType: trip.sub_type,
                description: trip.purpose,
                location: trip.location,
                participant: trip.user_name,
                projectName: trip.project_name,
                projectId: trip.project_id
              }
            })
          })
        }
      }

      // 3. 연차/반차
      if (leaveRes.ok) {
        const data = await leaveRes.json()
        data.forEach((leave: any) => {
          const leaveTypeLabel = leave.leave_type === 'annual' ? '연차' :
                                 leave.leave_type === 'half_day' ? '반차' :
                                 leave.leave_type === 'sick' ? '병가' :
                                 leave.leave_type === 'personal' ? '개인휴가' : leave.leave_type
          const leaveColor = leave.leave_type === 'annual' ? '#EF4444' :
                            leave.leave_type === 'half_day' ? '#F97316' :
                            leave.leave_type === 'sick' ? '#DC2626' :
                            '#EC4899'
          newEvents.push({
            id: `leave-${leave.id}`,
            title: `[${leaveTypeLabel}] ${leave.user_name}`,
            start: leave.start_date + (leave.start_time ? `T${leave.start_time}` : ''),
            end: leave.end_date + (leave.end_time ? `T${leave.end_time}` : ''),
            backgroundColor: leaveColor,
            extendedProps: {
              type: 'leave',
              leaveType: leave.leave_type,
              startTime: leave.start_time,
              endTime: leave.end_time,
              totalDays: leave.total_days,
              reason: leave.reason,
              description: leave.reason,
              participant: leave.user_name,
              status: leave.status
            }
          })
        })
      }

      // 4. 일반 일정
      if (eventsRes.ok) {
        const data = await eventsRes.json()
        data.forEach((event: any) => {
          newEvents.push({
            id: `event-${event.id}`,
            title: `[${event.category}] ${event.summary}`,
            start: event.start_date + (event.start_time ? `T${event.start_time}` : ''),
            end: event.end_date + (event.end_time ? `T${event.end_time}` : ''),
            backgroundColor: '#6B7280',
            extendedProps: {
              type: 'general',
              category: event.category,
              description: event.description,
              location: event.location,
              participant: event.participant_name,
              participantId: event.participant_id
            }
          })
        })
      }

      console.log('✅ 총 로드된 이벤트:', newEvents.length)
      console.log('📅 이벤트 샘플:', newEvents.slice(0, 3))
      setEvents(newEvents)

      // 5. Todos (에러 무시)
      try {
        if (todosRes.ok) {
          const todosData = await todosRes.json()
          const transformedTodos = todosData.map((todo: any) => ({
            id: todo.id,
            title: todo.title,
            completed: todo.completed,
            dueDate: todo.due_date,
            priority: todo.priority,
            category: todo.category
          }))
          console.log('✅ 총 로드된 할일:', transformedTodos.length)
          setTodos(transformedTodos)
        } else {
          console.log('⚠️  할일 로드 실패 (무시)')
          setTodos([])
        }
      } catch (todoError) {
        console.log('⚠️  할일 테이블 없음 (무시)')
        setTodos([])
      }

    } catch (error) {
      console.error('❌ 이벤트 로드 실패:', error)
    } finally {
      setIsLoadingEvents(false)
    }
  }, [user])

  useEffect(() => {
    if (isAuthenticated) {
      fetchEvents()
    }
  }, [isAuthenticated, fetchEvents])

  const handleAddEvent = () => {
    setSelectedDate(null)
    setSelectedBusinessTrip(null)
    setIsBusinessTripModalOpen(true)
  }

  const handleEventClick = (event: CalendarEvent) => {
    console.log('일정 클릭:', { 
      id: event.id, 
      title: event.title, 
      type: event.extendedProps?.type,
      allProps: event.extendedProps 
    })
    
    // 프로젝트 일정은 읽기 전용
    if (event.extendedProps?.type === 'project') {
      console.log('프로젝트 일정 → 상세 정보만 표시')
      const startDate = typeof event.start === 'string' ? parseISO(event.start) : event.start
      const endDate = event.end ? (typeof event.end === 'string' ? parseISO(event.end) : event.end) : startDate
      
      let details = `📅 ${event.title}\n\n`
      details += `📆 ${format(startDate, 'yyyy년 M월 d일 (EEE)', { locale: ko })}`
      
      if (!isSameDay(startDate, endDate)) {
        details += ` ~ ${format(endDate, 'M월 d일 (EEE)', { locale: ko })}`
      }
      
      if (event.extendedProps?.description) {
        details += `\n\n📝 ${event.extendedProps.description}`
      }
      
      alert(details + '\n\n※ 프로젝트 일정은 설정-프로젝트관리에서 수정할 수 있습니다.')
    }
    // 반차/연차 일정 편집 가능
    else if (event.extendedProps?.type === 'leave') {
      console.log('휴가 일정 → 편집 모달 열기')
      setSelectedLeave(event)
      setIsLeaveModalOpen(true)
    }
    // 출장/외근 일정 및 기타 편집 가능한 일정
    else {
      console.log('편집 가능 일정 → 모달 열기')
      setSelectedBusinessTrip(event)
      setIsBusinessTripModalOpen(true)
    }
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setSelectedBusinessTrip(null)
    setIsBusinessTripModalOpen(true)
  }

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  // 달력 날짜 생성
  const generateMonthDays = (date: Date) => {
    const monthStart = startOfMonth(date)
    const monthEnd = endOfMonth(date)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })

    const days = []
    let currentDay = startDate

    while (currentDay <= endDate) {
      days.push(currentDay)
      currentDay = addDays(currentDay, 1)
    }

    return days
  }

  // 날짜에 해당하는 이벤트 가져오기 (기간 이벤트 포함)
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      // 카테고리 필터 확인
      const eventType = event.extendedProps?.type || 'other'
      if (eventType === 'project' && !categoryFilters.project) return false
      if (eventType === 'business_trip' && !categoryFilters.business_trip) return false
      if (eventType === 'leave' && !categoryFilters.leave) return false
      if ((eventType === 'general' || eventType === 'other') && !categoryFilters.other) return false
      
      const eventStartDate = typeof event.start === 'string' ? parseISO(event.start) : event.start
      const eventEndDate = event.end ? (typeof event.end === 'string' ? parseISO(event.end) : event.end) : eventStartDate
      
      // 날짜를 연/월/일만 비교 (시간 제거)
      const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const startDate = new Date(eventStartDate.getFullYear(), eventStartDate.getMonth(), eventStartDate.getDate())
      const endDate = new Date(eventEndDate.getFullYear(), eventEndDate.getMonth(), eventEndDate.getDate())
      
      // 해당 날짜가 이벤트 시작일과 종료일 사이에 있는지 확인
      return targetDate >= startDate && targetDate <= endDate
    })
  }

  // 월별 달력 렌더링
  const renderMonth = (monthOffset: number = 0) => {
    const targetDate = addMonths(currentDate, monthOffset)
    const days = generateMonthDays(targetDate)
    const weeks: Date[][] = []
    
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }

    return (
      <div key={monthOffset} className={monthView > 1 ? 'flex-1' : ''}>
        {/* 월 헤더 */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {format(targetDate, 'yyyy년 M월', { locale: ko })}
          </h3>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
            <div 
              key={day} 
              className={`text-center text-sm font-semibold py-2 ${
                idx === 0 ? 'text-red-600' : idx === 6 ? 'text-blue-600' : 'text-gray-700'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {weeks.map((week, weekIdx) => (
            <React.Fragment key={weekIdx}>
              {week.map((day, dayIdx) => {
                const dayEvents = getEventsForDate(day)
                const isCurrentMonth = isSameMonth(day, targetDate)
                const isCurrentDay = isToday(day)
                
                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => handleDateClick(day)}
                    className={`
                      min-h-[80px] p-2 border rounded-lg cursor-pointer transition-all
                      ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                      ${isCurrentDay ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'}
                      hover:bg-blue-50 hover:border-blue-300
                    `}
                  >
                    <div className={`
                      text-sm font-medium mb-1
                      ${!isCurrentMonth ? 'text-gray-400' : 
                        dayIdx === 0 ? 'text-red-600' : 
                        dayIdx === 6 ? 'text-blue-600' : 
                        'text-gray-900'}
                      ${isCurrentDay ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}
                    `}>
                      {format(day, 'd')}
                    </div>
                    
                    {/* 이벤트 표시 */}
                    <div className="space-y-1 -mx-1">
                      {dayEvents.slice(0, 3).map((event, idx) => {
                        const eventStartDate = typeof event.start === 'string' ? parseISO(event.start) : event.start
                        const eventEndDate = event.end ? (typeof event.end === 'string' ? parseISO(event.end) : event.end) : eventStartDate
                        const isFirstDay = isSameDay(eventStartDate, day)
                        const isLastDay = isSameDay(eventEndDate, day)
                        const isMultiDay = !isSameDay(eventStartDate, eventEndDate)
                        
                        return (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEventClick(event)
                            }}
                            className={`text-xs px-2 py-1 cursor-pointer hover:opacity-90 transition-opacity ${
                              isMultiDay
                                ? `${isFirstDay ? 'rounded-l-md' : ''} ${isLastDay ? 'rounded-r-md' : ''}`
                                : 'rounded-md'
                            }`}
                            style={{ 
                              backgroundColor: event.backgroundColor || '#6B7280',
                              color: 'white',
                              fontWeight: '500',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {isFirstDay ? event.title : '\u00A0'}
                          </div>
                        )
                      })}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 pl-2 pt-1">
                          +{dayEvents.length - 3}개
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    )
  }

  // 주간 뷰 렌더링
  const renderWeek = () => {
    const startOfWeekDate = startOfWeek(currentDate, { weekStartsOn: 0 })
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeekDate, i))
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-8 border-b border-gray-200">
          <div className="p-2 text-xs font-medium text-gray-500 border-r border-gray-200">시간</div>
          {weekDays.map((day, idx) => (
            <div 
              key={day.toISOString()} 
              className={`p-2 text-center border-r border-gray-200 ${
                isToday(day) ? 'bg-blue-50' : ''
              }`}
            >
              <div className={`text-xs font-medium ${
                idx === 0 ? 'text-red-600' : idx === 6 ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {format(day, 'EEE', { locale: ko })}
              </div>
              <div className={`text-lg font-bold ${
                isToday(day) ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
        
        <div className="overflow-y-auto max-h-[600px]">
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b border-gray-100">
              <div className="p-2 text-xs text-gray-500 border-r border-gray-200 text-center">
                {hour}:00
              </div>
              {weekDays.map(day => {
                const dayEvents = getEventsForDate(day).filter(event => {
                  if (!event.start) return false
                  const eventStart = typeof event.start === 'string' ? parseISO(event.start) : event.start
                  return eventStart.getHours() === hour
                })
                
                return (
                  <div 
                    key={`${day.toISOString()}-${hour}`}
                    className="p-1 border-r border-gray-100 min-h-[60px] hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleDateClick(day)}
                  >
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        className="text-xs px-2 py-1 rounded mb-1 truncate"
                        style={{ backgroundColor: event.backgroundColor || '#6B7280', color: 'white' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEventClick(event)
                        }}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 일간 뷰 렌더링
  const renderDay = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const dayEvents = getEventsForDate(currentDate)

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-xl font-bold text-gray-900">
            {format(currentDate, 'yyyy년 M월 d일 (EEE)', { locale: ko })}
          </h3>
        </div>
        
        <div className="overflow-y-auto max-h-[600px]">
          {hours.map(hour => {
            const hourEvents = dayEvents.filter(event => {
              if (!event.start) return false
              const eventStart = typeof event.start === 'string' ? parseISO(event.start) : event.start
              return eventStart.getHours() === hour
            })
            
            return (
              <div key={hour} className="flex border-b border-gray-100">
                <div className="w-20 p-3 text-sm text-gray-500 border-r border-gray-200 text-center">
                  {hour}:00
                </div>
                <div 
                  className="flex-1 p-2 min-h-[80px] hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleDateClick(currentDate)}
                >
                  {hourEvents.map(event => (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg mb-2 cursor-pointer hover:shadow-md transition-shadow"
                      style={{ backgroundColor: event.backgroundColor || '#6B7280', color: 'white' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEventClick(event)
                      }}
                    >
                      <div className="font-semibold">{event.title}</div>
                      {event.extendedProps?.description && (
                        <div className="text-sm opacity-90 mt-1">{event.extendedProps.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // 일정목록 뷰 렌더링
  const renderList = () => {
    const sortedEvents = [...events].sort((a, b) => {
      const dateA = typeof a.start === 'string' ? parseISO(a.start) : a.start
      const dateB = typeof b.start === 'string' ? parseISO(b.start) : b.start
      return dateA.getTime() - dateB.getTime()
    })

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">전체 일정 목록</h3>
        </div>
        
        <div className="overflow-y-auto max-h-[700px]">
          {sortedEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              등록된 일정이 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sortedEvents.map(event => {
                const eventStart = typeof event.start === 'string' ? parseISO(event.start) : event.start
                const eventEnd = event.end ? (typeof event.end === 'string' ? parseISO(event.end) : event.end) : null
                
                return (
                  <div
                    key={event.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 text-center">
                        <div className="text-sm font-medium text-gray-500">
                          {format(eventStart, 'M월', { locale: ko })}
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {format(eventStart, 'd')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(eventStart, 'EEE', { locale: ko })}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: event.backgroundColor || '#6B7280' }}
                          ></div>
                          <h4 className="font-semibold text-gray-900">{event.title}</h4>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          {format(eventStart, 'HH:mm', { locale: ko })}
                          {eventEnd && ` - ${format(eventEnd, 'HH:mm', { locale: ko })}`}
                        </div>
                        
                        {event.extendedProps?.description && (
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {event.extendedProps.description}
                          </p>
                        )}
                        
                        {event.extendedProps?.location && (
                          <div className="text-xs text-gray-400 mt-1">
                            📍 {event.extendedProps.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Todo 관련 핸들러
  const handleAddTodo = () => {
    setSelectedTodo(null)
    setIsTodoModalOpen(true)
  }

  const handleToggleTodo = async (todoId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({ completed: !completed })
      })

      if (!response.ok) {
        throw new Error('Failed to update todo')
      }

      fetchEvents()
    } catch (error) {
      console.error('Error toggling todo:', error)
      alert('할일 상태 변경 중 오류가 발생했습니다.')
    }
  }

  const handleEditTodo = (todo: Todo) => {
    setSelectedTodo(todo)
    setIsTodoModalOpen(true)
  }

  const handleDeleteTodo = async (todoId: string) => {
    if (!confirm('정말로 이 할일을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || ''
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete todo')
      }

      fetchEvents()
    } catch (error) {
      console.error('Error deleting todo:', error)
      alert('할일 삭제 중 오류가 발생했습니다.')
    }
  }

  // 일정 목록 렌더링 (달력에 표시된 달들의 일정)
  const renderEventList = () => {
    // monthView에 따라 표시할 달의 범위 결정
    const startDate = startOfMonth(currentDate)
    const endDate = endOfMonth(addMonths(currentDate, monthView - 1))
    
    const visibleMonthEvents = events
      .filter(event => {
        const eventDate = typeof event.start === 'string' ? parseISO(event.start) : event.start
        return eventDate >= startDate && eventDate <= endDate
      })
      .sort((a, b) => {
        const dateA = typeof a.start === 'string' ? parseISO(a.start) : a.start
        const dateB = typeof b.start === 'string' ? parseISO(b.start) : b.start
        return dateA.getTime() - dateB.getTime()
      })

    // 제목 생성 (1달, 2달, 3달에 따라)
    let title = ''
    if (monthView === 1) {
      title = `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 일정`
    } else {
      const startMonth = currentDate.getMonth() + 1
      const endMonth = addMonths(currentDate, monthView - 1).getMonth() + 1
      const startYear = currentDate.getFullYear()
      const endYear = addMonths(currentDate, monthView - 1).getFullYear()
      
      if (startYear === endYear) {
        title = `${startYear}년 ${startMonth}월 ~ ${endMonth}월 일정`
      } else {
        title = `${startYear}년 ${startMonth}월 ~ ${endYear}년 ${endMonth}월 일정`
      }
    }
    
    return (
      <Card className="border-none shadow-sm bg-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
            <Button size="sm" variant="outline" onClick={handleAddEvent}>
              <Plus className="h-4 w-4 mr-1" />
              일정 추가
            </Button>
          </div>
          
          <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
            {visibleMonthEvents.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                일정이 없습니다.
              </div>
            )}
            {visibleMonthEvents.map(event => {
              const eventStartDate = typeof event.start === 'string' ? parseISO(event.start) : event.start
              const eventEndDate = event.end ? (typeof event.end === 'string' ? parseISO(event.end) : event.end) : null
              
              // 날짜 표시 형식 결정 (같은 날이면 단일, 다른 날이면 기간)
              let dateDisplay = ''
              if (eventEndDate && !isSameDay(eventStartDate, eventEndDate)) {
                // 기간 표시
                const startYear = eventStartDate.getFullYear()
                const endYear = eventEndDate.getFullYear()
                
                if (startYear === endYear) {
                  // 같은 해
                  if (eventStartDate.getMonth() === eventEndDate.getMonth()) {
                    // 같은 월
                    dateDisplay = `${format(eventStartDate, 'M월 d일', { locale: ko })} ~ ${format(eventEndDate, 'd일 (EEE)', { locale: ko })}`
                  } else {
                    // 다른 월
                    dateDisplay = `${format(eventStartDate, 'M월 d일', { locale: ko })} ~ ${format(eventEndDate, 'M월 d일 (EEE)', { locale: ko })}`
                  }
                } else {
                  // 다른 해
                  dateDisplay = `${format(eventStartDate, 'yyyy년 M월 d일', { locale: ko })} ~ ${format(eventEndDate, 'yyyy년 M월 d일 (EEE)', { locale: ko })}`
                }
              } else {
                // 단일 날짜
                dateDisplay = format(eventStartDate, 'M월 d일 (EEE)', { locale: ko })
                if (!event.allDay) {
                  dateDisplay += ` ${format(eventStartDate, 'HH:mm')}`
                  if (eventEndDate) {
                    dateDisplay += ` ~ ${format(eventEndDate, 'HH:mm')}`
                  }
                }
              }
              
              return (
                <div
                  key={event.id}
                  className="group p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleEventClick(event)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-1 h-full rounded-full mt-1"
                      style={{ backgroundColor: event.backgroundColor || '#6B7280', minHeight: '40px' }}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {event.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {dateDisplay}
                      </p>
                      {event.extendedProps?.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {event.extendedProps.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Todo 렌더링
  const renderTodos = () => {
    return (
      <Card className="border-none shadow-sm bg-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">할 일 목록</h3>
            <Button size="sm" variant="outline" onClick={handleAddTodo}>
              <Plus className="h-4 w-4 mr-1" />
              할일 추가
            </Button>
          </div>
          
          <div className="space-y-2">
            {todos.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                등록된 할일이 없습니다.
              </div>
            )}
            {todos.map(todo => (
              <div
                key={todo.id}
                className="group flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <button 
                  onClick={() => handleToggleTodo(todo.id, todo.completed)}
                  className={`
                    flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                    ${todo.completed ? 'bg-blue-600 border-blue-600' : 'border-gray-300 hover:border-blue-400'}
                  `}
                >
                  {todo.completed && <Check className="h-3 w-3 text-white" />}
                </button>
                <div className="flex-1 cursor-pointer" onClick={() => handleEditTodo(todo)}>
                  <p className={`text-sm ${todo.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {todo.title}
                  </p>
                  {todo.dueDate && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {format(parseISO(todo.dueDate), 'M월 d일', { locale: ko })}
                    </p>
                  )}
                </div>
                {todo.priority && (
                  <span className={`
                    text-xs px-2 py-0.5 rounded
                    ${todo.priority === 'high' ? 'bg-red-100 text-red-700' :
                      todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'}
                  `}>
                    {todo.priority === 'high' ? '긴급' : todo.priority === 'medium' ? '보통' : '낮음'}
                  </span>
                )}
                <button
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <AuthGuard requiredLevel={1}>
      <div className="min-h-screen bg-gray-50/50 p-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">일정 관리</h1>
              <p className="text-sm text-gray-500 mt-1">
                프로젝트 일정 및 개인 업무 일정을 관리합니다.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => fetchEvents()} variant="outline" size="sm" disabled={isLoadingEvents}>
                {isLoadingEvents ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                새로고침
              </Button>
              <Button 
                onClick={() => setIsLeaveModalOpen(true)} 
                size="sm" 
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                연차/반차 신청
              </Button>
              <Button onClick={handleAddEvent} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                + 일정 등록
              </Button>
            </div>
          </div>

          {/* 카테고리 필터 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm font-semibold text-gray-700">일정 필터:</span>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={categoryFilters.project}
                  onChange={(e) => setCategoryFilters(prev => ({ ...prev, project: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-sm font-medium text-gray-700">프로젝트</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={categoryFilters.business_trip}
                  onChange={(e) => setCategoryFilters(prev => ({ ...prev, business_trip: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-2 focus:ring-purple-500"
                />
                <span className="w-3 h-3 rounded-full bg-purple-600"></span>
                <span className="text-sm font-medium text-gray-700">AS/SS</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={categoryFilters.leave}
                  onChange={(e) => setCategoryFilters(prev => ({ ...prev, leave: e.target.checked }))}
                  className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-2 focus:ring-orange-500"
                />
                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                <span className="text-sm font-medium text-gray-700">연차/반차</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={categoryFilters.other}
                  onChange={(e) => setCategoryFilters(prev => ({ ...prev, other: e.target.checked }))}
                  className="w-4 h-4 text-gray-600 rounded border-gray-300 focus:ring-2 focus:ring-gray-500"
                />
                <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                <span className="text-sm font-medium text-gray-700">기타</span>
              </label>
            </div>
          </div>

          {/* 달력 컨트롤 */}
          <div className="bg-white rounded-lg border border-gray-200 mb-6">
            {/* 상단 네비게이션 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={prevMonth}
                  className="h-9 w-9 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={nextMonth}
                  className="h-9 w-9 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={goToToday}
                  className="h-9 px-4 ml-2"
                >
                  오늘
                </Button>
              </div>
              
              <h2 className="text-xl font-bold text-gray-900">
                {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
              </h2>

              {/* 뷰 탭 (2달, 3달, 월, 주, 일, 일정목록, 할일) */}
              <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-200">
                <button
                  onClick={() => { setMonthView(2); setViewType('month'); }}
                  className={`px-4 py-1.5 text-sm font-medium rounded transition-all ${
                    monthView === 2 && viewType === 'month'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  2달
                </button>
                <button
                  onClick={() => { setMonthView(3); setViewType('month'); }}
                  className={`px-4 py-1.5 text-sm font-medium rounded transition-all ${
                    monthView === 3 && viewType === 'month'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  3달
                </button>
                <button
                  onClick={() => { setMonthView(1); setViewType('month'); }}
                  className={`px-4 py-1.5 text-sm font-medium rounded transition-all ${
                    monthView === 1 && viewType === 'month'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  월
                </button>
                <button
                  onClick={() => setViewType('week')}
                  className={`px-4 py-1.5 text-sm font-medium rounded transition-all ${
                    viewType === 'week'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  주
                </button>
                <button
                  onClick={() => setViewType('day')}
                  className={`px-4 py-1.5 text-sm font-medium rounded transition-all ${
                    viewType === 'day'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  일
                </button>
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <button
                  onClick={() => setShowEventList(!showEventList)}
                  className={`px-4 py-1.5 text-sm font-medium rounded transition-all ${
                    showEventList
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-500 border border-gray-200'
                  }`}
                >
                  일정목록 {showEventList ? '✓' : ''}
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className={`grid grid-cols-1 gap-6 ${
            showEventList ? 'lg:grid-cols-3' : 'lg:grid-cols-1'
          }`}>
            {/* Calendar */}
            <div className={`${
              showEventList ? 'lg:col-span-2' : 'lg:col-span-1'
            }`}>
              {viewType === 'month' && (
                <Card className="border-none shadow-sm bg-white">
                  <CardContent className="p-6">
                    <div className={`grid gap-6 ${
                      monthView === 1 ? 'grid-cols-1' : 
                      monthView === 2 ? 'grid-cols-2' : 
                      'grid-cols-3'
                    }`}>
                      {Array.from({ length: monthView }).map((_, idx) => renderMonth(idx))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {viewType === 'week' && (
                <Card className="border-none shadow-sm bg-white">
                  <CardContent className="p-6">
                    {renderWeek()}
                  </CardContent>
                </Card>
              )}
              
              {viewType === 'day' && (
                <Card className="border-none shadow-sm bg-white">
                  <CardContent className="p-6">
                    {renderDay()}
                  </CardContent>
                </Card>
              )}
              
              {viewType === 'list' && (
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6">
                    {renderList()}
            </CardContent>
          </Card>
              )}
            </div>

            {/* Sidebar: Event List */}
            {showEventList && (
              <div className="lg:col-span-1">
                {renderEventList()}
              </div>
            )}
          </div>
        </div>
      </div>

      <BusinessTripModal
        isOpen={isBusinessTripModalOpen}
        onClose={() => {
          setIsBusinessTripModalOpen(false)
          setSelectedBusinessTrip(null)
        }}
        onSave={fetchEvents}
        selectedDate={selectedDate}
        event={selectedBusinessTrip}
      />

      <LeaveRequestModal
        isOpen={isLeaveModalOpen}
        onClose={() => {
          setIsLeaveModalOpen(false)
          setSelectedLeave(null)
        }}
        onSave={fetchEvents}
        selectedDate={selectedDate}
        event={selectedLeave}
      />
    </AuthGuard>
  )
}
