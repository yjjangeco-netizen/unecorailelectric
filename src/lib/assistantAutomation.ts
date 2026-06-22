export type AssistantFeatureKey =
  | 'google_calendar_sync'
  | 'sms_expense_capture'
  | 'call_recording_upload'
  | 'conversation_analysis'
  | 'auto_todo_extract'
  | 'auto_calendar_create'
  | 'telegram_confirmations'

export type AssistantFeatureSettings = Record<AssistantFeatureKey, boolean>

export const defaultAssistantSettings: AssistantFeatureSettings = {
  google_calendar_sync: false,
  sms_expense_capture: false,
  call_recording_upload: false,
  conversation_analysis: false,
  auto_todo_extract: true,
  auto_calendar_create: false,
  telegram_confirmations: true
}

export const assistantFeatureLabels: Array<{
  key: AssistantFeatureKey
  title: string
  description: string
}> = [
  {
    key: 'google_calendar_sync',
    title: 'Google Calendar 양방향 연동',
    description: '사이트 일정과 Google Calendar 일정을 서로 동기화합니다.'
  },
  {
    key: 'sms_expense_capture',
    title: '문자 기반 가계부 자동입력',
    description: 'Android 문자 승인 내역을 분석해 지출 항목으로 저장합니다.'
  },
  {
    key: 'call_recording_upload',
    title: '통화녹음 Drive 자동 업로드',
    description: 'Android 통화녹음 파일을 Google Drive에 올리고 분석 대기열에 넣습니다.'
  },
  {
    key: 'conversation_analysis',
    title: '대화/통화 내용 분석',
    description: '대화 요약, 결정사항, 개선점, 위험 신호를 리포트로 만듭니다.'
  },
  {
    key: 'auto_todo_extract',
    title: '할 일 자동 추출',
    description: '분석 결과에서 내가 해야 할 일을 Todo 후보로 생성합니다.'
  },
  {
    key: 'auto_calendar_create',
    title: '일정 자동 등록',
    description: '명확한 일정 정보만 캘린더 등록 후보로 생성합니다.'
  },
  {
    key: 'telegram_confirmations',
    title: '텔레그램 확인',
    description: '자동 등록 전 텔레그램으로 확인 메시지를 보냅니다.'
  }
]

export type AssistantAnalysisResult = {
  summary: string
  decisions: string[]
  todos: Array<{
    title: string
    dueDate?: string | null
    priority: 'low' | 'medium' | 'high'
  }>
  events: Array<{
    title: string
    date?: string | null
    time?: string | null
    location?: string | null
  }>
  improvements: string[]
  risks: string[]
}

const datePattern = /(\d{4}[.-]\d{1,2}[.-]\d{1,2}|\d{1,2}\s*월\s*\d{1,2}\s*일|오늘|내일|모레|이번\s*주\s*(월요일|화요일|수요일|목요일|금요일|토요일|일요일|월|화|수|목|금|토|일)|다음\s*주\s*(월요일|화요일|수요일|목요일|금요일|토요일|일요일|월|화|수|목|금|토|일))/g
const timePattern = /(오전|오후)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?|(\d{1,2}):(\d{2})/g

function uniqueByTitle<T extends { title: string }>(items: T[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.title.trim()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function cleanTitle(line: string) {
  return line
    .replace(/^(그리고|또|추가로|아 그리고)\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
}

function makeEventTitle(line: string) {
  const compact = cleanTitle(line)
  const actionMatch = compact.match(/(?:에|에서)?\s*([^.,\n]+?(점검|회의|미팅|방문|출장|면담|상담|검토|실사|작업|일정))(?:을|를|하기로|잡기로|진행|예정|한다|했다|함|$)/)
  if (actionMatch?.[1]) return actionMatch[1].trim().slice(0, 80)
  return compact
    .replace(datePattern, '')
    .replace(timePattern, '')
    .replace(/(일정|잡기로|하기로|예정|진행|한다|했다)/g, '')
    .trim()
    .slice(0, 80) || compact.slice(0, 80)
}

export function analyzeConversationText(text: string): AssistantAnalysisResult {
  const normalized = text.replace(/\r/g, '').trim()
  const sentences = normalized
    .split(/[.\n!?]+/)
    .map((line) => line.trim())
    .filter(Boolean)

  const todos = uniqueByTitle(sentences
    .filter((line) =>
      /(까지|해야|보내야|정리|작성|확인|전달|준비|체크|수정|보고|회신|처리|마감)/.test(line)
    )
    .filter((line) => !/(잡기로|예정|일정|회의|미팅|방문|출장)/.test(line))
    .map((line) => ({
      title: cleanTitle(line),
      dueDate: line.match(datePattern)?.[0] || null,
      priority: /(급|긴급|오늘|내일|마감|까지)/.test(line) ? 'high' as const : 'medium' as const
    })))

  const events = uniqueByTitle(sentences
    .filter((line) => {
      const hasDateOrTime = Boolean(line.match(datePattern) || line.match(timePattern))
      const hasEventKeyword = /(일정|잡기로|예정|회의|미팅|방문|출장|점검|면담|상담|실사|작업)/.test(line)
      const isOnlyTodo = /(까지|보내야|정리해서|작성해서|제출)/.test(line)
      return hasDateOrTime && hasEventKeyword && !isOnlyTodo
    })
    .slice(0, 3)
    .map((line) => ({
      title: makeEventTitle(line),
      date: line.match(datePattern)?.[0] || null,
      time: line.match(timePattern)?.[0] || null,
      location: line.match(/(?:장소|위치)\s*[:：]?\s*([^,.\n]+)/)?.[1] || null
    })))

  const decisions = sentences
    .filter((line) => /(결정|확정|합의|진행하기로|하기로|완료)/.test(line))
    .map(cleanTitle)
    .slice(0, 5)

  const risks = sentences
    .filter((line) => /(문제|위험|지연|취소|변경|책임|비용|금액|계약|누락|불명확)/.test(line))
    .map(cleanTitle)
    .slice(0, 5)

  const improvements = sentences
    .filter((line) => /(다음부터|앞으로|미리|사전에|개선|고쳐|주의|준비해야)/.test(line))
    .map(cleanTitle)
    .slice(0, 5)

  return {
    summary: sentences.slice(0, 4).join(' / ') || '분석할 내용이 부족합니다.',
    decisions,
    todos: todos.slice(0, 8),
    events,
    improvements: improvements.length > 0
      ? improvements
      : ['일정, 책임자, 마감 기준은 대화 마지막에 다시 확인하는 것이 좋습니다.'],
    risks
  }
}
