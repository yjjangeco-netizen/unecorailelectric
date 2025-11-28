import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // 요청 데이터 파싱
    const { closingDate } = await request.json()
    if (!closingDate) {
      return NextResponse.json({ error: '마감 기준일이 필요합니다.' }, { status: 400 })
    }

    // Auth check
    const { data: { session } } = await supabase.auth.getSession()

    // 관리자 권한 확인
    let isAdmin = false
    if (session?.user?.id) {
      const { data: userData } = await supabase
        .from('users')
        .select('level, role')
        .eq('id', session.user.id)
        .single()

      if (userData && (userData.level === 'admin' || userData.role === 'admin' || userData.level === 5)) {
        isAdmin = true
      }
    }

    if (!isAdmin) {
      console.warn('Admin check failed for closing process', session?.user?.id)
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

    // 2. 마감 이력 테이블 생성 (없는 경우)
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS closing_history (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        closing_date DATE NOT NULL,
        item_id INTEGER NOT NULL,
        product TEXT NOT NULL,
        spec TEXT,
        maker TEXT,
        location TEXT,
        closing_quantity INTEGER DEFAULT 0,
        unit_price DECIMAL(15,2) DEFAULT 0,
        total_amount DECIMAL(18,2) DEFAULT 0,
        closed_by TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_closing_history_date ON closing_history(closing_date);
      CREATE INDEX IF NOT EXISTS idx_closing_history_item ON closing_history(item_id);
    `

    try {
      const { error: createTableError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
      if (createTableError) {
        console.warn('마감 이력 테이블 생성 실패 (RPC exec_sql 없음 또는 권한 부족):', createTableError)
      }
    } catch (e) {
      console.warn('RPC exec_sql 호출 중 예외 발생:', e)
    }

    // 3. 마감 이력에 현재 상태 저장
    const closedBy = session?.user?.email || 'system'
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
