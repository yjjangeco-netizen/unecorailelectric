import { google } from 'googleapis'

// 업무일지 항목을 구글 캘린더 이벤트 형식으로 변환
export function transformWorkDiaryEntry(entry: {
  id: string
  date: string
  content: string
  user_id: string
  created_at: string
}) {
  // 날짜 유효성 검증
  const dateObj = new Date(entry.date)
  if (isNaN(dateObj.getTime())) {
    throw new Error(`Invalid date: ${entry.date}`)
  }

  // 제목 생성 (길이 제한)
  const maxTitleLength = 100
  const contentPreview = entry.content || '(내용 없음)'
  const title = `업무일지: ${contentPreview}`.slice(0, maxTitleLength)

  return {
    summary: title,
    description: entry.content,
    start: {
      date: entry.date
    },
    end: {
      date: entry.date
    }
  }
}

// Google Calendar API 설정
// const SCOPES = ['https://www.googleapis.com/auth/calendar']

// Google Calendar API 클라이언트 생성
export const createGoogleCalendarClient = (accessToken: string) => {
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: accessToken })
  
  return google.calendar({ version: 'v3', auth: oauth2Client })
}

// 업무일지를 Google Calendar 이벤트로 변환
import type { WorkDiaryEntry } from '@/lib/supabase'

interface CalendarEvent {
  summary: string
  description: string
  start: {
    date: string
    timeZone: string
  }
  end: {
    date: string
    timeZone: string
  }
  colorId: string
  reminders: {
    useDefault: boolean
    overrides: Array<{
      method: string
      minutes: number
    }>
  }
}

// Google Calendar API 클라이언트 타입 가드
interface GoogleCalendarClient {
  events: {
    insert: (params: { calendarId?: string; resource: CalendarEvent }) => Promise<{ data: { id: string; htmlLink: string } }>
    update: (params: { calendarId?: string; eventId: string; resource: CalendarEvent }) => Promise<{ data: { id: string; htmlLink: string } }>
    delete: (params: { calendarId?: string; eventId: string }) => Promise<{ data: { id: string; htmlLink: string } }>
    list: (params: { 
      calendarId?: string; 
      timeMin?: string; 
      timeMax?: string; 
      singleEvents?: boolean;
      orderBy?: string;
    }) => Promise<{ data: { items: CalendarEvent[] } }>
  }
}

function isGoogleCalendarClient(client: unknown): client is GoogleCalendarClient {
  return client !== null && 
         typeof client === 'object' && 
         'events' in client &&
         typeof (client as Record<string, unknown>)['events'] === 'object'
}

export const convertDiaryToCalendarEvent = (diaryEntry: WorkDiaryEntry): CalendarEvent => {
  return {
    summary: `업무일지: ${diaryEntry.userName}`,
    description: diaryEntry.content,
    start: {
      date: diaryEntry.date,
      timeZone: 'Asia/Seoul'
    },
    end: {
      date: diaryEntry.date,
      timeZone: 'Asia/Seoul'
    },
    colorId: '1', // 파란색
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 하루 전 이메일
        { method: 'popup', minutes: 30 } // 30분 전 팝업
      ]
    }
  }
}

// Google Calendar에 이벤트 추가
export const addEventToGoogleCalendar = async (
  calendarClient: unknown, // Google Calendar API 클라이언트
  calendarId: string,
  event: CalendarEvent
) => {
  try {
    if (!isGoogleCalendarClient(calendarClient)) {
      throw new Error('Invalid Google Calendar client')
    }
    
    const response = await calendarClient.events.insert({
      calendarId: calendarId || 'primary',
      resource: event
    })
    
    return {
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink
    }
  } catch (error) {
    console.error('Google Calendar 이벤트 추가 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Google Calendar에서 이벤트 업데이트
export const updateEventInGoogleCalendar = async (
  calendarClient: unknown, // Google Calendar API 클라이언트
  calendarId: string,
  eventId: string,
  event: CalendarEvent
) => {
  try {
    if (!isGoogleCalendarClient(calendarClient)) {
      throw new Error('Invalid Google Calendar client')
    }
    
    const response = await calendarClient.events.update({
      calendarId: calendarId || 'primary',
      eventId: eventId,
      resource: event
    })
    
    return {
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink
    }
  } catch (error) {
    console.error('Google Calendar 이벤트 업데이트 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Google Calendar에서 이벤트 삭제
export const deleteEventFromGoogleCalendar = async (
  calendarClient: unknown, // Google Calendar API 클라이언트
  calendarId: string,
  eventId: string
) => {
  try {
    if (!isGoogleCalendarClient(calendarClient)) {
      throw new Error('Invalid Google Calendar client')
    }
    
    await calendarClient.events.delete({
      calendarId: calendarId || 'primary',
      eventId: eventId
    })
    
    return { success: true }
  } catch (error) {
    console.error('Google Calendar 이벤트 삭제 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Google Calendar에서 특정 날짜의 이벤트 조회
export const getEventsFromGoogleCalendar = async (
  calendarClient: unknown, // Google Calendar API 클라이언트
  calendarId: string,
  date: string
) => {
  try {
    if (!isGoogleCalendarClient(calendarClient)) {
      throw new Error('Invalid Google Calendar client')
    }
    
    const response = await calendarClient.events.list({
      calendarId: calendarId || 'primary',
      timeMin: new Date(date).toISOString(),
      timeMax: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    })
    
    return {
      success: true,
      events: response.data.items || []
    }
  } catch (error) {
    console.error('Google Calendar 이벤트 조회 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      events: []
    }
  }
} 