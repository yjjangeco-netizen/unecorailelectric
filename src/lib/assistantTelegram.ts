import { createApiClient } from '@/lib/supabaseServer'
import { isHoliday, isWeekend } from '@/lib/holidays'
import type { TelegramInlineButton } from '@/lib/telegram'

type AssistantUser = {
  id: string
  username?: string
  email?: string
  name: string
  level: string
  department?: string
}

type TelegramLink = {
  chat_id: string
  telegram_user_id?: string
  username?: string
  linked_user_id?: string
  is_active?: boolean
}

const KST_TIME_ZONE = 'Asia/Seoul'

function formatKstDate(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: KST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  return formatter.format(date)
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function getWeekRange() {
  const now = new Date()
  const today = new Date(`${formatKstDate(now)}T00:00:00+09:00`)
  const day = today.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const start = addDays(today, mondayOffset)
  const end = addDays(start, 6)

  return {
    startDate: formatKstDate(start),
    endDate: formatKstDate(end)
  }
}

function getTodayRange() {
  const today = formatKstDate(new Date())
  return { startDate: today, endDate: today }
}

function isAdminLevel(level?: string) {
  const normalized = String(level || '1').toLowerCase()
  return normalized === '5' || normalized === 'admin' || normalized === 'administrator'
}

function truncateLines(lines: string[], maxLines: number) {
  if (lines.length <= maxLines) return lines
  return [...lines.slice(0, maxLines), `...외 ${lines.length - maxLines}건`]
}

function normalizeTitle(value: string) {
  return value
    .replace(/선반/g, 'A')
    .replace(/유니트/g, 'U')
    .replace(/공장시운전/g, '공시')
    .replace(/현장시운전/g, '현시')
}

export function isTelegramChatAllowed(chatId: number | string) {
  const allowed = process.env['TELEGRAM_ALLOWED_CHAT_IDS']
  if (!allowed) return true

  return allowed
    .split(',')
    .map(id => id.trim())
    .filter(Boolean)
    .includes(String(chatId))
}

export async function getLinkedAssistantUser(chatId: number | string): Promise<AssistantUser | null> {
  const supabase = createApiClient()
  const defaultUserId = process.env['TELEGRAM_DEFAULT_USER_ID']

  const { data: link } = await supabase
    .from('telegram_users')
    .select('chat_id, telegram_user_id, username, linked_user_id, is_active')
    .eq('chat_id', String(chatId))
    .eq('is_active', true)
    .maybeSingle<TelegramLink>()

  const userId = link?.linked_user_id || defaultUserId
  if (!userId) return null

  const { data: user } = await supabase
    .from('users')
    .select('id, username, email, name, level, department')
    .eq('id', userId)
    .eq('is_active', true)
    .maybeSingle<AssistantUser>()

  return user || null
}

export async function registerTelegramChat(params: {
  chatId: number | string
  telegramUserId?: number
  username?: string
  firstName?: string
}) {
  const supabase = createApiClient()

  await supabase
    .from('telegram_users')
    .upsert({
      chat_id: String(params.chatId),
      telegram_user_id: params.telegramUserId ? String(params.telegramUserId) : null,
      username: params.username || null,
      display_name: params.firstName || null,
      is_active: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'chat_id' })
}

export async function linkTelegramChat(params: {
  chatId: number | string
  telegramUserId?: number
  userId: string
  linkCode?: string
}) {
  const allowedTelegramIds = process.env['TELEGRAM_LINK_ALLOWED_TELEGRAM_IDS']
    ?.split(',')
    .map(id => id.trim())
    .filter(Boolean)

  if (allowedTelegramIds?.length) {
    if (!params.telegramUserId || !allowedTelegramIds.includes(String(params.telegramUserId))) {
      return { ok: false, message: '이 텔레그램 계정은 계정 연결 권한이 없습니다.' }
    }
  }

  const expectedCode = process.env['TELEGRAM_LINK_CODE']

  if (expectedCode && params.linkCode !== expectedCode) {
    return { ok: false, message: '연결 코드가 올바르지 않습니다.' }
  }

  const supabase = createApiClient()

  const { data: userById, error: userByIdError } = await supabase
    .from('users')
    .select('id, name')
    .eq('id', params.userId)
    .eq('is_active', true)
    .maybeSingle()

  if (userByIdError) {
    return { ok: false, message: `사용자 조회 실패: ${userByIdError.message}` }
  }

  let user = userById

  if (!user) {
    const { data: userByUsername, error: userByUsernameError } = await supabase
      .from('users')
      .select('id, name')
      .eq('username', params.userId)
      .eq('is_active', true)
      .maybeSingle()

    if (userByUsernameError) {
      return { ok: false, message: `사용자 조회 실패: ${userByUsernameError.message}` }
    }

    user = userByUsername
  }

  if (!user) {
    return { ok: false, message: '해당 사용자를 찾을 수 없습니다.' }
  }

  const { error } = await supabase
    .from('telegram_users')
    .update({
      linked_user_id: user.id,
      updated_at: new Date().toISOString()
    })
    .eq('chat_id', String(params.chatId))

  if (error) {
    return { ok: false, message: `텔레그램 연결 실패: ${error.message}` }
  }

  return { ok: true, message: `${user.name} 계정과 연결했습니다.` }
}

export async function buildCalendarBrief(user: AssistantUser, range: { startDate: string; endDate: string }) {
  const supabase = createApiClient()
  const lines: string[] = []

  const { data: projects } = await supabase
    .from('projects')
    .select('id, project_name, project_number, assembly_date, factory_test_date, site_test_date, completion_date')
    .or('assembly_date.not.is.null,factory_test_date.not.is.null,site_test_date.not.is.null,completion_date.not.is.null')

  projects?.forEach(project => {
    const projectName = normalizeTitle(project.project_name || project.project_number || '프로젝트')
    const projectEvents = [
      { date: project.assembly_date, label: '조완' },
      { date: project.factory_test_date, label: '공시' },
      { date: project.site_test_date, label: '현시' },
      { date: project.completion_date, label: '준공' }
    ]

    projectEvents.forEach(event => {
      if (event.date >= range.startDate && event.date <= range.endDate) {
        lines.push(`${event.date} · ${projectName} ${event.label}`)
      }
    })
  })

  let tripQuery = supabase
    .from('business_trips')
    .select('id, user_id, user_name, title, trip_type, sub_type, project_id, location, start_date, start_time, end_date, end_time, projects(project_name)')
    .lte('start_date', range.endDate)
    .gte('end_date', range.startDate)

  if (!isAdminLevel(user.level)) {
    tripQuery = tripQuery.eq('user_id', user.id)
  }

  const { data: trips } = await tripQuery
  trips?.forEach(trip => {
    const type =
      trip.trip_type === 'business_trip'
        ? '출장'
        : trip.trip_type === 'early_leave' || String(trip.sub_type || trip.title || '').includes('조퇴')
          ? '조퇴'
          : '외근'
    const tripProject = Array.isArray(trip.projects) ? trip.projects[0] : trip.projects
    const projectName = normalizeTitle(tripProject?.project_name || trip.title || trip.sub_type || trip.location || '')
    const time = trip.start_time ? ` ${String(trip.start_time).slice(0, 5)}` : ''
    lines.push(`${trip.start_date}${time} · ${projectName || trip.user_name} ${type}`)
  })

  let leaveQuery = supabase
    .from('leave_requests')
    .select('id, user_id, leave_type, start_date, end_date, start_time, users!leave_requests_user_id_fkey(name)')
    .lte('start_date', range.endDate)
    .gte('end_date', range.startDate)

  if (!isAdminLevel(user.level)) {
    leaveQuery = leaveQuery.eq('user_id', user.id)
  }

  const { data: leaves } = await leaveQuery
  leaves?.forEach(leave => {
    const labelMap: Record<string, string> = {
      annual: '연차',
      half_day: '반차',
      sick: '병가',
      personal: '개인휴가',
      early_leave: '조퇴'
    }
    const label = labelMap[leave.leave_type] || leave.leave_type || '휴가'
    const leaveUser = Array.isArray(leave.users) ? leave.users[0] : leave.users
    const name = leaveUser?.name || '임직원'
    const time = leave.start_time ? ` ${String(leave.start_time).slice(0, 5)}` : ''
    lines.push(`${leave.start_date}${time} · ${name} ${label}`)
  })

  const { data: events } = await supabase
    .from('events')
    .select('id, participant_id, participant_name, category, summary, start_date, start_time, end_date')
    .lte('start_date', range.endDate)
    .gte('end_date', range.startDate)

  events
    ?.filter(event => isAdminLevel(user.level) || event.participant_id === user.id)
    .forEach(event => {
      const title = normalizeTitle(event.summary || event.category || '일정')
      const time = event.start_time ? ` ${String(event.start_time).slice(0, 5)}` : ''
      lines.push(`${event.start_date}${time} · ${title}`)
    })

  const sortedLines = lines.sort((a, b) => a.localeCompare(b))

  if (sortedLines.length === 0) {
    return `${range.startDate === range.endDate ? '오늘' : '이번 주'} 등록된 일정이 없습니다.`
  }

  const title = range.startDate === range.endDate
    ? `오늘 일정 (${range.startDate})`
    : `이번 주 일정 (${range.startDate} ~ ${range.endDate})`

  return `<b>${title}</b>\n\n${truncateLines(sortedLines, 20).join('\n')}`
}

export async function buildMissingDiaryBrief(user: AssistantUser) {
  const supabase = createApiClient()
  const isAdmin = isAdminLevel(user.level)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const workDays: string[] = []
  for (let i = 1; i <= 14; i++) {
    const date = addDays(today, -i)
    if (!isWeekend(date) && !isHoliday(date)) {
      workDays.push(formatKstDate(date))
    }
  }

  const minDate = workDays[workDays.length - 1]
  const maxDate = workDays[0]

  let userQuery = supabase
    .from('users')
    .select('id, name, department, level')
    .eq('is_active', true)

  if (!isAdmin) userQuery = userQuery.eq('id', user.id)

  const { data: users } = await userQuery
  const targetUsers = (users || []).filter(target => {
    const id = String(target.id).toLowerCase()
    const name = String(target.name).toLowerCase()
    return id !== 'admin' && name !== 'administrator' && name !== '관리자'
  })

  let diaryQuery = supabase
    .from('work_diary')
    .select('user_id, work_date')
    .gte('work_date', minDate)
    .lte('work_date', maxDate)

  if (!isAdmin) diaryQuery = diaryQuery.eq('user_id', user.id)

  const { data: diaries } = await diaryQuery
  const covered = new Set<string>()

  diaries?.forEach(diary => {
    covered.add(`${diary.user_id}_${formatKstDate(new Date(diary.work_date))}`)
  })

  const { data: leaves } = await supabase
    .from('leave_requests')
    .select('user_id, start_date, end_date')
    .lte('start_date', maxDate)
    .gte('end_date', minDate)

  leaves?.forEach(leave => {
    const start = new Date(`${leave.start_date}T00:00:00+09:00`)
    const end = new Date(`${leave.end_date}T00:00:00+09:00`)
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      if (!isWeekend(date) && !isHoliday(date)) {
        covered.add(`${leave.user_id}_${formatKstDate(date)}`)
      }
    }
  })

  const missing: string[] = []
  targetUsers.forEach(target => {
    workDays.forEach(date => {
      if (!covered.has(`${target.id}_${date}`)) {
        missing.push(`${date} · ${target.name}`)
      }
    })
  })

  if (missing.length === 0) {
    return '<b>누락 업무일지</b>\n\n최근 근무일 기준 누락된 업무일지가 없습니다.'
  }

  return `<b>누락 업무일지 ${missing.length}건</b>\n\n${truncateLines(missing, 25).join('\n')}`
}

export function getAssistantKeyboard() {
  const appUrl = process.env['NEXT_PUBLIC_APP_URL'] || process.env['VERCEL_URL']
  const scheduleUrl = appUrl
    ? `${appUrl.startsWith('http') ? appUrl : `https://${appUrl}`}/schedule`
    : undefined

  const firstRow: TelegramInlineButton[] = [
    { text: '오늘 일정', callback_data: 'today' },
    { text: '이번 주', callback_data: 'week' }
  ]
  const secondRow: TelegramInlineButton[] = [
    { text: '누락 업무일지', callback_data: 'missing' }
  ]

  if (scheduleUrl) {
    secondRow.push({ text: '웹 달력 열기', url: scheduleUrl })
  }

  return {
    inline_keyboard: [firstRow, secondRow]
  }
}

export function parseAssistantCommand(text: string) {
  const normalized = text.trim().toLowerCase()

  if (normalized === '/start' || normalized.startsWith('/start ')) return 'start'
  if (normalized === '/help' || normalized.includes('도움')) return 'help'
  if (normalized.startsWith('/link ') || normalized.startsWith('연결 ')) return 'link'
  if (normalized === '/today' || normalized.includes('오늘')) return 'today'
  if (normalized === '/week' || normalized.includes('이번주') || normalized.includes('이번 주')) return 'week'
  if (normalized === '/missing' || normalized.includes('누락') || normalized.includes('업무일지')) return 'missing'

  return 'help'
}

export function getHelpMessage() {
  return [
    '<b>유네코레일 AI 비서</b>',
    '',
    '사용 가능한 명령:',
    '· 오늘 일정',
    '· 이번 주 일정',
    '· 누락 업무일지',
    '· /link 사용자ID 연결코드',
    '',
    '처음 연결할 때는 관리자에게 받은 연결코드가 필요합니다.'
  ].join('\n')
}

export { getTodayRange, getWeekRange }
