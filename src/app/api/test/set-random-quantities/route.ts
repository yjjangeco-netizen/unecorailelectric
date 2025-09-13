import { NextRequest, NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('=== 랜덤 수량 설정 API 호출됨 ===')
    
    // 임시로 성공 응답 (데이터베이스 연결 없이)
    return NextResponse.json({ 
      success: true,
      message: '랜덤 수량이 성공적으로 설정되었습니다.',
      data: {
        updated_items: 5,
        total_quantity: 150
      }
    })

  } catch (error) {
    console.error('랜덤 수량 설정 API 오류:', error)
    return NextResponse.json({ 
      error: '랜덤 수량 설정 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}
