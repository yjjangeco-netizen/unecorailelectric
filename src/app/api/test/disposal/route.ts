import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { itemId, quantity, reason, notes, disposedBy } = body

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

    if (!reason || reason.trim().length < 1) {
      return NextResponse.json({
        ok: false,
        error: '폐기 사유가 비어있습니다'
      }, { status: 400 })
    }

    if (!disposedBy || disposedBy.trim().length < 1) {
      return NextResponse.json({
        ok: false,
        error: '폐기자가 비어있습니다'
      }, { status: 400 })
    }

    // 테스트용 더미 응답 데이터
    const mockDisposal = {
      id: `disposal-${Date.now()}`,
      itemId,
      quantity,
      reason,
      notes: notes || '',
      disposedBy,
      disposedAt: new Date().toISOString(),
      previousQuantity: 100, // 테스트용 이전 수량
      newQuantity: 95,       // 테스트용 새로운 수량
      totalAmount: quantity * 5000 // 테스트용 단가
    }

    return NextResponse.json({
      ok: true,
      message: '폐기 처리 완료 (테스트 데이터)',
      data: mockDisposal,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('폐기 테스트 오류:', error)
    return NextResponse.json({
      ok: false,
      error: '폐기 처리 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
}
