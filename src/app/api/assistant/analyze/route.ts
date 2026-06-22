import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { analyzeConversationText } from '@/lib/assistantAutomation'
import { getAssistantOwnerById } from '@/lib/assistantAccessServer'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const owner = await getAssistantOwnerById(request.headers.get('x-user-id'))

    if (!owner) {
      return NextResponse.json({ error: 'yjjang 개인 비서 전용 기능입니다.' }, { status: 403 })
    }

    const { data, error } = await supabaseServer
      .from('assistant_analysis_logs')
      .select('id, source_type, source_title, summary, todos, events, improvements, risks, status, created_at')
      .eq('user_id', owner.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      return NextResponse.json({
        logs: [],
        setupSql: 'database/create_assistant_automation.sql',
        error: error.message
      })
    }

    return NextResponse.json({ logs: data || [] })
  } catch (error) {
    console.error('Assistant analyze list error:', error)
    return NextResponse.json({ error: '분석 기록 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const owner = await getAssistantOwnerById(request.headers.get('x-user-id'))

    if (!owner) {
      return NextResponse.json({ error: 'yjjang 개인 비서 전용 기능입니다.' }, { status: 403 })
    }

    const body = await request.json()
    const rawText = String(body.text || '').trim()
    const sourceType = body.source_type || 'manual'
    const sourceTitle = body.source_title || '수동 분석'

    if (!rawText) {
      return NextResponse.json({ error: '분석할 텍스트가 필요합니다.' }, { status: 400 })
    }

    const analysis = analyzeConversationText(rawText)

    const { data, error } = await supabaseServer
      .from('assistant_analysis_logs')
      .insert({
        user_id: owner.id,
        source_type: sourceType,
        source_title: sourceTitle,
        source_uri: body.source_uri || null,
        raw_text: rawText,
        summary: analysis.summary,
        decisions: analysis.decisions,
        todos: analysis.todos,
        events: analysis.events,
        improvements: analysis.improvements,
        risks: analysis.risks,
        status: 'analyzed'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({
        analysis,
        saved: false,
        setupSql: 'database/create_assistant_automation.sql',
        error: error.message
      })
    }

    return NextResponse.json({ analysis, saved: true, log: data })
  } catch (error) {
    console.error('Assistant analyze error:', error)
    return NextResponse.json({ error: '분석 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
