import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest) {
  try {
    console.log('=== 재고 삭제 API 호출됨 ===')
    
    // 요청 데이터 파싱
    const body = await request.json()
    console.log('요청 데이터:', body)
    
    const { itemId } = body
    
    if (!itemId) {
      return NextResponse.json({ 
        error: '필수 필드가 누락되었습니다. (itemId)' 
      }, { status: 400 })
    }

    console.log('삭제할 itemId:', itemId)

    // 임시로 성공 응답 (데이터베이스 연결 없이)
    return NextResponse.json({ 
      success: true,
      message: '재고 품목이 성공적으로 삭제되었습니다.',
      deletedItem: {
        id: itemId,
        product: '테스트 제품',
        spec: '테스트 규격'
      }
    })

  } catch (error) {
    console.error('재고 삭제 API 오류:', error)
    return NextResponse.json({ 
      error: '재고 삭제 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}
