import { NextRequest, NextResponse } from 'next/server'

export async function POST(_request: NextRequest) {
  try {
    console.log('모니터링 중지 요청')

    // 모니터링 중지 로직
    const result = {
      success: true,
      message: '모니터링이 중지되었습니다',
      stoppedAt: new Date().toISOString()
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('모니터링 중지 오류:', error)
    return NextResponse.json(
      { error: '모니터링을 중지할 수 없습니다' },
      { status: 500 }
    )
  }
}
