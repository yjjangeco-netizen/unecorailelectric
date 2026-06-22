import { supabaseServer } from '@/lib/supabaseServer'

const weekdayIndex: Record<string, number> = {
  일: 0,
  일요일: 0,
  월: 1,
  월요일: 1,
  화: 2,
  화요일: 2,
  수: 3,
  수요일: 3,
  목: 4,
  목요일: 4,
  금: 5,
  금요일: 5,
  토: 6,
  토요일: 6
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function normalizeAssistantDate(value?: string | null) {
  const today = new Date()
  const currentYear = today.getFullYear()

  if (!value) return formatDate(today)

  const cleaned = value.replace(/\s/g, '')
  const explicit = cleaned.match(/^(\d{4})[.-](\d{1,2})[.-](\d{1,2})$/)
  if (explicit) {
    return `${explicit[1]}-${explicit[2].padStart(2, '0')}-${explicit[3].padStart(2, '0')}`
  }

  const korean = cleaned.match(/^(\d{1,2})월(\d{1,2})일$/)
  if (korean) {
    return `${currentYear}-${korean[1].padStart(2, '0')}-${korean[2].padStart(2, '0')}`
  }

  if (cleaned === '오늘') return formatDate(today)
  if (cleaned === '내일') {
    today.setDate(today.getDate() + 1)
    return formatDate(today)
  }
  if (cleaned === '모레') {
    today.setDate(today.getDate() + 2)
    return formatDate(today)
  }

  const weekMatch = cleaned.match(/^(이번주|다음주)(월요일|화요일|수요일|목요일|금요일|토요일|일요일|월|화|수|목|금|토|일)$/)
  if (weekMatch) {
    const target = weekdayIndex[weekMatch[2]]
    const date = new Date()
    const diff = (target - date.getDay() + 7) % 7
    date.setDate(date.getDate() + diff + (weekMatch[1] === '다음주' ? 7 : 0))
    return formatDate(date)
  }

  return formatDate(today)
}

export function normalizeAssistantTime(value?: string | null) {
  if (!value) return null

  const colon = value.match(/(\d{1,2}):(\d{2})/)
  if (colon) {
    return `${colon[1].padStart(2, '0')}:${colon[2]}`
  }

  const korean = value.match(/(오전|오후)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/)
  if (!korean) return null

  let hour = Number(korean[2])
  const minute = korean[3] || '00'
  if (korean[1] === '오후' && hour < 12) hour += 12
  if (korean[1] === '오전' && hour === 12) hour = 0

  return `${String(hour).padStart(2, '0')}:${minute.padStart(2, '0')}`
}

export async function applyAssistantAnalysis(params: {
  userId: string
  userName?: string | null
  userLevel?: string | null
  summary?: string | null
  todos?: any[]
  events?: any[]
  createTodos: boolean
  createEvents: boolean
  calendarScope?: 'business' | 'personal'
}) {
  const createdTodos = []
  const createdEvents = []
  const isPersonal = params.calendarScope === 'personal'

  if (params.createTodos) {
    for (const todo of params.todos || []) {
      if (!todo?.title) continue

      const { data, error } = await supabaseServer
        .from('todos')
        .insert({
          user_id: params.userId,
          title: todo.title,
          completed: false,
          due_date: todo.dueDate ? normalizeAssistantDate(todo.dueDate) : null,
          priority: todo.priority || 'medium',
          category: isPersonal ? '개인 AI' : 'AI 자동화',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (!error && data) createdTodos.push(data)
    }
  }

  if (params.createEvents) {
    for (const event of params.events || []) {
      if (!event?.title) continue
      if (isPersonal) continue

      const startDate = normalizeAssistantDate(event.date)
      const startTime = normalizeAssistantTime(event.time)

      const { data, error } = await supabaseServer
        .from('events')
        .insert({
          category: isPersonal ? '개인일정' : 'AI 자동화',
          sub_category: isPersonal ? '개인 대화분석' : '업무 대화분석',
          summary: event.title,
          description: params.summary || null,
          location: event.location || null,
          start_date: startDate,
          start_time: startTime,
          end_date: startDate,
          end_time: startTime,
          participant_id: params.userId,
          participant_name: params.userName || 'AI 자동화',
          participant_level: params.userLevel || '4',
          companions: [],
          created_by_id: params.userId,
          created_by_name: params.userName || 'AI 자동화',
          created_by_level: params.userLevel || '4'
        })
        .select()
        .single()

      if (!error && data) createdEvents.push(data)
    }
  }

  return {
    createdTodos,
    createdEvents,
    todoCount: createdTodos.length,
    eventCount: createdEvents.length
  }
}
