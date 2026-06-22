// 홈 화면 위젯용 데이터 다리.
// 앱이 일정/메모를 단말 저장소(Capacitor Preferences = Android SharedPreferences "CapacitorStorage")
// 에 써두면, 네이티브 위젯(CalendarWidgetProvider / MemoWidgetProvider)이 그 값을 읽어 표시한다.
//
// 키:
//   widget_events : { updatedAt, events: [{ date:'YYYY-MM-DD', title, color }] }
//   widget_memos  : { updatedAt, memos: [{ title, content, color }] }

type WidgetEventInput = {
  title: string
  start: string | Date
  end?: string | Date
  backgroundColor?: string
}

type WidgetMemoInput = {
  title?: string
  content?: string
  color?: string
}

const MAX_EVENTS = 400
const MAX_SPAN_DAYS = 92
const MAX_MEMOS = 30

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatLocalDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toDateString(value: string | Date | undefined | null): string | null {
  if (!value) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : formatLocalDate(value)
  }
  const s = String(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : formatLocalDate(d)
}

function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + days)
  return formatLocalDate(d)
}

async function writePreference(key: string, value: unknown) {
  try {
    const { Preferences } = await import('@capacitor/preferences')
    await Preferences.set({ key, value: JSON.stringify(value) })
  } catch {
    // 웹/미지원 환경에서는 무시 (위젯은 안드로이드 전용)
  }
}

/** 일정 목록을 위젯용으로 압축해 저장. 다일 일정은 각 날짜로 펼친다. */
export async function syncWidgetEvents(events: WidgetEventInput[]) {
  const items: { date: string; title: string; color: string }[] = []

  for (const event of events || []) {
    if (!event?.title) continue
    const startDate = toDateString(event.start)
    if (!startDate) continue
    const endDate = toDateString(event.end) || startDate

    let cursor = startDate
    for (let i = 0; i <= MAX_SPAN_DAYS && cursor <= endDate; i++) {
      items.push({
        date: cursor,
        title: event.title,
        color: event.backgroundColor || '#2563eb'
      })
      if (cursor === endDate) break
      cursor = addDays(cursor, 1)
      if (items.length >= MAX_EVENTS) break
    }
    if (items.length >= MAX_EVENTS) break
  }

  items.sort((a, b) => a.date.localeCompare(b.date))

  await writePreference('widget_events', {
    updatedAt: new Date().toISOString(),
    events: items
  })
}

/** 메모 목록을 위젯용으로 압축해 저장. */
export async function syncWidgetMemos(memos: WidgetMemoInput[]) {
  const items = (memos || [])
    .slice(0, MAX_MEMOS)
    .map((memo) => ({
      title: (memo.title || '').slice(0, 60),
      content: (memo.content || '').slice(0, 200),
      color: memo.color || 'yellow'
    }))

  await writePreference('widget_memos', {
    updatedAt: new Date().toISOString(),
    memos: items
  })
}
