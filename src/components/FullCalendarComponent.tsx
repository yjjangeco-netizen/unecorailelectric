'use client'

import { useRef, useEffect } from 'react'
import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventInput } from '@fullcalendar/core'
import '@fullcalendar/core/main.css'
import '@fullcalendar/daygrid/main.css'
import '@fullcalendar/timegrid/main.css'

interface FullCalendarComponentProps {
  events?: EventInput[]
  onDateSelect?: (selectInfo: any) => void
  onEventClick?: (clickInfo: any) => void
  onEventDrop?: (dropInfo: any) => void
  height?: string | number
  initialView?: string
}

export default function FullCalendarComponent({
  events = [],
  onDateSelect,
  onEventClick,
  onEventDrop,
  height = 'auto',
  initialView = 'dayGridMonth'
}: FullCalendarComponentProps) {
  const calendarRef = useRef<HTMLDivElement>(null)
  const calendarInstance = useRef<Calendar | null>(null)

  useEffect(() => {
    if (calendarRef.current && !calendarInstance.current) {
      calendarInstance.current = new Calendar(calendarRef.current, {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView: initialView,
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        height: height,
        events: events,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
        weekends: true,
        ...(onDateSelect && { select: onDateSelect }),
        ...(onEventClick && { eventClick: onEventClick }),
        ...(onEventDrop && { eventDrop: onEventDrop }),
        eventResize: (resizeInfo) => {
          console.log('Event resized:', resizeInfo)
        },
        locale: 'ko',
        buttonText: {
          today: '오늘',
          month: '월',
          week: '주',
          day: '일'
        }
      })

      calendarInstance.current.render()
    }

    return () => {
      if (calendarInstance.current) {
        calendarInstance.current.destroy()
        calendarInstance.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (calendarInstance.current) {
      calendarInstance.current.removeAllEvents()
      calendarInstance.current.addEventSource(events)
    }
  }, [events])

  return (
    <div className="w-full">
      <div ref={calendarRef} className="w-full" />
    </div>
  )
}
