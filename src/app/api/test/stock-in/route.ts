import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { itemName, quantity, unitPrice, notes, conditionType, reason, orderedBy, receivedBy } = body

    // 입력값 검증
    if (!itemName || itemName.trim().length < 1) {
      return NextResponse.json({
        ok: false,
        error: '품목명이 비어있습니다'
      }, { status: 400 })
    }

    if (!quantity || quantity <= 0) {
      return NextResponse.json({
        ok: false,
        error: '수량은 0보다 커야 합니다'
      }, { status: 400 })
    }

    if (!unitPrice || unitPrice <= 0) {
      return NextResponse.json({
        ok: false,
        error: '단가는 0보다 커야 합니다'
      }, { status: 400 })
    }

    // 품목 상태 검증
    if (!conditionType || !['new', 'used-new', 'used-used', 'broken'].includes(conditionType)) {
      return NextResponse.json(
        { error: '올바르지 않은 품목 상태입니다. new, used-new, used-used, broken 중에서 선택해주세요.' },
        { status: 400 }
      )
    }

    if (!reason || reason.trim().length < 1) {
      return NextResponse.json({
        ok: false,
        error: '입고 사유가 비어있습니다'
      }, { status: 400 })
    }

    if (!orderedBy || orderedBy.trim().length < 1) {
      return NextResponse.json({
        ok: false,
        error: '주문자가 비어있습니다'
      }, { status: 400 })
    }

    if (!receivedBy || receivedBy.trim().length < 1) {
      return NextResponse.json({
        ok: false,
        error: '입고자가 비어있습니다'
      }, { status: 400 })
    }

    // 테스트용 더미 응답 데이터
    const mockStockIn = {
      id: `stock-in-${Date.now()}`,
      itemName,
      quantity,
      unitPrice,
      notes: notes || '',
      conditionType,
      reason,
      orderedBy,
      receivedBy,
      receivedAt: new Date().toISOString(),
      totalAmount: quantity * unitPrice
    }

    return NextResponse.json({
      ok: true,
      message: '입고 처리 완료 (테스트 데이터)',
      data: mockStockIn,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('입고 테스트 오류:', error)
    return NextResponse.json({
      ok: false,
      error: '입고 처리 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
}
