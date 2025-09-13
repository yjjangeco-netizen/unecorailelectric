import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export async function POST() {
  try {
      const supabase = createServerSupabaseClient()
    
    // 테스트용 품목 데이터 생성
    const testItems = [
      {
        id: 'test_item_1',
        product: '전기 케이블 3C 2.5sq',
        spec: '3C 2.5sq',
        maker: 'LS전선',
        unit_price: 2500,
        purpose: '전기 배선',
        min_stock: 100,
        category: '전기자재',
        note: '테스트용 전기 케이블',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'test_item_2',
        product: '배선용 차단기 20A',
        spec: '20A 1P',
        maker: 'LS산전',
        unit_price: 15000,
        purpose: '전기 보호',
        min_stock: 50,
        category: '전기자재',
        note: '테스트용 차단기',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'test_item_3',
        product: 'LED 조명 20W',
        spec: '20W 220V',
        maker: '삼성전자',
        unit_price: 8000,
        purpose: '조명',
        min_stock: 200,
        category: '조명',
        note: '테스트용 LED 조명',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    // 테스트용 현재 재고 데이터 생성
    const testCurrentStock = [
      {
        id: 'test_stock_1',
        product: '전기 케이블 3C 2.5sq',
        spec: '3C 2.5sq',
        unit_price: 2500,
        current_quantity: 500,
        total_amount: 1250000,
        note: '테스트 재고',
        category: '전기자재',
        stock_status: 'new'
      },
      {
        id: 'test_stock_2',
        product: '배선용 차단기 20A',
        spec: '20A 1P',
        unit_price: 15000,
        current_quantity: 100,
        total_amount: 1500000,
        note: '테스트 재고',
        category: '전기자재',
        stock_status: 'new'
      },
      {
        id: 'test_stock_3',
        product: 'LED 조명 20W',
        spec: '20W 220V',
        unit_price: 8000,
        current_quantity: 300,
        total_amount: 2400000,
        note: '테스트 재고',
        category: '조명',
        stock_status: 'new'
      }
    ]

    // 데이터베이스에 테스트 데이터 삽입
    let itemsCreated = 0
    let stockCreated = 0

    // 품목 데이터 삽입
    for (const item of testItems) {
      const { error } = await supabase
        .from('items')
        .upsert(item, { onConflict: 'id' })
      
      if (!error) {
        itemsCreated++
      }
    }

    // 현재 재고 데이터 삽입
    for (const stock of testCurrentStock) {
      const { error } = await supabase
        .from('items')
        .upsert(stock, { onConflict: 'id' })
      
      if (!error) {
        stockCreated++
      }
    }

    return NextResponse.json({
      ok: true,
      message: '테스트 데이터 생성 완료',
      data: {
        itemsCreated,
        stockCreated,
        totalItems: testItems.length,
        totalStock: testCurrentStock.length
      }
    })

  } catch (error) {
    console.error('테스트 데이터 생성 오류:', error)
    return NextResponse.json({
      ok: false,
      error: '테스트 데이터 생성 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
}

export async function DELETE() {
  try {
      const supabase = createServerSupabaseClient()
    
    // 테스트 데이터 삭제
    const { error: itemsError } = await supabase
      .from('items')
      .delete()
      .like('id', 'test_%')
    
    const { error: stockError } = await supabase
      .from('items')
      .delete()
      .like('id', 'test_%')

    if (itemsError || stockError) {
      throw new Error('테스트 데이터 삭제 중 오류 발생')
    }

    return NextResponse.json({
      ok: true,
      message: '테스트 데이터 초기화 완료'
    })

  } catch (error) {
    console.error('테스트 데이터 초기화 오류:', error)
    return NextResponse.json({
      ok: false,
      error: '테스트 데이터 초기화 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
}
