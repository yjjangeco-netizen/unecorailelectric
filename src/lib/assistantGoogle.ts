import { google } from 'googleapis'
import { supabaseServer } from '@/lib/supabaseServer'
import type { tasks_v1 } from 'googleapis'
import { normalizeAssistantDate, normalizeAssistantTime } from '@/lib/assistantApply'

type AssistantSettingsRow = {
  user_id: string
  settings?: any
  google_calendar_id?: string | null
  google_drive_folder_id?: string | null
  google_tokens?: any
}

type Owner = {
  id: string
  name?: string | null
  level?: string | null
}

type LocalCalendarEvent = {
  id: string
  local_table?: string
  summary: string
  description?: string | null
  location?: string | null
  start_date: string
  start_time?: string | null
  end_date?: string | null
  end_time?: string | null
  category?: string | null
  sub_category?: string | null
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'https://unecorailelectric.vercel.app'
}

function kstDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

export async function getAssistantGoogleAuth(userId: string) {
  const { data: settings, error } = await supabaseServer
    .from('assistant_settings')
    .select('user_id, settings, google_calendar_id, google_drive_folder_id, google_tokens')
    .eq('user_id', userId)
    .maybeSingle<AssistantSettingsRow>()

  if (error || !settings?.google_tokens) {
    throw new Error('Google 연결 정보가 없습니다.')
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth 환경변수가 없습니다.')
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${getAppUrl()}/api/assistant/google/callback`
  )
  oauth2Client.setCredentials(settings.google_tokens)
  oauth2Client.on('tokens', async (tokens) => {
    await supabaseServer
      .from('assistant_settings')
      .update({
        google_tokens: {
          ...settings.google_tokens,
          ...tokens
        },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
  })

  return {
    auth: oauth2Client,
    businessCalendarName: settings.settings?.google_business_calendar_id || settings.google_calendar_id || 'Unecorail',
    personalCalendarName: settings.settings?.google_personal_calendar_id || '개인일정',
    taskListName: settings.settings?.google_task_list_name || 'Unecorail',
    driveFolderId: settings.google_drive_folder_id || null
  }
}

async function resolveCalendarId(calendar: ReturnType<typeof google.calendar>, preferred: string) {
  if (!preferred || preferred === 'primary') return 'primary'

  const list = await calendar.calendarList.list()
  const found = list.data.items?.find((item) => item.id === preferred || item.summary === preferred)
  return found?.id || preferred
}

async function resolveTaskListId(tasks: ReturnType<typeof google.tasks>, preferred: string) {
  const list = await tasks.tasklists.list()
  const found = list.data.items?.find((item) => item.id === preferred || item.title === preferred)
  if (found?.id) return found.id

  const created = await tasks.tasklists.insert({
    requestBody: { title: preferred || 'Unecorail' }
  })
  return created.data.id || '@default'
}

export async function resolveDriveFolderId(drive: ReturnType<typeof google.drive>, preferred?: string | null) {
  if (preferred) return preferred

  const folderName = 'Unecorail'
  const escaped = folderName.replace(/'/g, "\\'")
  const list = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${escaped}' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
    pageSize: 1
  })

  const existing = list.data.files?.[0]
  if (existing?.id) return existing.id

  const created = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    },
    fields: 'id'
  })

  if (!created.data.id) {
    throw new Error('Google Drive Unecorail 폴더 생성에 실패했습니다.')
  }

  return created.data.id
}

function isPersonalEvent(event: any) {
  const text = `${event.category || ''} ${event.sub_category || ''} ${event.summary || ''} ${event.description || ''}`
  return /(개인일정|개인 대화분석|개인 AI|통화녹음 개인|병원|가족|친구|운동|집|약속|휴식|생일|여행)/.test(text)
}

// 구글 이벤트 제목/내용으로 어떤 테이블에 저장할지 결정
function classifyGoogleEvent(summary: string, description?: string) {
  const text = `${summary || ''} ${description || ''}`.toLowerCase()
  
  if (/(출장|업무출장)/.test(text))
    return { table: 'business_trips', tripType: 'business_trip' }
  if (/(외근|현장|as|ss|점검|방문)/.test(text))
    return { table: 'business_trips', tripType: 'field_work' }
  if (/조퇴/.test(text))
    return { table: 'business_trips', tripType: 'early_leave' }
  if (/(연차|연가|휴가)/.test(text))
    return { table: 'leave_requests', leaveType: 'annual' }
  if (/반차/.test(text))
    return { table: 'leave_requests', leaveType: 'half_day' }
  if (/병가/.test(text))
    return { table: 'leave_requests', leaveType: 'sick' }
  
  return { table: 'events' }
}

// 요약글에 사용자 이름이 있는지 확인 후 해당 사용자 반환 (없으면 로그인 사용자 반환)
async function resolveUserFromSummary(summary: string, owner: Owner) {
  try {
    const { data: users } = await supabaseServer
      .from('users')
      .select('id, name, level')
      .eq('is_active', true)
    
    if (users && users.length > 0) {
      for (const user of users) {
        if (user.name && summary.includes(user.name)) {
          return user
        }
      }
    }
  } catch (err) {
    console.error('사용자 조회 실패:', err)
  }
  return owner
}

function toGoogleEvent(event: any) {
  const startDate = event.start_date
  const endDate = event.end_date || event.start_date
  const startTime = event.start_time ? String(event.start_time).slice(0, 5) : null
  const endTime = event.end_time ? String(event.end_time).slice(0, 5) : null

  return {
    summary: event.summary || event.category || 'UNECO 일정',
    description: event.description || '',
    location: event.location || '',
    start: startTime
      ? { dateTime: `${startDate}T${startTime}:00+09:00`, timeZone: 'Asia/Seoul' }
      : { date: startDate },
    end: endTime
      ? { dateTime: `${endDate}T${endTime}:00+09:00`, timeZone: 'Asia/Seoul' }
      : { date: endDate },
    extendedProperties: {
      private: {
        unecorailEventId: String(event.id),
        unecorailSource: 'unecorailelectric'
      }
    }
  }
}

function fromGoogleEvent(item: any, owner: Owner, calendarKind: 'business' | 'personal') {
  const startDate = item.start?.date || String(item.start?.dateTime || '').slice(0, 10)
  const endDate = item.end?.date || String(item.end?.dateTime || '').slice(0, 10) || startDate
  const startTime = item.start?.dateTime ? String(item.start.dateTime).slice(11, 16) : null
  const endTime = item.end?.dateTime ? String(item.end.dateTime).slice(11, 16) : null

  return {
    category: calendarKind === 'personal' ? '개인일정' : 'Google Calendar',
    sub_category: calendarKind === 'personal' ? '개인 동기화' : '업무 동기화',
    summary: item.summary || 'Google 일정',
    description: item.description || null,
    location: item.location || null,
    start_date: startDate,
    start_time: startTime,
    end_date: endDate,
    end_time: endTime,
    participant_id: owner.id,
    participant_name: owner.name || 'yjjang',
    participant_level: owner.level || '4',
    companions: [],
    created_by_id: owner.id,
    created_by_name: owner.name || 'yjjang',
    created_by_level: owner.level || '4'
  }
}

function inDateRange(date: string | null | undefined, startDate: string, endDate: string) {
  return !!date && date >= startDate && date <= endDate
}

function overlapsDateRange(start: string | null | undefined, end: string | null | undefined, startDate: string, endDate: string) {
  if (!start) return false
  const rangeEnd = end || start
  return rangeEnd >= startDate && start <= endDate
}

function compactText(parts: Array<string | null | undefined>) {
  return parts.map((part) => String(part || '').trim()).filter(Boolean).join(' ')
}

function localRowId(localTable: string, localEventId: string) {
  if (localTable === 'business_trips') return localEventId.replace(/^business_trip:/, '')
  if (localTable === 'leave_requests') return localEventId.replace(/^leave:/, '')
  if (localTable === 'projects') return localEventId.split(':').pop() || localEventId
  return localEventId
}

async function getWebsiteCalendarEvents(startDate: string, endDate: string): Promise<LocalCalendarEvent[]> {
  const [eventsRes, projectsRes, tripsRes, leavesRes] = await Promise.all([
    supabaseServer
      .from('events')
      .select('*')
      .gte('start_date', startDate)
      .lte('start_date', endDate),
    supabaseServer
      .from('projects')
      .select('id, project_name, project_number, assembly_date, factory_test_date, site_test_date, completion_date, description')
      .or('assembly_date.not.is.null,factory_test_date.not.is.null,site_test_date.not.is.null,completion_date.not.is.null'),
    supabaseServer
      .from('business_trips')
      .select('*, projects(project_name, project_number)')
      .lte('start_date', endDate)
      .gte('end_date', startDate),
    supabaseServer
      .from('leave_requests')
      .select('*, users!leave_requests_user_id_fkey(id, name)')
      .gte('end_date', startDate)
      .lte('start_date', endDate)
  ])

  const firstError = eventsRes.error || projectsRes.error || tripsRes.error || leavesRes.error
  if (firstError) throw new Error(firstError.message)

  const localEvents: LocalCalendarEvent[] = []

  for (const event of eventsRes.data || []) {
    if (isPersonalEvent(event)) continue
    localEvents.push({
      id: String(event.id),
      local_table: 'events',
      summary: event.summary || event.category || 'UNECO schedule',
      description: event.description || null,
      location: event.location || null,
      start_date: event.start_date,
      start_time: event.start_time || null,
      end_date: event.end_date || event.start_date,
      end_time: event.end_time || null,
      category: event.category || null,
      sub_category: event.sub_category || null
    })
  }

  const projectMilestones = [
    ['assembly_date', '조완'],
    ['factory_test_date', '공시'],
    ['site_test_date', '현시'],
    ['completion_date', '준공']
  ] as const

  for (const project of projectsRes.data || []) {
    for (const [field, label] of projectMilestones) {
      const eventDate = project[field]
      if (!inDateRange(eventDate, startDate, endDate)) continue
      localEvents.push({
        id: `project:${field}:${project.id}`,
        local_table: 'projects',
        summary: compactText([project.project_name, label]),
        description: compactText([project.project_number, project.description]),
        start_date: eventDate,
        end_date: eventDate,
        category: '프로젝트',
        sub_category: label
      })
    }
  }

  for (const trip of tripsRes.data || []) {
    if (!overlapsDateRange(trip.start_date, trip.end_date, startDate, endDate)) continue
    const tripTypeText = trip.trip_type === 'business_trip'
      ? '출장'
      : trip.trip_type === 'early_leave' || String(trip.sub_type || '').includes('조퇴') || String(trip.title || '').includes('조퇴')
        ? '조퇴'
        : '외근'
    const projectName = trip.projects?.project_name || trip.project_name
    const baseTitle = projectName || trip.title || trip.sub_type || trip.location || trip.user_name
    localEvents.push({
      id: `business_trip:${trip.id}`,
      local_table: 'business_trips',
      summary: compactText([baseTitle, String(baseTitle || '').includes(tripTypeText) ? null : tripTypeText]),
      description: compactText([trip.purpose, trip.user_name, trip.status]),
      location: trip.location || null,
      start_date: trip.start_date,
      start_time: trip.start_time || null,
      end_date: trip.end_date || trip.start_date,
      end_time: trip.end_time || null,
      category: tripTypeText,
      sub_category: trip.sub_type || null
    })
  }

  const leaveLabels: Record<string, string> = {
    annual: '연차',
    half_day: '반차',
    sick: '병가',
    personal: '개인휴가',
    early_leave: '조퇴',
    early: '조퇴'
  }

  for (const leave of leavesRes.data || []) {
    if (!overlapsDateRange(leave.start_date, leave.end_date, startDate, endDate)) continue
    const leaveLabel = leaveLabels[leave.leave_type] || leave.leave_type || '휴가'
    const userName = leave.users?.name || leave.user_name || leave.user_id
    localEvents.push({
      id: `leave:${leave.id}`,
      local_table: 'leave_requests',
      summary: compactText([userName, leaveLabel]),
      description: compactText([leave.reason, leave.status]),
      start_date: leave.start_date,
      start_time: leave.start_time || null,
      end_date: leave.end_date || leave.start_date,
      end_time: leave.end_time || null,
      category: '휴가',
      sub_category: leaveLabel
    })
  }

  return localEvents.sort((a, b) => `${a.start_date}${a.start_time || ''}`.localeCompare(`${b.start_date}${b.start_time || ''}`))
}

async function pullCalendarEvents(params: {
  calendar: ReturnType<typeof google.calendar>
  calendarId: string
  owner: Owner
  startDate: string
  endDate: string
  linkByGoogleId: Map<string, any>
  kind: 'business' | 'personal'
}) {
  const googleEvents = await params.calendar.events.list({
    calendarId: params.calendarId,
    timeMin: `${params.startDate}T00:00:00+09:00`,
    timeMax: `${params.endDate}T23:59:59+09:00`,
    singleEvents: true,
    orderBy: 'startTime'
  })

  let pulled = 0
  let pendingUpdates = 0

  for (const item of googleEvents.data.items || []) {
    if (!item.id) continue
    if (item.extendedProperties?.private?.unecorailSource === 'unecorailelectric') continue
    if (item.status === 'cancelled') continue

    // 1. 개인일정 필터링
    const summary = item.summary || ''
    const description = item.description || ''
    const isPersonal = isPersonalEvent({ category: '', sub_category: '', summary, description }) || params.kind === 'personal'
    if (isPersonal) {
      continue
    }

    const existingLink = params.linkByGoogleId.get(item.id)
    if (existingLink) {
      // 2. 이미 연동된 이벤트
      const googleUpdated = item.updated ? new Date(item.updated).getTime() : 0
      const dbGoogleUpdated = existingLink.google_updated_at ? new Date(existingLink.google_updated_at).getTime() : 0

      const summaryChanged = existingLink.google_summary !== item.summary
      const descriptionChanged = existingLink.google_description !== (item.description || null)

      if (googleUpdated > dbGoogleUpdated + 2000 || summaryChanged || descriptionChanged) {
        // 수동 업데이트 대기를 위해 pending_update 상태로 저장
        await supabaseServer
          .from('assistant_google_event_links')
          .update({
            sync_status: existingLink.local_table === 'projects' ? 'pending_update' : 'synced',
            google_updated_at: item.updated,
            google_summary: item.summary || null,
            google_description: item.description || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingLink.id)

        if (existingLink.local_table === 'projects') {
          pendingUpdates += 1
        } else {
          await applyPendingUpdate(existingLink.id, params.owner)
        }
      }
    } else {
      // 3. 신규 이벤트: 스마트 분류
      const classification = classifyGoogleEvent(summary, description)
      const user = await resolveUserFromSummary(summary, params.owner)
      const startDate = item.start?.date || String(item.start?.dateTime || '').slice(0, 10)
      const endDate = item.end?.date || String(item.end?.dateTime || '').slice(0, 10) || startDate
      const startTime = item.start?.dateTime ? String(item.start.dateTime).slice(11, 16) : null
      const endTime = item.end?.dateTime ? String(item.end.dateTime).slice(11, 16) : null

      let localEventId: string | null = null

      if (classification.table === 'business_trips') {
        const { data: inserted, error } = await supabaseServer
          .from('business_trips')
          .insert({
            user_id: user.id,
            user_name: user.name || 'yjjang',
            title: summary,
            location: item.location || '현장',
            purpose: description || '구글 캘린더 동기화',
            start_date: startDate,
            end_date: endDate,
            start_time: startTime,
            end_time: endTime,
            trip_type: classification.tripType,
            status: 'approved'
          })
          .select()
          .single()
        
        if (!error && inserted) localEventId = `business_trip:${inserted.id}`
      } else if (classification.table === 'leave_requests') {
        const sDate = new Date(startDate)
        const eDate = new Date(endDate)
        const diffTime = Math.abs(eDate.getTime() - sDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1
        const totalDays = classification.leaveType === 'half_day' ? 0.5 : diffDays

        const { data: inserted, error } = await supabaseServer
          .from('leave_requests')
          .insert({
            user_id: user.id,
            leave_type: classification.leaveType,
            start_date: startDate,
            end_date: endDate,
            start_time: startTime,
            end_time: endTime,
            total_days: totalDays,
            reason: description || '구글 캘린더 동기화',
            status: 'approved'
          })
          .select()
          .single()
        
        if (!error && inserted) localEventId = `leave:${inserted.id}`
      } else {
        const { data: inserted, error } = await supabaseServer
          .from('events')
          .insert({
            category: 'Google Calendar',
            sub_category: '업무 동기화',
            summary: summary,
            description: description || null,
            location: item.location || null,
            start_date: startDate,
            start_time: startTime,
            end_date: endDate,
            end_time: endTime,
            participant_id: user.id,
            participant_name: user.name || 'yjjang',
            participant_level: user.level || '4',
            created_by_id: user.id,
            created_by_name: user.name || 'yjjang',
            created_by_level: user.level || '4'
          })
          .select()
          .single()
        
        if (!error && inserted) localEventId = String(inserted.id)
      }

      if (localEventId) {
        await supabaseServer
          .from('assistant_google_event_links')
          .upsert({
            user_id: params.owner.id,
            local_event_id: localEventId,
            local_table: classification.table,
            google_event_id: item.id,
            google_html_link: item.htmlLink || null,
            sync_status: 'synced',
            google_updated_at: item.updated,
            google_summary: item.summary || null,
            google_description: item.description || null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,google_event_id' })
        
        pulled += 1
      }
    }
  }

  return { pulled, pendingUpdates }
}

export async function syncAssistantCalendar(owner: Owner, range?: { startDate?: string; endDate?: string }) {
  const { auth, businessCalendarName, personalCalendarName } = await getAssistantGoogleAuth(owner.id)
  const calendar = google.calendar({ version: 'v3', auth })
  const businessCalendarId = await resolveCalendarId(calendar, businessCalendarName)
  const personalCalendarId = await resolveCalendarId(calendar, personalCalendarName)

  const today = new Date()
  const startDate = range?.startDate || new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 10)
  const endDate = range?.endDate || new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().slice(0, 10)

  const localEvents = await getWebsiteCalendarEvents(startDate, endDate)

  const { data: links } = await supabaseServer
    .from('assistant_google_event_links')
    .select('*')
    .eq('user_id', owner.id)

  const linkByLocalId = new Map((links || []).map((link: any) => [String(link.local_event_id), link]))
  const linkByGoogleId = new Map((links || []).map((link: any) => [String(link.google_event_id), link]))

  let pushed = 0
  let updated = 0
  let pulled = 0
  let pendingUpdates = 0

  for (const event of localEvents || []) {
    if (isPersonalEvent(event)) continue
    const targetCalendarId = businessCalendarId
    const resource = toGoogleEvent(event)
    const existing = linkByLocalId.get(String(event.id))

    if (existing?.google_event_id) {
      try {
        await calendar.events.update({
          calendarId: targetCalendarId,
          eventId: existing.google_event_id,
          requestBody: resource
        })
        updated += 1
      } catch {
        const created = await calendar.events.insert({ calendarId: targetCalendarId, requestBody: resource })
        await supabaseServer
          .from('assistant_google_event_links')
          .upsert({
            user_id: owner.id,
            local_event_id: String(event.id),
            local_table: event.local_table || existing.local_table || 'events',
            google_event_id: created.data.id,
            google_html_link: created.data.htmlLink,
            sync_status: 'synced',
            google_updated_at: created.data.updated,
            google_summary: created.data.summary || null,
            google_description: created.data.description || null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,local_event_id' })
        pushed += 1
      }
    } else {
      const created = await calendar.events.insert({ calendarId: targetCalendarId, requestBody: resource })
      await supabaseServer
        .from('assistant_google_event_links')
        .upsert({
          user_id: owner.id,
          local_event_id: String(event.id),
          local_table: event.local_table || 'events',
          google_event_id: created.data.id,
          google_html_link: created.data.htmlLink,
          sync_status: 'synced',
          google_updated_at: created.data.updated,
          google_summary: created.data.summary || null,
          google_description: created.data.description || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,local_event_id' })
      pushed += 1
    }
  }

  const pullResult = await pullCalendarEvents({
    calendar,
    calendarId: businessCalendarId,
    owner,
    startDate,
    endDate,
    linkByGoogleId,
    kind: 'business'
  })

  pulled += pullResult.pulled
  pendingUpdates += pullResult.pendingUpdates

  return {
    pushed,
    updated,
    pulled,
    pendingUpdates,
    startDate,
    endDate,
    businessCalendar: businessCalendarName,
    personalCalendar: personalCalendarName
  }
}

export async function getPendingSyncItems(userId: string) {
  const { data, error } = await supabaseServer
    .from('assistant_google_event_links')
    .select('*')
    .eq('user_id', userId)
    .eq('sync_status', 'pending_update')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('대기 항목 조회 실패:', error)
    return []
  }
  return data || []
}

export async function applyPendingUpdate(linkId: string, owner: Owner) {
  const { data: link, error: linkError } = await supabaseServer
    .from('assistant_google_event_links')
    .select('*')
    .eq('id', linkId)
    .single()

  if (linkError || !link) {
    throw new Error('링크 정보를 찾을 수 없습니다.')
  }

  const { local_table, local_event_id, google_summary, google_description, google_event_id } = link

  const { auth, businessCalendarName } = await getAssistantGoogleAuth(owner.id)
  const calendar = google.calendar({ version: 'v3', auth })
  const businessCalendarId = await resolveCalendarId(calendar, businessCalendarName)
  
  let item: any;
  try {
    const res = await calendar.events.get({
      calendarId: businessCalendarId,
      eventId: google_event_id
    })
    item = res.data
  } catch (err) {
    console.error('구글 이벤트 조회 실패, 캐시 데이터 사용:', err)
  }

  const summary = item?.summary || google_summary || ''
  const description = item?.description || google_description || ''
  const location = item?.location || ''
  const updatedTime = item?.updated || link.google_updated_at || new Date().toISOString()

  const startDate = item?.start?.date || String(item?.start?.dateTime || '').slice(0, 10)
  const endDate = item?.end?.date || String(item?.end?.dateTime || '').slice(0, 10) || startDate
  const startTime = item?.start?.dateTime ? String(item.start.dateTime).slice(11, 16) : null
  const endTime = item?.end?.dateTime ? String(item.end.dateTime).slice(11, 16) : null

  const classification = classifyGoogleEvent(summary, description)
  const user = await resolveUserFromSummary(summary, owner)

  const currentTable = local_table || 'events'
  const targetTable = classification.table
  const currentRowId = localRowId(currentTable, local_event_id)

  let newLocalEventId = local_event_id

  if (currentTable !== targetTable) {
    // 기존 테이블 데이터 삭제
    if (currentTable !== 'projects') {
      await supabaseServer.from(currentTable).delete().eq('id', currentRowId)
    }

    // 새 테이블에 맞게 삽입
    if (targetTable === 'business_trips') {
      const { data: inserted } = await supabaseServer
        .from('business_trips')
        .insert({
          user_id: user.id,
          user_name: user.name || 'yjjang',
          title: summary,
          location: location || '현장',
          purpose: description || '구글 캘린더 동기화',
          start_date: startDate,
          end_date: endDate,
          start_time: startTime,
          end_time: endTime,
          trip_type: classification.tripType,
          status: 'approved'
        })
        .select()
        .single()
      if (inserted) newLocalEventId = `business_trip:${inserted.id}`
    } else if (targetTable === 'leave_requests') {
      const sDate = new Date(startDate)
      const eDate = new Date(endDate)
      const diffTime = Math.abs(eDate.getTime() - sDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1
      const totalDays = classification.leaveType === 'half_day' ? 0.5 : diffDays

      const { data: inserted } = await supabaseServer
        .from('leave_requests')
        .insert({
          user_id: user.id,
          leave_type: classification.leaveType,
          start_date: startDate,
          end_date: endDate,
          start_time: startTime,
          end_time: endTime,
          total_days: totalDays,
          reason: description || '구글 캘린더 동기화',
          status: 'approved'
        })
        .select()
        .single()
      if (inserted) newLocalEventId = `leave:${inserted.id}`
    } else {
      const { data: inserted } = await supabaseServer
        .from('events')
        .insert({
          category: 'Google Calendar',
          sub_category: '업무 동기화',
          summary: summary,
          description: description || null,
          location: location || null,
          start_date: startDate,
          start_time: startTime,
          end_date: endDate,
          end_time: endTime,
          participant_id: user.id,
          participant_name: user.name || 'yjjang',
          participant_level: user.level || '4',
          created_by_id: user.id,
          created_by_name: user.name || 'yjjang',
          created_by_level: user.level || '4'
        })
        .select()
        .single()
      if (inserted) newLocalEventId = String(inserted.id)
    }
  } else {
    // 동일 테이블 업데이트
    if (targetTable === 'business_trips') {
      await supabaseServer
        .from('business_trips')
        .update({
          title: summary,
          location: location || '현장',
          purpose: description || '구글 캘린더 동기화',
          start_date: startDate,
          end_date: endDate,
          start_time: startTime,
          end_time: endTime,
          trip_type: classification.tripType
        })
        .eq('id', currentRowId)
    } else if (targetTable === 'leave_requests') {
      const sDate = new Date(startDate)
      const eDate = new Date(endDate)
      const diffTime = Math.abs(eDate.getTime() - sDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1
      const totalDays = classification.leaveType === 'half_day' ? 0.5 : diffDays

      await supabaseServer
        .from('leave_requests')
        .update({
          leave_type: classification.leaveType,
          start_date: startDate,
          end_date: endDate,
          start_time: startTime,
          end_time: endTime,
          total_days: totalDays,
          reason: description || '구글 캘린더 동기화'
        })
        .eq('id', currentRowId)
    } else {
      await supabaseServer
        .from('events')
        .update({
          summary: summary,
          description: description || null,
          location: location || null,
          start_date: startDate,
          start_time: startTime,
          end_date: endDate,
          end_time: endTime
        })
        .eq('id', currentRowId)
    }
  }

  // 링크 완료로 업데이트
  await supabaseServer
    .from('assistant_google_event_links')
    .update({
      local_table: targetTable,
      local_event_id: newLocalEventId,
      sync_status: 'synced',
      google_updated_at: updatedTime,
      updated_at: new Date().toISOString()
    })
    .eq('id', linkId)

  return { success: true }
}

export async function syncAssistantTasks(owner: Owner) {
  const { auth, taskListName } = await getAssistantGoogleAuth(owner.id)
  const tasks = google.tasks({ version: 'v1', auth })
  const tasklist = await resolveTaskListId(tasks, taskListName)

  const { data: localTodos, error } = await supabaseServer
    .from('todos')
    .select('*')
    .eq('user_id', owner.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const existing = await tasks.tasks.list({
    tasklist,
    showCompleted: true,
    maxResults: 100
  })
  const byLocalId = new Map<string, tasks_v1.Schema$Task>()
  for (const task of existing.data.items || []) {
    const localId = task.notes?.match(/unecoTodoId:([^\s]+)/)?.[1]
    if (localId) byLocalId.set(localId, task)
  }

  let pushed = 0
  let updated = 0

  for (const todo of localTodos || []) {
    const requestBody = {
      title: todo.title,
      notes: `unecoTodoId:${todo.id}\n${todo.category || ''}`,
      due: todo.due_date ? `${todo.due_date}T00:00:00.000Z` : undefined,
      status: todo.completed ? 'completed' : 'needsAction'
    }
    const old = byLocalId.get(String(todo.id))
    if (old?.id) {
      await tasks.tasks.update({ tasklist, task: old.id, requestBody: { ...old, ...requestBody } })
      updated += 1
    } else {
      await tasks.tasks.insert({ tasklist, requestBody })
      pushed += 1
    }
  }

  return { pushed, updated, taskList: taskListName }
}

export async function pushPersonalAnalysisToGoogle(owner: Owner, analysis: {
  summary?: string | null
  todos?: any[]
  events?: any[]
}) {
  const { auth, personalCalendarName } = await getAssistantGoogleAuth(owner.id)
  const calendar = google.calendar({ version: 'v3', auth })
  const tasks = google.tasks({ version: 'v1', auth })
  const personalCalendarId = await resolveCalendarId(calendar, personalCalendarName)
  const personalTaskList = await resolveTaskListId(tasks, '개인일정')

  let eventCount = 0
  let todoCount = 0

  for (const event of analysis.events || []) {
    if (!event?.title) continue
    const startDate = normalizeAssistantDate(event.date)
    const startTime = normalizeAssistantTime(event.time)
    await calendar.events.insert({
      calendarId: personalCalendarId,
      requestBody: {
        summary: event.title,
        description: analysis.summary || '',
        location: event.location || '',
        start: startTime
          ? { dateTime: `${startDate}T${startTime}:00+09:00`, timeZone: 'Asia/Seoul' }
          : { date: startDate },
        end: startTime
          ? { dateTime: `${startDate}T${startTime}:00+09:00`, timeZone: 'Asia/Seoul' }
          : { date: startDate }
      }
    })
    eventCount += 1
  }

  for (const todo of analysis.todos || []) {
    if (!todo?.title) continue
    await tasks.tasks.insert({
      tasklist: personalTaskList,
      requestBody: {
        title: todo.title,
        notes: analysis.summary || '개인 통화/대화 분석',
        due: todo.dueDate ? `${normalizeAssistantDate(todo.dueDate)}T00:00:00.000Z` : undefined
      }
    })
    todoCount += 1
  }

  return { eventCount, todoCount, calendar: personalCalendarName, taskList: '개인일정' }
}

export async function createAssistantDriveReport(owner: Owner, logId: string) {
  const { auth, driveFolderId } = await getAssistantGoogleAuth(owner.id)
  const drive = google.drive({ version: 'v3', auth })
  const targetFolderId = await resolveDriveFolderId(drive, driveFolderId)

  const { data: log, error } = await supabaseServer
    .from('assistant_analysis_logs')
    .select('*')
    .eq('id', logId)
    .eq('user_id', owner.id)
    .single()

  if (error || !log) throw new Error(error?.message || '분석 로그를 찾을 수 없습니다.')

  const content = [
    `AI 분석 리포트 - ${log.source_title || '대화'}`,
    `생성일: ${new Date().toLocaleString('ko-KR')}`,
    '',
    '요약',
    log.summary || '',
    '',
    '결정사항',
    ...(log.decisions || []).map((item: string) => `- ${item}`),
    '',
    '할 일',
    ...(log.todos || []).map((item: any) => `- ${item.title}`),
    '',
    '일정 후보',
    ...(log.events || []).map((item: any) => `- ${item.title}`),
    '',
    '개선점',
    ...(log.improvements || []).map((item: string) => `- ${item}`),
    '',
    '위험 신호',
    ...(log.risks || []).map((item: string) => `- ${item}`)
  ].join('\n')

  const file = await drive.files.create({
    requestBody: {
      name: `AI 분석 리포트_${new Date().toISOString().slice(0, 10)}_${String(log.id).slice(0, 8)}.txt`,
      mimeType: 'text/plain',
      parents: [targetFolderId]
    },
    media: {
      mimeType: 'text/plain',
      body: content
    },
    fields: 'id, name, webViewLink'
  })

  await supabaseServer
    .from('assistant_analysis_logs')
    .update({
      source_uri: file.data.webViewLink || log.source_uri,
      status: log.status === 'applied' ? 'applied_reported' : 'reported'
    })
    .eq('id', log.id)
    .eq('user_id', owner.id)

  return file.data
}

export async function createDailySummaryDoc(owner: Owner, date = kstDate()) {
  const { auth, driveFolderId } = await getAssistantGoogleAuth(owner.id)
  const drive = google.drive({ version: 'v3', auth })
  const targetFolderId = await resolveDriveFolderId(drive, driveFolderId)

  const start = `${date}T00:00:00+09:00`
  const end = `${date}T23:59:59+09:00`

  const [{ data: logs }, { data: todos }, events] = await Promise.all([
    supabaseServer
      .from('assistant_analysis_logs')
      .select('*')
      .eq('user_id', owner.id)
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: true }),
    supabaseServer
      .from('todos')
      .select('*')
      .eq('user_id', owner.id)
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: true }),
    getWebsiteCalendarEvents(date, date)
  ])

  const html = [
    '<html><body>',
    `<h1>${date} 하루 일지</h1>`,
    '<h2>오늘의 대화/통화 요약</h2>',
    logs?.length
      ? `<ul>${logs.map((log: any) => `<li><b>${log.source_title || log.source_type}</b>: ${log.summary || ''}</li>`).join('')}</ul>`
      : '<p>기록된 대화 분석이 없습니다.</p>',
    '<h2>오늘 생성된 할 일</h2>',
    todos?.length
      ? `<ul>${todos.map((todo: any) => `<li>${todo.completed ? '[완료]' : '[대기]'} ${todo.title}</li>`).join('')}</ul>`
      : '<p>오늘 생성된 할 일이 없습니다.</p>',
    '<h2>오늘 일정</h2>',
    events?.length
      ? `<ul>${events.map((event: any) => `<li>${event.start_time ? String(event.start_time).slice(0, 5) : ''} ${event.summary || event.category}</li>`).join('')}</ul>`
      : '<p>오늘 일정이 없습니다.</p>',
    '<h2>개선 메모</h2>',
    logs?.length
      ? `<ul>${logs.flatMap((log: any) => log.improvements || []).map((item: string) => `<li>${item}</li>`).join('')}</ul>`
      : '<p>특이 개선 메모가 없습니다.</p>',
    '</body></html>'
  ].join('')

  const file = await drive.files.create({
    requestBody: {
      name: `${date} 하루 일지`,
      mimeType: 'application/vnd.google-apps.document',
      parents: [targetFolderId]
    },
    media: {
      mimeType: 'text/html',
      body: html
    },
    fields: 'id, name, webViewLink'
  })

  return file.data
}
