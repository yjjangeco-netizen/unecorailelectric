import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  try {
    console.log('=== 재고 수정 API 호출됨 ===')
    
    // 요청 데이터 파싱
    const body = await request.json()
    console.log('요청 데이터:', body)
    
    const { itemId, ...updateData } = body
    
    if (!itemId) {
      return NextResponse.json({ 
        error: '필수 필드가 누락되었습니다. (itemId)' 
      }, { status: 400 })
    }

    console.log('수정할 itemId:', itemId)
    console.log('수정할 데이터:', updateData)

    // Supabase DB 업데이트
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('items')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single()

    if (error) {
      console.error('DB 업데이트 오류:', error)
      return NextResponse.json({ 
        error: '재고 수정 중 오류가 발생했습니다.',
        details: error.message
      }, { status: 500 })
    }

    console.log('✅ DB 업데이트 성공:', data)

    return NextResponse.json({ 
      success: true,
      message: '재고 품목이 성공적으로 수정되었습니다.',
      updatedItem: data
    })

  } catch (error) {
    console.error('재고 수정 API 오류:', error)
    return NextResponse.json({ 
      error: '재고 수정 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}
