import { google } from 'googleapis'

// Google Calendar API 설정
const SCOPES = ['https://www.googleapis.com/auth/calendar']

// Google Calendar API 클라이언트 생성
export const createGoogleCalendarClient = (accessToken: string) => {
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: accessToken })
  
  return google.calendar({ version: 'v3', auth: oauth2Client })
}

// 업무일지를 Google Calendar 이벤트로 변환
export const convertDiaryToCalendarEvent = (diaryEntry: any) => {
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
  calendarClient: any,
  calendarId: string,
  event: any
) => {
  try {
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
      error: error.message
    }
  }
}

// Google Calendar에서 이벤트 업데이트
export const updateEventInGoogleCalendar = async (
  calendarClient: any,
  calendarId: string,
  eventId: string,
  event: any
) => {
  try {
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
      error: error.message
    }
  }
}

// Google Calendar에서 이벤트 삭제
export const deleteEventFromGoogleCalendar = async (
  calendarClient: any,
  calendarId: string,
  eventId: string
) => {
  try {
    await calendarClient.events.delete({
      calendarId: calendarId || 'primary',
      eventId: eventId
    })
    
    return { success: true }
  } catch (error) {
    console.error('Google Calendar 이벤트 삭제 실패:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Google Calendar에서 특정 날짜의 이벤트 조회
export const getEventsFromGoogleCalendar = async (
  calendarClient: any,
  calendarId: string,
  date: string
) => {
  try {
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
      error: error.message,
      events: []
    }
  }
} 