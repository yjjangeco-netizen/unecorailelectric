import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest) {
  try {
    console.log('=== 재고 삭제 API 호출됨 ===')
    
    // 헤더에서 사용자 정보 확인
    const userId = request.headers.get('x-user-id')
    const userLevel = request.headers.get('x-user-level')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: 인증이 필요합니다.' }, { status: 401 })
    }

    // 권한 확인: Level 5 또는 Admin만 삭제 가능
    const isLevel5 = userLevel === '5'
    const isAdmin = userLevel === 'administrator' || userLevel === 'Administrator' || userId === 'admin'

    if (!isLevel5 && !isAdmin) {
      console.log('재고 삭제 권한 없음:', { userId, userLevel })
      return NextResponse.json({ 
        error: 'Forbidden: Level 5 또는 관리자만 재고를 삭제할 수 있습니다.' 
      }, { status: 403 })
    }
    
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

    const supabase = createServerSupabaseClient()
    
    // 재고 존재 확인
    const { data: item, error: fetchError } = await supabase
      .from('items')
      .select('id, item_name')
      .eq('id', itemId)
      .single()

    if (fetchError || !item) {
      console.error('재고 조회 오류:', fetchError)
      return NextResponse.json({ 
        error: '재고 품목을 찾을 수 없습니다.',
        details: fetchError?.message
      }, { status: 404 })
    }

    // 삭제 실행
    const { error: deleteError } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId)

    if (deleteError) {
      console.error('재고 삭제 오류:', deleteError)
      return NextResponse.json({ 
        error: '재고 삭제 중 오류가 발생했습니다.',
        details: deleteError.message
      }, { status: 500 })
    }

    console.log('✅ 재고 삭제 성공:', item)

    return NextResponse.json({ 
      success: true,
      message: '재고 품목이 성공적으로 삭제되었습니다.',
      deletedItem: {
        id: item.id,
        name: item.item_name
      }
    })

  } catch (error) {
    console.error('재고 삭제 API 오류:', error)
    return NextResponse.json({ 
      error: '재고 삭제 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}
