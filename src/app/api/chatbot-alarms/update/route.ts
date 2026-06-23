import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { severityToCode } from '@/lib/alarmCsv'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 알람 1건(= 컨트롤러 사본 여러 id) 수정 저장.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const ids: string[] = Array.isArray(body.ids) ? body.ids : body.id ? [body.id] : []
    if (!ids.length) {
      return NextResponse.json({ error: '대상 id가 없습니다.' }, { status: 400 })
    }
    const message = String(body.message ?? '').trim()
    if (!message) {
      return NextResponse.json({ error: '메시지는 필수입니다.' }, { status: 400 })
    }
    const patch = {
      message_original: message,
      action_short: String(body.action ?? '').trim() || message,
      severity: severityToCode(String(body.severity ?? 'normal')),
      requires_disk: !!body.requires_disk,
      updated_at: new Date().toISOString()
    }
    const admin = getSupabaseAdmin()
    const { error } = await admin
      .from('machine_alarm_codes')
      .update(patch)
      .in('id', ids)
    if (error) throw error
    return NextResponse.json({ ok: true, updated: ids.length })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '저장 실패' },
      { status: 500 }
    )
  }
}
