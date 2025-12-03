'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus } from 'lucide-react'

// FullCalendar Imports
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import koLocale from '@fullcalendar/core/locales/ko'

// Event Type Definition
interface CalendarEvent {
  id: string
  title: string
  start: string | Date
  end?: string | Date
  backgroundColor?: string
  borderColor?: string
  textColor?: string
  allDay?: boolean
  extendedProps?: {
    type: string
    description?: string
    location?: string
    participant?: string
    status?: string
    category?: string
    participantId?: string
  }
}

import EventModal from '@/components/EventModal'

export default function SchedulePage() {
  const { user, isAuthenticated, loading } = useUser()
  const router = useRouter()
  const calendarRef = useRef<FullCalendar>(null)
  
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/')
    }
  }, [loading, isAuthenticated, router])

  // Fetch events
  const fetchEvents = async () => {
    if (!user) return
    
    setIsLoadingEvents(true)
    try {
      const [scheduleRes, businessTripRes, leaveRes, eventsRes] = await Promise.all([
        fetch(`/api/schedule?startDate=2024-01-01&endDate=2025-12-31`, { headers: { 'x-user-level': String(user.level || '1') } }),
        fetch('/api/business-trips'),
        fetch('/api/leave-requests', { headers: { 'x-user-level': String(user.level || '1') } }),
        fetch('/api/events', { headers: { 'x-user-level': String(user.level || '1'), 'x-user-id': user.id } })
      ])

      const newEvents: CalendarEvent[] = []

      // 1. Project Schedule Events
      if (scheduleRes.ok) {
        const data = await scheduleRes.json()
        if (data.projectEvents) {
          data.projectEvents.forEach((e: any) => {
            newEvents.push({
              id: e.id,
              title: `[${e.eventType}] ${e.project?.projectName || ''}`,
              start: e.eventDate,
              allDay: true,
              backgroundColor: e.eventType === '조완' ? '#10B981' : e.eventType === '공시' ? '#3B82F6' : '#F59E0B',
              borderColor: 'transparent',
              extendedProps: {
                type: 'project',
                description: e.description,
                status: e.eventType
              }
            })
          })
        }
      }

      // 2. Business Trips
      if (businessTripRes.ok) {
        const data = await businessTripRes.json()
        if (data.trips) {
          data.trips.forEach((trip: any) => {
            newEvents.push({
              id: `trip-${trip.id}`,
              title: `[${trip.trip_type === 'business_trip' ? '출장' : '외근'}] ${trip.user_name} - ${trip.title}`,
              start: trip.start_date + (trip.start_time ? `T${trip.start_time}` : ''),
              end: trip.end_date + (trip.end_time ? `T${trip.end_time}` : ''),
              backgroundColor: '#8B5CF6',
              borderColor: 'transparent',
              extendedProps: {
                type: 'business_trip',
                description: trip.purpose,
                location: trip.location,
                participant: trip.user_name
              }
            })
          })
        }
      }

      // 3. Leave Requests
      if (leaveRes.ok) {
        const data = await leaveRes.json()
        data.forEach((leave: any) => {
          newEvents.push({
            id: `leave-${leave.id}`,
            title: `[${leave.leave_type === 'annual' ? '연차' : '반차'}] ${leave.user_name}`,
            start: leave.start_date + (leave.start_time ? `T${leave.start_time}` : ''),
            end: leave.end_date + (leave.end_time ? `T${leave.end_time}` : ''),
            backgroundColor: '#EF4444',
            borderColor: 'transparent',
            extendedProps: {
              type: 'leave',
              description: leave.reason,
              participant: leave.user_name
            }
          })
        })
      }

      // 4. General Events
      if (eventsRes.ok) {
        const data = await eventsRes.json()
        data.forEach((event: any) => {
          newEvents.push({
            id: `event-${event.id}`,
            title: `[${event.category}] ${event.summary}`,
            start: event.start_date + (event.start_time ? `T${event.start_time}` : ''),
            end: event.end_date + (event.end_time ? `T${event.end_time}` : ''),
            backgroundColor: '#6B7280',
            borderColor: 'transparent',
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

      setEvents(newEvents)

    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setIsLoadingEvents(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchEvents()
    }
  }, [isAuthenticated])

  const handleAddEvent = () => {
    setSelectedEvent(null)
    setIsEventModalOpen(true)
  }

  const handleEventClick = (info: any) => {
    const type = info.event.extendedProps.type
    if (type === 'general') {
      // Only allow editing if it's a general event
      // Check permission: only creator or admin can edit (handled in backend, but UI feedback is good)
      // For now, open modal for all general events, let backend reject if unauthorized
      setSelectedEvent(info.event)
      setIsEventModalOpen(true)
    } else {
      // Show simple alert for other types
      alert(`[${info.event.title}]\n${info.event.extendedProps.description || ''}`)
    }
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
              <Button onClick={handleAddEvent} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                일정 등록
              </Button>
            </div>
          </div>

          {/* Calendar Card */}
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <style jsx global>{`
                .fc {
                  --fc-border-color: #e5e7eb;
                  --fc-button-text-color: #374151;
                  --fc-button-bg-color: #ffffff;
                  --fc-button-border-color: #d1d5db;
                  --fc-button-hover-bg-color: #f3f4f6;
                  --fc-button-hover-border-color: #d1d5db;
                  --fc-button-active-bg-color: #e5e7eb;
                  --fc-button-active-border-color: #d1d5db;
                  --fc-event-bg-color: #3b82f6;
                  --fc-event-border-color: #3b82f6;
                  --fc-today-bg-color: #f9fafb;
                  --fc-now-indicator-color: #ef4444;
                }
                .fc .fc-toolbar-title {
                  font-size: 1.25rem;
                  font-weight: 600;
                  color: #111827;
                }
                .fc .fc-button {
                  font-weight: 500;
                  padding: 0.5rem 1rem;
                  text-transform: capitalize;
                  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                }
                .fc .fc-button-primary:not(:disabled).fc-button-active,
                .fc .fc-button-primary:not(:disabled):active {
                  background-color: #f3f4f6;
                  border-color: #d1d5db;
                  color: #111827;
                }
                .fc-event {
                  cursor: pointer;
                  padding: 2px 4px;
                  border-radius: 4px;
                  font-size: 0.85rem;
                  font-weight: 500;
                  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                }
                .fc-daygrid-day-number {
                  font-size: 0.9rem;
                  font-weight: 500;
                  color: #374151;
                  padding: 8px;
                }
                .fc-col-header-cell-cushion {
                  padding: 12px;
                  font-weight: 600;
                  color: #4b5563;
                }
                .fc-theme-standard td, .fc-theme-standard th {
                  border-color: #f3f4f6;
                }
              `}</style>
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
                }}
                locale={koLocale}
                events={events}
                editable={false}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                height="auto"
                contentHeight="auto"
                aspectRatio={1.8}
                eventClick={handleEventClick}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <EventModal 
        isOpen={isEventModalOpen} 
        onClose={() => setIsEventModalOpen(false)} 
        onSave={fetchEvents}
        event={selectedEvent}
      />
    </AuthGuard>
  )
}
