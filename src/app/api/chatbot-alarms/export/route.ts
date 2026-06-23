import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import {
  MT_VALUE_TO_LABEL,
  CTRL_VALUE_TO_LABEL,
  csvCell
} from '@/lib/alarmCsv'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 알람 전체를 엑셀(CSV)로 다운로드. 행 = (기계분류 × 컨트롤러 × 알람코드).
export async function GET() {
  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('machine_alarm_codes')
      .select(
        'alarm_code, plc_address, message_original, cause, action_short, severity, requires_disk, machine_profiles(machine_type, hardware_version)'
      )
      .eq('is_active', true)
      .order('alarm_code', { ascending: true })

    if (error) throw error

    const header = [
      'machine_type', 'controller', 'alarm_code', 'plc_address',
      'message', 'cause', 'action', 'severity', 'requires_disk'
    ]
    const lines = [header.join(',')]

    for (const r of (data || []) as any[]) {
      const mp = Array.isArray(r.machine_profiles) ? r.machine_profiles[0] : r.machine_profiles
      const mt = MT_VALUE_TO_LABEL[mp?.machine_type] || mp?.machine_type || ''
      const ctrl = CTRL_VALUE_TO_LABEL[mp?.hardware_version] || mp?.hardware_version || ''
      lines.push([
        csvCell(mt), csvCell(ctrl), csvCell(r.alarm_code), csvCell(r.plc_address),
        csvCell(r.message_original), csvCell(r.cause), csvCell(r.action_short),
        csvCell(r.severity), csvCell(r.requires_disk ? 'Y' : 'ALL')
      ].join(','))
    }

    // 엑셀 한글 호환을 위해 UTF-8 BOM 추가
    const body = '﻿' + lines.join('\r\n')
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="alarms_${stamp}.csv"`
      }
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '내보내기 실패' },
      { status: 500 }
    )
  }
}
