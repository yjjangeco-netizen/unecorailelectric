import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = createServerSupabaseClient()

    // items 테이블과 조인하여 필요한 정보 조회
    let query = supabase
      .from('stock_history')
      .select(`
        *,
        items (
          name,
          location,
          specification
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setDate(end.getDate() + 1)
      query = query.lt('created_at', end.toISOString())
    }
    if (type && type !== 'all') {
      // DB에는 'IN', 'OUT' 대문자로 저장되어 있을 수 있음
      query = query.ilike('event_type', type)
    }
    
    // 검색 기능: items 테이블의 컬럼으로 검색해야 하므로 복잡함.
    // Supabase에서 조인된 테이블 컬럼으로 OR 검색은 까다로울 수 있음.
    // 일단 간단한 검색만 지원하거나, 검색 로직을 보완해야 함.
    if (search) {
      // items.name 검색은 !inner 조인이 필요할 수 있음.
      // 여기서는 간단히 stock_history의 필드만 검색하거나, 
      // 클라이언트 측 필터링을 고려해야 할 수도 있지만, 일단 items.name 검색 시도
      // query = query.or(`items.name.ilike.%${search}%`) // 이건 동작 안 할 수 있음
    }

    const { data, count, error } = await query

    if (error) {
      console.error('Error fetching stock history:', error)
      if (error.code === '42P01') { 
         return NextResponse.json({ history: [], total: 0 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 데이터 매핑: 프론트엔드가 기대하는 형식으로 변환
    const mappedHistory = data?.map((item: any) => ({
      id: item.id,
      item_name: item.items?.name || 'Unknown Item',
      type: item.event_type?.toLowerCase() || 'unknown', // IN -> in
      quantity: item.quantity,
      previous_quantity: 0, // DB에 없으면 0 처리
      new_quantity: 0, // DB에 없으면 0 처리
      reason: item.reason || item.notes || '',
      note: item.notes || '',
      location: item.items?.location || 'Unknown Location',
      user_level: item.received_by || 'Unknown', // received_by를 user_level 대신 표시
      created_at: item.created_at || item.event_date
    })) || []

    // 검색어 필터링 (조인된 컬럼 검색이 쿼리 레벨에서 어려울 경우 메모리 필터링)
    let finalHistory = mappedHistory
    if (search) {
      const lowerSearch = search.toLowerCase()
      finalHistory = finalHistory.filter((item: any) => 
        item.item_name.toLowerCase().includes(lowerSearch) ||
        item.location.toLowerCase().includes(lowerSearch) ||
        item.reason.toLowerCase().includes(lowerSearch)
      )
    }

    return NextResponse.json({
      history: finalHistory,
      total: count || 0
    })

  } catch (error) {
    console.error('Exception in stock history API:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const ids = searchParams.get('ids')?.split(',')

    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    const { error } = await supabase
      .from('stock_history')
      .delete()
      .in('id', ids)

    if (error) {
      console.error('Error deleting stock history:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Exception in stock history DELETE API:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
