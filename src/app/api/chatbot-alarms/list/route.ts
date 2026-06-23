import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { MT_VALUE_TO_LABEL, CTRL_VALUE_TO_LABEL } from '@/lib/alarmCsv'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 알람 목록 (개별 편집기용). (기계분류 × 알람코드)로 묶어 한 줄, 컨트롤러 사본 id 모음.
export async function GET() {
  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('machine_alarm_codes')
      .select(
        'id, alarm_code, plc_address, message_original, action_short, severity, requires_disk, machine_profiles(machine_type, hardware_version)'
      )
      .eq('is_active', true)
      .order('alarm_code', { ascending: true })
    if (error) throw error

    const groups = new Map<string, any>()
    for (const r of (data || []) as any[]) {
      const mp = Array.isArray(r.machine_profiles) ? r.machine_profiles[0] : r.machine_profiles
      const mt = mp?.machine_type || ''
      const key = `${mt}|${r.alarm_code}`
      const ctrl = CTRL_VALUE_TO_LABEL[mp?.hardware_version] || mp?.hardware_version || ''
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          machine_type: mt,
          machine_type_label: MT_VALUE_TO_LABEL[mt] || mt,
          alarm_code: r.alarm_code,
          plc_address: r.plc_address,
          message: r.message_original || '',
          action: r.action_short || '',
          severity: r.severity || 'normal',
          requires_disk: !!r.requires_disk,
          ids: [r.id],
          controllers: [ctrl]
        })
      } else {
        const g = groups.get(key)
        g.ids.push(r.id)
        if (ctrl && !g.controllers.includes(ctrl)) g.controllers.push(ctrl)
      }
    }

    const items = Array.from(groups.values()).sort((a, b) =>
      a.machine_type === b.machine_type
        ? a.alarm_code.localeCompare(b.alarm_code)
        : a.machine_type.localeCompare(b.machine_type)
    )
    return NextResponse.json({ ok: true, items })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '목록 조회 실패' },
      { status: 500 }
    )
  }
}
