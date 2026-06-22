import { NextRequest, NextResponse } from 'next/server'
import { getAssistantOwnerById } from '@/lib/assistantAccessServer'
import { createAssistantDriveReport } from '@/lib/assistantGoogle'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const owner = await getAssistantOwnerById(request.headers.get('x-user-id'))

    if (!owner) {
      return NextResponse.json({ error: 'yjjang 개인 비서 전용 기능입니다.' }, { status: 403 })
    }

    const body = await request.json()
    if (!body.logId) {
      return NextResponse.json({ error: '분석 로그 ID가 필요합니다.' }, { status: 400 })
    }

    const file = await createAssistantDriveReport(owner, body.logId)
    return NextResponse.json({ file })
  } catch (error) {
    console.error('Assistant Google report error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Google Drive 리포트 저장 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
