import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import {
  parseCsv,
  machineTypeToValue,
  controllerToValue,
  severityToCode,
  reqDisk
} from '@/lib/alarmCsv'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function decode(buf: ArrayBuffer): string {
  const u8 = new Uint8Array(buf)
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(u8)
  } catch {
    return new TextDecoder('euc-kr').decode(u8)
  }
}

// 엑셀(CSV) 업로드 → machine_alarm_codes 일괄 upsert.
// 두 형식 지원:
//  - flat:    machine_type, controller, alarm_code, plc_address, message, cause, action, severity, requires_disk
//  - compact: machine_type, alarm_code, message, cause, action, severity, requires_disk, plc_d_dsl, plc_one
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const file = form.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
    }
    const text = decode(await file.arrayBuffer())
    const rows = parseCsv(text)
    if (rows.length < 2) {
      return NextResponse.json({ error: '데이터 행이 없습니다.' }, { status: 400 })
    }

    const header = rows[0].map((h) => h.trim().toLowerCase())
    const ci = (name: string) => header.indexOf(name)
    const isCompact = ci('plc_d_dsl') >= 0 || ci('plc_one') >= 0
    const get = (cells: string[], name: string) =>
      ci(name) >= 0 ? (cells[ci(name)] ?? '').trim() : ''

    const admin = getSupabaseAdmin()

    // 프로파일 맵: `${machine_type}|${controllerValue}` → id
    const { data: profiles, error: pErr } = await admin
      .from('machine_profiles')
      .select('id, machine_type, hardware_version')
      .eq('is_active', true)
    if (pErr) throw pErr
    const profMap = new Map<string, string>()
    for (const p of (profiles || []) as any[]) {
      const key = `${p.machine_type}|${controllerToValue(p.hardware_version || '')}`
      if (!profMap.has(key)) profMap.set(key, p.id)
    }

    const upserts: any[] = []
    const skipped: string[] = []

    for (let i = 1; i < rows.length; i++) {
      const c = rows[i]
      const code = get(c, 'alarm_code')
      const message = get(c, 'message')
      if (!code || !message) continue
      const mt = machineTypeToValue(get(c, 'machine_type'))
      const action = get(c, 'action') || message
      const sev = severityToCode(get(c, 'severity'))
      const disk = reqDisk(get(c, 'requires_disk'))

      const targets: { ctrl: string; plc: string; source: string }[] = []
      if (isCompact) {
        const pdd = get(c, 'plc_d_dsl')
        const pone = get(c, 'plc_one')
        if (pdd) {
          targets.push({ ctrl: 'sinumerik_840d', plc: pdd, source: '840D' })
          targets.push({ ctrl: 'sinumerik_840dsl', plc: pdd, source: '840Dsl' })
        }
        if (pone) targets.push({ ctrl: 'sinumerik_one', plc: pone, source: 'ONE' })
      } else {
        const ctrl = controllerToValue(get(c, 'controller'))
        targets.push({ ctrl, plc: get(c, 'plc_address'), source: get(c, 'controller') })
      }

      for (const t of targets) {
        const pid = profMap.get(`${mt}|${t.ctrl}`)
        if (!pid) { skipped.push(`${code}(${mt}/${t.ctrl})`); continue }
        upserts.push({
          machine_profile_id: pid,
          alarm_code: code,
          plc_address: t.plc || null,
          message_original: message,
          action_short: action,
          severity: sev,
          requires_disk: disk,
          source: t.source,
          category: 'imported',
          visibility: 'public',
          is_active: true
        })
      }
    }

    if (upserts.length === 0) {
      return NextResponse.json(
        { error: '입력할 행이 없습니다. (프로파일 매칭 실패 가능)', skipped: skipped.slice(0, 20) },
        { status: 400 }
      )
    }

    const { error: upErr } = await admin
      .from('machine_alarm_codes')
      .upsert(upserts, { onConflict: 'machine_profile_id,alarm_code' })
    if (upErr) throw upErr

    return NextResponse.json({
      ok: true,
      format: isCompact ? 'compact' : 'flat',
      입력행: upserts.length,
      건너뜀: skipped.length,
      건너뜀상세: skipped.slice(0, 20)
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '업로드 실패' },
      { status: 500 }
    )
  }
}
