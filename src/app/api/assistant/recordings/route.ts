import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { analyzeConversationText } from '@/lib/assistantAutomation'
import { getAssistantOwnerById } from '@/lib/assistantAccessServer'
import { applyAssistantAnalysis } from '@/lib/assistantApply'
import { pushPersonalAnalysisToGoogle } from '@/lib/assistantGoogle'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const owner = await getAssistantOwnerById(request.headers.get('x-user-id'))

    if (!owner) {
      return NextResponse.json({ error: 'yjjang 개인 비서 전용 기능입니다.' }, { status: 403 })
    }

    const body = await request.json()
    const fileName = String(body.file_name || '').trim()

    if (!fileName) {
      return NextResponse.json({ error: '파일명이 필요합니다.' }, { status: 400 })
    }

    let analysisLogId = null
    let analysis = null

    if (body.transcript) {
      analysis = analyzeConversationText(String(body.transcript))
      const { data: log } = await supabaseServer
        .from('assistant_analysis_logs')
        .insert({
          user_id: owner.id,
          source_type: 'call_recording',
          source_title: fileName,
          source_uri: body.drive_web_url || body.file_uri || null,
          raw_text: body.transcript,
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

      analysisLogId = log?.id || null

      if (analysisLogId && body.auto_apply) {
        await applyAssistantAnalysis({
          userId: owner.id,
          userName: owner.name,
          userLevel: owner.level,
          summary: analysis.summary,
          todos: analysis.todos,
          events: analysis.events,
          createTodos: true,
          createEvents: true,
          calendarScope: 'personal'
        })

        try {
          await pushPersonalAnalysisToGoogle(owner, analysis)
        } catch (syncError) {
          console.warn('Recording personal Google sync skipped:', syncError)
        }
      }
    }

    const { data, error } = await supabaseServer
      .from('assistant_recordings')
      .insert({
        user_id: owner.id,
        file_name: fileName,
        file_uri: body.file_uri || null,
        drive_file_id: body.drive_file_id || null,
        drive_web_url: body.drive_web_url || null,
        transcript: body.transcript || null,
        analysis_log_id: analysisLogId,
        status: analysisLogId ? 'analyzed' : 'uploaded'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({
        error: '통화녹음 기록 저장에 실패했습니다.',
        details: error.message,
        setupSql: 'database/create_assistant_automation.sql'
      }, { status: 500 })
    }

    return NextResponse.json({ recording: data, analysis, analysisLogId })
  } catch (error) {
    console.error('Assistant recording error:', error)
    return NextResponse.json({ error: '통화녹음 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
