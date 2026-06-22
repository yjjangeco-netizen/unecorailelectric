import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { getApiUser } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // 요청 데이터 파싱
    const { closingDate } = await request.json()
    if (!closingDate) {
      return NextResponse.json({ error: '마감 기준일이 필요합니다.' }, { status: 400 })
    }

    // 인증/관리자 확인 — 커스텀 JWT 기반 (이 앱은 Supabase Auth 미사용)
    const apiUser = getApiUser(request)
    if (!apiUser) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 토큰의 level 을 그대로 믿지 않고 DB에서 현재 권한을 재확인(파괴적 작업)
    const { data: userData } = await supabase
      .from('users')
      .select('level, username, name')
      .eq('id', apiUser.userId)
      .single()

    const level = String(userData?.level ?? '').toLowerCase()
    const isAdmin =
      userData?.username === 'admin' ||
      level === 'admin' ||
      level === 'administrator' ||
      level === '5'

    if (!isAdmin) {
      console.warn('Admin check failed for closing process', apiUser.userId)
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    // 날짜 유효성 검사
    const selectedDate = new Date(closingDate)
    const today = new Date()
    if (selectedDate > today) {
      return NextResponse.json({ error: '마감 기준일은 오늘 이전이어야 합니다.' }, { status: 400 })
    }

    // 1. 현재 재고 데이터 조회
    const { data: currentStockData, error: stockError } = await supabase
      .from('items')
      .select('*')

    if (stockError) {
      console.error('재고 데이터 조회 실패:', stockError)
      return NextResponse.json({ error: '재고 데이터 조회 실패' }, { status: 500 })
    }

    if (!currentStockData || currentStockData.length === 0) {
      return NextResponse.json({ error: '마감할 재고가 없습니다.' }, { status: 400 })
    }

    // 2. 마감 이력 저장 (closing_history 테이블은 database/create_closing_history.sql 로 사전 생성)
    const closedBy = userData?.name || userData?.username || apiUser.username || 'system'
    const closingHistoryData = currentStockData.map(item => ({
      closing_date: closingDate,
      item_id: item.id, // items 테이블의 id 사용
      product: item.product || item.name,
      spec: item.spec || item.specification,
      maker: item.maker || item.supplier,
      location: item.location || '',
      closing_quantity: item.current_quantity || 0,
      unit_price: item.unit_price || 0,
      total_amount: (item.current_quantity || 0) * (item.unit_price || 0),
      closed_by: closedBy,
      created_at: new Date().toISOString()
    }))

    const { error: historyError } = await supabase
      .from('closing_history')
      .insert(closingHistoryData)

    if (historyError) {
      console.error('마감 이력 저장 실패:', historyError)
      return NextResponse.json({ error: '마감 이력 저장 실패: ' + historyError.message }, { status: 500 })
    }

    // 4. 현재 재고 테이블 업데이트: 마감수량 설정, 입고/출고 0으로 초기화
    const updatePromises = currentStockData.map(item =>
      supabase
        .from('items')
        .update({
          closing_quantity: item.current_quantity || 0,
          stock_in: 0, // 입고 수량 0으로 초기화
          stock_out: 0, // 출고 수량 0으로 초기화
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id)
    )

    const updateResults = await Promise.all(updatePromises)
    const updateErrors = updateResults.filter(result => result.error)

    if (updateErrors.length > 0) {
      console.error('재고 업데이트 중 오류:', updateErrors)
      return NextResponse.json({ error: '재고 업데이트 중 오류가 발생했습니다.' }, { status: 500 })
    }

    // 5. 마감 완료 로그
    console.log('마감 처리 완료:', {
      closingDate,
      processedItems: currentStockData.length,
      totalQuantity: currentStockData.reduce((sum, item) => sum + (item.current_quantity || 0), 0),
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: '마감이 완료되었습니다.',
      data: {
        closingDate,
        processedItems: currentStockData.length,
        totalQuantity: currentStockData.reduce((sum, item) => sum + (item.current_quantity || 0), 0),
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('마감 처리 오류:', error)
    return NextResponse.json(
      {
        error: '마감 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}
