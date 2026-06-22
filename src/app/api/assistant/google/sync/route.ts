import { NextRequest, NextResponse } from 'next/server'
import { getAssistantOwnerById } from '@/lib/assistantAccessServer'
import { syncAssistantCalendar } from '@/lib/assistantGoogle'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const owner = await getAssistantOwnerById(request.headers.get('x-user-id'))

    if (!owner) {
      return NextResponse.json({ error: 'yjjang 개인 비서 전용 기능입니다.' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const result = await syncAssistantCalendar(owner, {
      startDate: body.startDate,
      endDate: body.endDate
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Assistant Google sync error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Google Calendar 동기화 중 오류가 발생했습니다.',
      setupSql: 'database/alter_assistant_integrations.sql'
    }, { status: 500 })
  }
}
