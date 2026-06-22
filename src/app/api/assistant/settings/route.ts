import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { defaultAssistantSettings } from '@/lib/assistantAutomation'
import { getAssistantOwnerById } from '@/lib/assistantAccessServer'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const owner = await getAssistantOwnerById(request.headers.get('x-user-id'))

    if (!owner) {
      return NextResponse.json({ error: 'yjjang 개인 비서 전용 기능입니다.' }, { status: 403 })
    }

    const { data, error } = await supabaseServer
      .from('assistant_settings')
      .select('*')
      .eq('user_id', owner.id)
      .maybeSingle()

    if (error) {
      return NextResponse.json({
        settings: defaultAssistantSettings,
        google_connected: false,
        google_calendar_id: 'primary',
        google_drive_folder_id: '',
        setupRequired: true,
        setupSql: 'database/create_assistant_automation.sql',
        error: error.message
      })
    }

    return NextResponse.json({
      settings: { ...defaultAssistantSettings, ...(data?.settings || {}) },
      google_connected: data?.google_connected || false,
      google_calendar_id: data?.google_calendar_id || 'primary',
      google_business_calendar_id: data?.settings?.google_business_calendar_id || data?.google_calendar_id || 'Unecorail',
      google_personal_calendar_id: data?.settings?.google_personal_calendar_id || '개인일정',
      google_task_list_name: data?.settings?.google_task_list_name || 'Unecorail',
      morning_brief_time: data?.settings?.morning_brief_time || '08:01',
      work_report_reminder_time: data?.settings?.work_report_reminder_time || '16:30',
      google_drive_folder_id: data?.google_drive_folder_id || '',
      setupRequired: false
    })
  } catch (error) {
    console.error('Assistant settings GET error:', error)
    return NextResponse.json({ error: '설정 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const owner = await getAssistantOwnerById(request.headers.get('x-user-id'))

    if (!owner) {
      return NextResponse.json({ error: 'yjjang 개인 비서 전용 기능입니다.' }, { status: 403 })
    }

    const body = await request.json()
    const settings = {
      ...defaultAssistantSettings,
      ...(body.settings || {}),
      google_business_calendar_id: body.google_business_calendar_id || body.google_calendar_id || 'Unecorail',
      google_personal_calendar_id: body.google_personal_calendar_id || '개인일정',
      google_task_list_name: body.google_task_list_name || 'Unecorail',
      morning_brief_time: body.morning_brief_time || '08:01',
      work_report_reminder_time: body.work_report_reminder_time || '16:30'
    }

    const { data, error } = await supabaseServer
      .from('assistant_settings')
      .upsert({
        user_id: owner.id,
        settings,
        google_calendar_id: body.google_business_calendar_id || body.google_calendar_id || 'Unecorail',
        google_drive_folder_id: body.google_drive_folder_id || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      return NextResponse.json({
        error: '설정 저장에 실패했습니다.',
        details: error.message,
        setupSql: 'database/create_assistant_automation.sql'
      }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Assistant settings PUT error:', error)
    return NextResponse.json({ error: '설정 저장 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
