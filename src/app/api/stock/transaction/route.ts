import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('=== 재고 트랜잭션 API 호출됨 ===')
    
    // 요청 데이터 파싱
    const body = await request.json()
    console.log('요청 데이터:', body)
    
    // 임시로 성공 응답 (데이터베이스 연결 없이)
    return NextResponse.json({ 
      success: true,
      message: '재고 트랜잭션이 성공적으로 처리되었습니다.',
      data: body
    })

  } catch (error) {
    console.error('재고 트랜잭션 API 오류:', error)
    return NextResponse.json({ 
      error: '재고 트랜잭션 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}
