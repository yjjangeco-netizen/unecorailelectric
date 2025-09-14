import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { keywords, telegramEnabled, telegramChatId, checkInterval } = body

    console.log('모니터링 시작 요청:', {
      keywords,
      telegramEnabled,
      telegramChatId,
      checkInterval
    })

    // 모니터링 시작 로직 (실제로는 백그라운드 작업으로 구현)
    const result = {
      success: true,
      message: '모니터링이 시작되었습니다',
      config: {
        keywords,
        telegramEnabled,
        telegramChatId,
        checkInterval
      },
      startedAt: new Date().toISOString()
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('모니터링 시작 오류:', error)
    return NextResponse.json(
      { error: '모니터링을 시작할 수 없습니다' },
      { status: 500 }
    )
  }
}
