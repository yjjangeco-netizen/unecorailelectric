import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

const DEFAULTS = {
  enabled: true,
  event_created: true,
  work_report_submitted: true,
  report_approved: true
}

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { data } = await supabaseServer
    .from('notification_settings')
    .select('enabled, event_created, work_report_submitted, report_approved')
    .eq('user_id', userId)
    .maybeSingle()

  return NextResponse.json({ settings: { ...DEFAULTS, ...(data || {}) } })
}

export async function PUT(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const settings = {
    user_id: userId,
    enabled: body.enabled !== false,
    event_created: body.event_created !== false,
    work_report_submitted: body.work_report_submitted !== false,
    report_approved: body.report_approved !== false,
    updated_at: new Date().toISOString()
  }

  const { error } = await supabaseServer
    .from('notification_settings')
    .upsert(settings, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, settings })
}
