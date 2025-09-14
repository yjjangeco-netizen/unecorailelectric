import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { keywords, telegramEnabled, telegramChatId, checkInterval } = body

    // 모니터링 설정 검증
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { message: '키워드가 필요합니다.' },
        { status: 400 }
      )
    }

    if (telegramEnabled && !telegramChatId) {
      return NextResponse.json(
        { message: '텔레그램 채팅 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // TODO: 실제 모니터링 서비스 시작 로직 구현
    // - 키워드 기반 크롤링 시작
    // - 텔레그램 봇 설정
    // - 주기적 확인 스케줄링

    console.log('모니터링 시작:', {
      keywords,
      telegramEnabled,
      telegramChatId,
      checkInterval
    })

    return NextResponse.json({
      success: true,
      message: '모니터링이 시작되었습니다.',
      config: {
        keywords,
        telegramEnabled,
        telegramChatId,
        checkInterval
      }
    })
  } catch (error) {
    console.error('모니터링 시작 오류:', error)
    return NextResponse.json(
      { message: '모니터링 시작에 실패했습니다.' },
      { status: 500 }
    )
  }
}