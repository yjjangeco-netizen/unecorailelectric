import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

const CONFIG_KEY = 'admin-content'

type AdminContentItem = {
  id?: string
  type?: string
  title?: string
  category?: string
  version?: string
  lastUpdated?: string
  description?: string
  body?: string
  active?: boolean
}

type IndexItem = {
  id: string
  type: string
  title: string
  category: string
  version: string
  lastUpdated: string
  description: string
  body: string
  tags: string[]
}

function compactTags(tags: unknown[]) {
  return tags
    .flatMap((tag) => (Array.isArray(tag) ? tag : [tag]))
    .filter(Boolean)
    .map(String)
}

function normalizeItem(item: AdminContentItem): IndexItem {
  return {
    id: item.id || `${item.type || 'content'}-${item.title || Date.now()}`,
    type: item.type || 'manual',
    title: item.title || '',
    category: item.category || '',
    version: item.version || '',
    lastUpdated: item.lastUpdated || '',
    description: item.description || '',
    body: item.body || '',
    tags: compactTags([item.type, item.category, item.version])
  }
}

function normalizeBoard(row: any): IndexItem {
  return {
    id: `board-${row.id}`,
    type: 'manual',
    title: row.title || '',
    category: row.board_type || row.document_group || '',
    version: row.document_group || '',
    lastUpdated: String(row.updated_at || row.created_at || '').slice(0, 10),
    description: row.drive_web_url ? 'Google Drive imported manual' : '',
    body: row.content || '',
    tags: compactTags([
      'manual',
      row.board_type,
      row.document_group,
      row.machine_type,
      row.hardware_type
    ])
  }
}

function formatAlarmTitle(code: unknown, title: unknown) {
  const alarmCode = String(code || '').trim()
  const alarmTitle = String(title || '').trim()
  if (!alarmCode) return alarmTitle
  if (!alarmTitle) return `[${alarmCode}]`
  return alarmTitle.includes(alarmCode) ? alarmTitle : `[${alarmCode}] ${alarmTitle}`
}

function displayAlarmCategory(row: any) {
  const source = String(row.source || '').trim()
  if (/sinumerik|fanuc|840|dsl|one/i.test(source)) return source
  return row.category || source || 'machine_alarm'
}

function normalizeMachineAlarm(row: any): IndexItem {
  const title = formatAlarmTitle(row.alarm_code, row.alarm_title || row.message_original)

  return {
    id: `alarm-${row.id}`,
    type: 'alarm',
    title,
    category: displayAlarmCategory(row),
    version: row.source || '',
    lastUpdated: String(row.updated_at || row.created_at || '').slice(0, 10),
    description: row.plc_address ? `PLC: ${row.plc_address}` : '',
    body: [
      row.message_original ? `message: ${row.message_original}` : '',
      row.cause ? `cause: ${row.cause}` : '',
      row.action_short ? `action: ${row.action_short}` : '',
      row.action_detail ? `detail: ${row.action_detail}` : '',
      row.requires_stop ? 'warning: machine stop check required' : ''
    ].filter(Boolean).join('\n'),
    tags: compactTags([
      'alarm',
      row.alarm_code,
      row.plc_address,
      row.category,
      row.severity,
      row.source,
      row.search_keywords
    ])
  }
}

function isAuthorized(request: NextRequest) {
  const token = process.env['CHATBOT_INDEX_TOKEN']
  if (!token) return true
  return request.headers.get('x-chatbot-index-token') === token
}

function isMissingTable(error: any) {
  return error?.code === 'PGRST205' || error?.code === '42P01'
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const warnings: string[] = []

  const { data, error } = await supabaseServer
    .from('app_settings')
    .select('value')
    .eq('key', CONFIG_KEY)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  const items = Array.isArray(data?.value?.items) ? data.value.items : []
  const activeItems = items
    .filter((item: AdminContentItem) => item?.active !== false && item?.type !== 'alarm')
    .map(normalizeItem)

  const { data: boards, error: boardError } = await supabaseServer
    .from('work_tool_boards')
    .select('id, board_type, title, content, created_at, updated_at, drive_web_url, document_group, machine_type, hardware_type')
    .in('board_type', ['SOP', 'TOOLS', 'TROUBLESHOOTING', 'TECH_DATA'])
    .order('updated_at', { ascending: false })

  if (boardError) {
    return NextResponse.json({ ok: false, error: boardError.message }, { status: 500 })
  }

  const boardItems = (boards || []).map(normalizeBoard)

  const { data: machineAlarms, error: alarmError } = await supabaseServer
    .from('machine_alarm_codes')
    .select('id, source, alarm_code, plc_address, category, severity, alarm_title, message_original, cause, action_short, action_detail, search_keywords, requires_stop, created_at, updated_at')
    .eq('is_active', true)
    .order('alarm_code', { ascending: true })

  if (alarmError && !isMissingTable(alarmError)) {
    warnings.push(`machine_alarm_codes: ${alarmError.message}`)
  }

  const alarmItems = alarmError ? [] : (machineAlarms || []).map(normalizeMachineAlarm)
  const allItems = [...activeItems, ...boardItems, ...alarmItems]
  const manualCount = allItems.filter((item) => item.type === 'manual').length
  const alarmCount = allItems.filter((item) => item.type === 'alarm').length

  return NextResponse.json({
    ok: true,
    source: 'unecorailelectric',
    count: allItems.length,
    counts: {
      admin: activeItems.length,
      manuals: manualCount,
      alarms: alarmCount
    },
    warnings,
    items: allItems
  })
}
