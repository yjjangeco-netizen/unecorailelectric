import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// QR 챗봇 지식관리: FAQ / 정비항목 / 증상대응 CRUD.
// 공통 항목(machine_profile_id=null)으로 등록하고 챗봇이 공개로 답할 수 있게 visibility=public.

const TABLE: Record<string, string> = {
  faq: 'machine_faq_entries',
  maintenance: 'machine_maintenance_items',
  symptom: 'machine_symptom_guides'
}
const LIST_COLS: Record<string, string> = {
  faq: 'id, question, answer_short, category, priority, created_at',
  maintenance: 'id, item_name, category, action_short, created_at',
  symptom: 'id, symptom_title, action_short, priority, created_at'
}

function splitList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean)
  return String(v || '')
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}
function num(v: unknown): number | null {
  const n = Number(v)
  return Number.isFinite(n) && String(v ?? '').trim() !== '' ? n : null
}

export async function GET(request: NextRequest) {
  const type = new URL(request.url).searchParams.get('type') || 'faq'
  const table = TABLE[type]
  if (!table) return NextResponse.json({ error: '잘못된 종류' }, { status: 400 })
  try {
    const sb = getSupabaseAdmin()
    const { data, error } = await sb
      .from(table)
      .select(LIST_COLS[type])
      .order('created_at', { ascending: false })
      .limit(300)
    if (error) throw error
    return NextResponse.json({ items: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '조회 실패' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  const body = await request.json().catch(() => ({} as any))
  const type = body?.type
  const table = TABLE[type]
  if (!table) return NextResponse.json({ error: '잘못된 종류' }, { status: 400 })

  let payload: any
  if (type === 'faq') {
    if (!body.question || !body.answer_short)
      return NextResponse.json({ error: '질문과 짧은 답변은 필수입니다.' }, { status: 400 })
    payload = {
      machine_profile_id: null,
      question: body.question,
      normalized_question: body.question,
      answer_short: body.answer_short,
      answer_detail: body.answer_detail || null,
      category: body.category || 'faq',
      search_keywords: splitList(body.search_keywords),
      priority: num(body.priority) ?? 3,
      visibility: 'public',
      is_active: true
    }
  } else if (type === 'maintenance') {
    if (!body.item_name || !body.action_short)
      return NextResponse.json({ error: '정비항목과 짧은 조치는 필수입니다.' }, { status: 400 })
    payload = {
      machine_profile_id: null,
      item_name: body.item_name,
      category: body.category || 'maintenance',
      maintenance_type: body.maintenance_type || null,
      interval_days: num(body.interval_days),
      interval_hours: num(body.interval_hours),
      interval_months: num(body.interval_months),
      consumable_spec: body.consumable_spec || null,
      required_tools: splitList(body.required_tools),
      safety_note: body.safety_note || null,
      action_short: body.action_short,
      action_detail: body.action_detail || null,
      visibility: 'public',
      is_active: true
    }
  } else {
    if (!body.symptom_title || !body.action_short)
      return NextResponse.json({ error: '증상명과 짧은 조치는 필수입니다.' }, { status: 400 })
    payload = {
      machine_profile_id: null,
      symptom_title: body.symptom_title,
      normalized_symptom: body.symptom_title,
      search_keywords: splitList(body.search_keywords),
      cause_candidates: body.cause_candidates || null,
      check_order: body.check_order || null,
      action_short: body.action_short,
      action_detail: body.action_detail || null,
      priority: num(body.priority) ?? 3,
      visibility: 'public',
      is_active: true
    }
  }

  try {
    const sb = getSupabaseAdmin()
    const { data, error } = await sb.from(table).insert(payload).select('id').single()
    if (error) throw error
    return NextResponse.json({ ok: true, id: data?.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '등록 실패' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || ''
  const id = searchParams.get('id')
  const table = TABLE[type]
  if (!table || !id) return NextResponse.json({ error: 'type/id가 필요합니다.' }, { status: 400 })
  try {
    const sb = getSupabaseAdmin()
    const { error } = await sb.from(table).delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '삭제 실패' }, { status: 500 })
  }
}
