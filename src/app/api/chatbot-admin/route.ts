import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// QR 챗봇 통합 관리자 — 프로젝트/알람/FAQ/정비/증상 CRUD.
// hectoraaa admin(QR_KAKAO)의 관리 기능을 unecorailelectric로 통합 포팅.

const TABLE: Record<string, string> = {
  profile: 'machine_profiles',
  alarm: 'machine_alarm_codes',
  faq: 'machine_faq_entries',
  maintenance: 'machine_maintenance_items',
  symptom: 'machine_symptom_guides',
  manual: 'machine_manual_links'
}

// 콤마/줄바꿈 문자열 → text[] 로 변환할 필드
const ARRAY_FIELDS = new Set([
  'search_keywords',
  'required_tools',
  'related_alarm_codes'
])
const INT_FIELDS = new Set([
  'display_priority',
  'priority',
  'interval_hours',
  'interval_days',
  'interval_months'
])

function normalizePayload(payload: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(payload || {})) {
    if (ARRAY_FIELDS.has(k)) {
      out[k] = Array.isArray(v)
        ? v
        : String(v || '')
            .split(/[\n,]+/)
            .map((s) => s.trim())
            .filter(Boolean)
    } else if (INT_FIELDS.has(k)) {
      const n = Number(v)
      out[k] = String(v ?? '').trim() === '' || !Number.isFinite(n) ? null : n
    } else if (typeof v === 'string') {
      out[k] = v.trim() === '' ? null : v
    } else {
      out[k] = v
    }
  }
  return out
}

export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams
  const entity = sp.get('entity') || 'profile'
  const profileId = sp.get('profileId')
  const table = TABLE[entity]
  if (!table) return NextResponse.json({ error: '잘못된 종류' }, { status: 400 })
  try {
    const sb = getSupabaseAdmin()
    let q = sb.from(table).select('*')
    if (entity === 'profile') {
      q = q.order('created_at', { ascending: true })
    } else if (entity === 'manual') {
      // 드라이브에서 동기화된 학습데이터(매뉴얼)만
      q = q.not('google_file_id', 'is', null).order('created_at', { ascending: false })
    } else {
      if (profileId) q = q.eq('machine_profile_id', profileId)
      q = q.order('updated_at', { ascending: false })
    }
    const { data, error } = await q.limit(500)
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
  const entity = body?.entity
  const table = TABLE[entity]
  if (!table) return NextResponse.json({ error: '잘못된 종류' }, { status: 400 })

  const id = body?.id
  const payload = normalizePayload(body?.payload || {})

  // 챗봇 노출/식별 관련 기본값
  if (entity !== 'profile') {
    if (payload.machine_profile_id === undefined) payload.machine_profile_id = null
    if (!payload.visibility) payload.visibility = 'public'
    if (payload.is_active === undefined) payload.is_active = true
  } else {
    if (payload.is_active === undefined) payload.is_active = true
  }

  try {
    const sb = getSupabaseAdmin()
    if (id) {
      const { error } = await sb.from(table).update(payload).eq('id', id)
      if (error) throw error
      return NextResponse.json({ ok: true, id })
    }
    const { data, error } = await sb.from(table).insert(payload).select('id').single()
    if (error) throw error
    return NextResponse.json({ ok: true, id: data?.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '저장 실패' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  const sp = new URL(request.url).searchParams
  const entity = sp.get('entity') || ''
  const id = sp.get('id')
  const table = TABLE[entity]
  if (!table || !id) return NextResponse.json({ error: 'entity/id가 필요합니다.' }, { status: 400 })
  try {
    const sb = getSupabaseAdmin()
    // 매뉴얼은 의미검색 청크도 함께 제거
    if (entity === 'manual') {
      const { data: row } = await sb
        .from('machine_manual_links')
        .select('google_file_id')
        .eq('id', id)
        .maybeSingle()
      if (row?.google_file_id) {
        await sb.from('machine_manual_chunks').delete().eq('google_file_id', row.google_file_id)
      }
    }
    const { error } = await sb.from(table).delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '삭제 실패' }, { status: 500 })
  }
}
