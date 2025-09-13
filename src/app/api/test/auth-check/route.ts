import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('=== 인증 확인 API 호출됨 ===')
    
    // 임시로 성공 응답 (데이터베이스 연결 없이)
    return NextResponse.json({ 
      authenticated: true,
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        profile: {
          username: 'testuser',
          name: '테스트 사용자',
          level: 'admin'
        }
      }
    })

  } catch (error) {
    console.error('인증 확인 API 오류:', error)
    return NextResponse.json({ 
      authenticated: false,
      error: '인증 확인 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}
