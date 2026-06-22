import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

function normalizeAlarmSource(value: string) {
  if (value === 'sinumerik one') return 'sinumerik ONE'
  if (value === 'Fanuc') return 'Fanuc 0iT+'
  return value
}

function getMachineFamily(projectNumber?: string | null) {
  const normalized = (projectNumber || '').toUpperCase()
  if (normalized.includes('CNCUWL')) return 'CNCUWL'
  if (normalized.includes('CNCDWL')) return 'CNCDWL'
  if (normalized.includes('CNCWL')) return 'CNCWL'
  return 'common'
}

function isEnabled(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized !== '' && normalized !== 'false' && normalized !== 'none' && normalized !== 'no'
  }
  return Boolean(value)
}

function getManualTags(project: Record<string, unknown>) {
  return {
    cctv: isEnabled(project.cctv_spec),
    buzzer: isEnabled(project.buzzer),
    warningLight: isEnabled(project.warning_light)
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: project, error: projectError } = await supabaseServer
      .from('projects')
      .select('id, project_number, project_name, hardware_version, has_disk, automatic_cover, cctv_spec, warning_light, buzzer')
      .eq('id', params.id)
      .maybeSingle()

    if (projectError) {
      return NextResponse.json({ error: projectError.message }, { status: 500 })
    }

    if (!project) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 })
    }

    const alarmSource = normalizeAlarmSource(project.hardware_version || '')
    const machineFamily = getMachineFamily(project.project_number)
    const hasDisk = isEnabled(project.has_disk)
    const hasSafetyDoor = isEnabled(project.automatic_cover)
    const manualTags = getManualTags(project)

    if (!alarmSource) {
      return NextResponse.json({
        project,
        alarmSource: '',
        machineFamily,
        manualTags,
        alarms: [],
        count: 0
      })
    }

    const alarmColumns = 'id, source, machine_family, requires_disk, requires_safety_door, alarm_code, plc_address, category, severity, alarm_title, message_original, cause, action_short, action_detail, requires_stop, updated_at'
    let alarmResult: any = await supabaseServer
      .from('machine_alarm_codes')
      .select(alarmColumns)
      .eq('is_active', true)
      .eq('source', alarmSource)
      .order('alarm_code', { ascending: true })

    if (alarmResult.error?.code === '42703') {
      alarmResult = await supabaseServer
        .from('machine_alarm_codes')
        .select('id, source, alarm_code, plc_address, category, severity, alarm_title, message_original, cause, action_short, action_detail, requires_stop, updated_at')
        .eq('is_active', true)
        .eq('source', alarmSource)
        .order('alarm_code', { ascending: true })
    }

    if (alarmResult.error) {
      return NextResponse.json({ error: alarmResult.error.message }, { status: 500 })
    }

    const alarms = (alarmResult.data || []).filter((alarm: Record<string, unknown>) => {
      const alarmFamily = String(alarm.machine_family || 'common')
      const familyMatches = alarmFamily === 'common' || alarmFamily === machineFamily
      const diskMatches = !isEnabled(alarm.requires_disk) || hasDisk
      const safetyDoorMatches = !isEnabled(alarm.requires_safety_door) || hasSafetyDoor
      return familyMatches && diskMatches && safetyDoorMatches
    })

    return NextResponse.json({
      project,
      alarmSource,
      machineFamily,
      hasDisk,
      hasSafetyDoor,
      manualTags,
      alarms,
      count: alarms.length
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : '프로젝트 알람 조회 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
