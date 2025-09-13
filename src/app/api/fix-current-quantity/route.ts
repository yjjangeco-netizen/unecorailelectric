import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export async function POST() {
  try {
    const supabase = createServerSupabaseClient()
    
    console.log('=== current_quantity 수정 시작 ===')
    
    // 1. 현재 데이터 조회
    const { data: items, error: fetchError } = await supabase
      .from('items')
      .select('id, name, current_quantity, stock_in, stock_out, closing_quantity')
      .order('name')
    
    if (fetchError) {
      throw new Error(`데이터 조회 실패: ${fetchError.message}`)
    }
    
    console.log('조회된 항목 수:', items.length)
    
    // 2. 잘못된 항목들 찾기
    const incorrectItems = items.filter(item => {
      const calculated = (item.closing_quantity || 0) + (item.stock_in || 0) - (item.stock_out || 0)
      return item.current_quantity !== calculated
    })
    
    console.log('잘못된 항목 수:', incorrectItems.length)
    
    if (incorrectItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: '모든 데이터가 올바릅니다!',
        fixedCount: 0
      })
    }
    
    // 3. 수정 실행
    let fixedCount = 0
    for (const item of incorrectItems) {
      const calculated = (item.closing_quantity || 0) + (item.stock_in || 0) - (item.stock_out || 0)
      
      const { error: updateError } = await supabase
        .from('items')
        .update({ 
          current_quantity: calculated,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id)
      
      if (updateError) {
        console.error(`품목 ${item.name} 수정 실패:`, updateError.message)
      } else {
        console.log(`품목 ${item.name}: ${item.current_quantity} → ${calculated}`)
        fixedCount++
      }
    }
    
    console.log('=== current_quantity 수정 완료 ===')
    
    return NextResponse.json({
      success: true,
      message: `${fixedCount}개 항목의 current_quantity를 수정했습니다.`,
      fixedCount,
      totalItems: items.length,
      incorrectItems: incorrectItems.length
    })
    
  } catch (error) {
    console.error('current_quantity 수정 오류:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        fixedCount: 0
      },
      { status: 500 }
    )
  }
}
