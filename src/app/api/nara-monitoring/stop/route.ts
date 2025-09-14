import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // TODO: 실제 모니터링 서비스 중지 로직 구현
    // - 크롤링 중지
    // - 스케줄러 정리
    // - 리소스 해제

    console.log('모니터링 중지')

    return NextResponse.json({
      success: true,
      message: '모니터링이 중지되었습니다.'
    })
  } catch (error) {
    console.error('모니터링 중지 오류:', error)
    return NextResponse.json(
      { message: '모니터링 중지에 실패했습니다.' },
      { status: 500 }
    )
  }
}