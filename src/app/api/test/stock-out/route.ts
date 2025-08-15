import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { itemId, quantity, project, notes, isRental, issuedBy } = body

    // 입력값 검증
    if (!itemId || itemId.trim().length < 1) {
      return NextResponse.json({
        ok: false,
        error: '품목 ID가 비어있습니다'
      }, { status: 400 })
    }

    if (!quantity || quantity <= 0) {
      return NextResponse.json({
        ok: false,
        error: '수량은 0보다 커야 합니다'
      }, { status: 400 })
    }

    if (!issuedBy || issuedBy.trim().length < 1) {
      return NextResponse.json({
        ok: false,
        error: '출고자가 비어있습니다'
      }, { status: 400 })
    }

    // 테스트용 더미 응답 데이터
    const mockStockOut = {
      id: `stock-out-${Date.now()}`,
      itemId,
      quantity,
      project: project || '',
      notes: notes || '',
      isRental: isRental || false,
      issuedBy,
      issuedAt: new Date().toISOString(),
      previousQuantity: 100, // 테스트용 이전 수량
      newQuantity: 90,       // 테스트용 새로운 수량
      totalAmount: quantity * 5000 // 테스트용 단가
    }

    return NextResponse.json({
      ok: true,
      message: '출고 처리 완료 (테스트 데이터)',
      data: mockStockOut,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('출고 테스트 오류:', error)
    return NextResponse.json({
      ok: false,
      error: '출고 처리 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
}
