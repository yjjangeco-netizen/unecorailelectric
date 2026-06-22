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
    
    // syncAssistantCalendar 내부에서 pull + 스마트 분류 + push가 모두 수행됩니다.
    const result = await syncAssistantCalendar(owner, {
      startDate: body.startDate,
      endDate: body.endDate
    })

    return NextResponse.json({
      success: true,
      message: '스마트 분류 및 동기화가 완료되었습니다.',
      data: result
    })
  } catch (error) {
    console.error('Assistant Google pull-classify error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : '스마트 분류 동기화 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
