import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { getAssistantOwnerById } from '@/lib/assistantAccessServer'

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

    const { data: log, error: logError } = await supabaseServer
      .from('assistant_analysis_logs')
      .select('*')
      .eq('id', logId)
      .eq('user_id', owner.id)
      .single()

    if (logError || !log) {
      return NextResponse.json({ error: '분석 로그를 찾을 수 없습니다.', details: logError?.message }, { status: 404 })
    }

    const content = [
      `요약\n${log.summary || ''}`,
      `결정사항\n${(log.decisions || []).map((item: string) => `- ${item}`).join('\n') || '- 없음'}`,
      `할 일\n${(log.todos || []).map((item: any) => `- ${item.title}`).join('\n') || '- 없음'}`,
      `일정 후보\n${(log.events || []).map((item: any) => `- ${item.title}`).join('\n') || '- 없음'}`,
      `개선점\n${(log.improvements || []).map((item: string) => `- ${item}`).join('\n') || '- 없음'}`,
      `위험 신호\n${(log.risks || []).map((item: string) => `- ${item}`).join('\n') || '- 없음'}`
    ].join('\n\n')

    const { data, error } = await supabaseServer
      .from('memos')
      .insert({
        user_id: owner.id,
        title: `AI 분석 - ${log.source_title || '대화'}`,
        content,
        color: 'purple',
        is_pinned: true,
        archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({
        error: '메모 저장에 실패했습니다.',
        details: error.message,
        setupSql: 'database/create_memos.sql'
      }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Assistant memo error:', error)
    return NextResponse.json({ error: 'AI 분석 메모 저장 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
