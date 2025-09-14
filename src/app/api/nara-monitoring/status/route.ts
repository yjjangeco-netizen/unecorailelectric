import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  try {
    // 모니터링 상태 확인
    const status = {
      isRunning: false,
      lastCheck: new Date().toISOString(),
      totalFound: 0,
      keywords: ['전기', '케이블', '변압기'],
      checkInterval: 30
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error('모니터링 상태 확인 오류:', error)
    return NextResponse.json(
      { error: '모니터링 상태를 확인할 수 없습니다' },
      { status: 500 }
    )
  }
}
