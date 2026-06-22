import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { applyAssistantAnalysis } from '@/lib/assistantApply'
import { getAssistantOwnerById } from '@/lib/assistantAccessServer'
import { syncAssistantCalendar } from '@/lib/assistantGoogle'
import { notifyPersonalAiDone } from '@/lib/assistantNotifications'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const owner = await getAssistantOwnerById(request.headers.get('x-user-id'))

    if (!owner) {
      return NextResponse.json({ error: 'yjjang 개인 비서 전용 기능입니다.' }, { status: 403 })
    }

    const body = await request.json()
    const logId = body.logId

    if (!logId) {
      return NextResponse.json({ error: '분석 로그 ID가 필요합니다.' }, { status: 400 })
    }

    const { data: user } = await supabaseServer
      .from('users')
      .select('id, name, level')
      .eq('id', owner.id)
      .maybeSingle()

    const { data: log, error: logError } = await supabaseServer
      .from('assistant_analysis_logs')
      .select('*')
      .eq('id', logId)
      .eq('user_id', owner.id)
      .single()

    if (logError || !log) {
      return NextResponse.json({ error: '분석 로그를 찾을 수 없습니다.', details: logError?.message }, { status: 404 })
    }

    const result = await applyAssistantAnalysis({
      userId: owner.id,
      userName: user?.name,
      userLevel: user?.level,
      summary: log.summary,
      todos: Array.isArray(log.todos) ? log.todos : [],
      events: Array.isArray(log.events) ? log.events : [],
      createTodos: true,
      createEvents: true
    })

    await supabaseServer
      .from('assistant_analysis_logs')
      .update({ status: 'applied' })
      .eq('id', logId)
      .eq('user_id', owner.id)

    if (result.eventCount > 0) {
      const { data: settings } = await supabaseServer
        .from('assistant_settings')
        .select('settings, google_connected')
        .eq('user_id', owner.id)
        .maybeSingle()

      if (settings?.google_connected && settings.settings?.google_calendar_sync) {
        try {
          await syncAssistantCalendar(owner)
        } catch (syncError) {
          console.warn('Assistant apply Google sync skipped:', syncError)
        }
      }
    }

    await notifyPersonalAiDone(
      '분석 결과를 반영했습니다.',
      `할 일 ${result.todoCount}개, 일정 ${result.eventCount}개`
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Assistant apply error:', error)
    return NextResponse.json({ error: '분석 결과 반영 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
