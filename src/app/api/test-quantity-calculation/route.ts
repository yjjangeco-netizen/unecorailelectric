import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export async function POST() {
  try {
    const supabase = createServerSupabaseClient()
    
    console.log('=== 수량 계산 테스트 시작 ===')
    
    // 1. 현재 데이터 조회
    const { data: items, error: fetchError } = await supabase
      .from('items')
      .select('id, name, current_quantity, stock_in, stock_out, closing_quantity')
      .order('name')
      .limit(10)
    
    if (fetchError) {
      throw new Error(`데이터 조회 실패: ${fetchError.message}`)
    }
    
    console.log('조회된 항목 수:', items.length)
    
    // 2. 각 항목의 수량 계산 검증
    const testResults = items.map(item => {
      const calculated = (item.closing_quantity || 0) + (item.stock_in || 0) - (item.stock_out || 0)
      const isCorrect = item.current_quantity === calculated
      
      return {
        id: item.id,
        name: item.name,
        db_current_quantity: item.current_quantity,
        calculated_current_quantity: calculated,
        closing_quantity: item.closing_quantity || 0,
        stock_in: item.stock_in || 0,
        stock_out: item.stock_out || 0,
        isCorrect,
        difference: item.current_quantity - calculated
      }
    })
    
    // 3. 통계 계산
    const correctCount = testResults.filter(r => r.isCorrect).length
    const incorrectCount = testResults.filter(r => !r.isCorrect).length
    
    console.log('=== 수량 계산 테스트 결과 ===')
    console.log(`총 항목: ${items.length}`)
    console.log(`올바른 항목: ${correctCount}`)
    console.log(`잘못된 항목: ${incorrectCount}`)
    
    // 4. 잘못된 항목들 나열
    const incorrectItems = testResults.filter(r => !r.isCorrect)
    if (incorrectItems.length > 0) {
      console.log('잘못된 항목들:')
      incorrectItems.forEach(item => {
        console.log(`- ${item.name}: DB=${item.db_current_quantity}, 계산=${item.calculated_current_quantity}, 차이=${item.difference}`)
      })
    }
    
    return NextResponse.json({
      success: true,
      message: '수량 계산 테스트 완료',
      totalItems: items.length,
      correctCount,
      incorrectCount,
      testResults,
      incorrectItems: incorrectItems.map(item => ({
        name: item.name,
        dbQuantity: item.db_current_quantity,
        calculatedQuantity: item.calculated_current_quantity,
        difference: item.difference
      }))
    })
    
  } catch (error) {
    console.error('수량 계산 테스트 오류:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}
