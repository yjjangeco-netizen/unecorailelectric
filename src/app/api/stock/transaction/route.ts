import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('=== 재고 트랜잭션 API 호출됨 ===')
    
    // 요청 데이터 파싱
    const body = await request.json()
    console.log('요청 데이터:', body)
    
    const { type, itemId, quantity, userId, reason, note } = body
    
    // 필수 필드 검증
    if (!type || !itemId || !quantity) {
      return NextResponse.json({ 
        error: '필수 필드가 누락되었습니다. (type, itemId, quantity)' 
      }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    
    // 현재 재고 조회
    const { data: currentItem, error: fetchError } = await supabase
      .from('items')
      .select('id, item_name, current_quantity, stock_in, stock_out')
      .eq('id', itemId)
      .single()

    if (fetchError || !currentItem) {
      console.error('품목 조회 오류:', fetchError)
      return NextResponse.json({ 
        error: '품목을 찾을 수 없습니다.',
        details: fetchError?.message
      }, { status: 404 })
    }

    // 트랜잭션 유형에 따라 처리
    let newCurrentQuantity = currentItem.current_quantity || 0
    let newStockIn = currentItem.stock_in || 0
    let newStockOut = currentItem.stock_out || 0

    if (type === 'in' || type === '입고') {
      newCurrentQuantity += quantity
      newStockIn += quantity
    } else if (type === 'out' || type === '출고') {
      if (newCurrentQuantity < quantity) {
        return NextResponse.json({ 
          error: '재고가 부족합니다.',
          currentQuantity: newCurrentQuantity,
          requestedQuantity: quantity
        }, { status: 400 })
      }
      newCurrentQuantity -= quantity
      newStockOut += quantity
    } else {
      return NextResponse.json({ 
        error: '유효하지 않은 트랜잭션 유형입니다. (in/out 또는 입고/출고)' 
      }, { status: 400 })
    }

    // DB 업데이트
    const { data: updatedItem, error: updateError } = await supabase
      .from('items')
      .update({
        current_quantity: newCurrentQuantity,
        stock_in: newStockIn,
        stock_out: newStockOut,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single()

    if (updateError) {
      console.error('DB 업데이트 오류:', updateError)
      return NextResponse.json({ 
        error: '재고 업데이트 중 오류가 발생했습니다.',
        details: updateError.message
      }, { status: 500 })
    }

    console.log('✅ 재고 트랜잭션 성공:', updatedItem)

    return NextResponse.json({ 
      success: true,
      message: `재고 ${type === 'in' || type === '입고' ? '입고' : '출고'}가 성공적으로 처리되었습니다.`,
      data: {
        itemId: updatedItem.id,
        itemName: updatedItem.item_name,
        transactionType: type,
        quantity,
        previousQuantity: currentItem.current_quantity,
        newQuantity: updatedItem.current_quantity
      }
    })

  } catch (error) {
    console.error('재고 트랜잭션 API 오류:', error)
    return NextResponse.json({ 
      error: '재고 트랜잭션 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}
