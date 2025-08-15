import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { validateStockIn } from '@/lib/schemas'
import { logError } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // 요청 본문 파싱
    const body = await request.json()
    
    // 입력 데이터 검증
    const validatedData = validateStockIn(body)
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 트랜잭션 시작
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('*')
      .eq('name', validatedData.itemName)
      .single()

    if (itemError && itemError.code !== 'PGRST116') {
      throw new Error(`품목 조회 오류: ${itemError.message}`)
    }

    let itemId: string
    let currentQuantity: number

    if (item) {
      // 기존 품목 업데이트
      itemId = item.id
      currentQuantity = item.current_quantity || 0
      
      const { error: updateError } = await supabase
        .from('items')
        .update({
          current_quantity: currentQuantity + validatedData.quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)

      if (updateError) {
        throw new Error(`품목 업데이트 오류: ${updateError.message}`)
      }
    } else {
      // 새 품목 생성
      const { data: newItem, error: createError } = await supabase
        .from('items')
        .insert({
          name: validatedData.itemName,
          specification: validatedData.itemName,
          maker: '미정',
          unit_price: validatedData.unitPrice,
          purpose: '재고입고',
          min_stock: 0,
          category: '일반',
          description: validatedData.notes || '',
          current_quantity: validatedData.quantity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        throw new Error(`품목 생성 오류: ${createError.message}`)
      }

      itemId = newItem.id
      currentQuantity = validatedData.quantity
    }

    // 입고 이력 생성
    const { error: historyError } = await supabase
      .from('stock_in')
      .insert({
        item_id: itemId,
        quantity: validatedData.quantity,
        unit_price: validatedData.unitPrice,
        condition_type: validatedData.conditionType,
        reason: validatedData.reason,
        ordered_by: validatedData.orderedBy,
        received_by: user.email || user.id,
        received_at: new Date().toISOString()
      })

    if (historyError) {
      throw new Error(`입고 이력 생성 오류: ${historyError.message}`)
    }

    // 현재 재고 업데이트
    const { error: stockError } = await supabase
      .from('current_stock')
      .upsert({
        id: itemId,
        name: validatedData.itemName,
        specification: validatedData.itemName,
        unit_price: validatedData.unitPrice,
        current_quantity: currentQuantity,
        total_amount: validatedData.unitPrice * currentQuantity,
        notes: validatedData.notes || '',
        category: '일반',
        stock_status: currentQuantity > 0 ? 'normal' : 'low_stock',
        updated_at: new Date().toISOString()
      })

    if (stockError) {
      throw new Error(`재고 업데이트 오류: ${stockError.message}`)
    }

    return NextResponse.json({
      ok: true,
      data: {
        itemId,
        itemName: validatedData.itemName,
        quantity: validatedData.quantity,
        currentQuantity,
        message: `${validatedData.itemName} 입고 완료 (수량: ${validatedData.quantity}개)`
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logError('입고 API 오류', error, { body: await request.text() })
    
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : '입고 처리 중 오류가 발생했습니다',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// GET 요청 처리 (입고 이력 조회)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // URL 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const itemId = searchParams.get('itemId')

    // 쿼리 구성
    let query = supabase
      .from('stock_in')
      .select(`
        *,
        items(name, specification, maker)
      `)
      .order('received_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (itemId) {
      query = query.eq('item_id', itemId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`입고 이력 조회 오류: ${error.message}`)
    }

    return NextResponse.json({
      ok: true,
      data,
      pagination: {
        limit,
        offset,
        total: data.length
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logError('입고 이력 조회 API 오류', error)
    
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : '입고 이력 조회 중 오류가 발생했습니다',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
