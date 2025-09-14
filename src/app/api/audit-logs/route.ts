import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
    )

    const { searchParams } = request.nextUrl
    const action = searchParams.get('action')
    const itemId = searchParams.get('item_id')
    const userId = searchParams.get('user_id')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 기본 쿼리 구성
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    // 필터 적용
    if (action) {
      query = query.eq('action', action)
    }
    if (itemId) {
      query = query.contains('details', { item_id: itemId })
    }
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: logs, error } = await query

    if (error) {
      console.error('로그 조회 오류:', error)
      return NextResponse.json({ error: '로그 조회 실패' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        limit,
        offset,
        total: logs?.length || 0
      }
    })

  } catch (error) {
    console.error('로그 조회 오류:', error)
    return NextResponse.json(
      { 
        error: '로그 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      }, 
      { status: 500 }
    )
  }
}
