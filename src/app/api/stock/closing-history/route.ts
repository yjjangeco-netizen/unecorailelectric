import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { getApiUser, type ApiUser } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

function isAdminUser(user: ApiUser) {
  const level = String(user.level ?? '').toLowerCase()
  return user.username === 'admin' || level === 'admin' || level === 'administrator' || level === '5'
}

export async function GET(request: NextRequest) {
  try {
    // 로그인 사용자만 조회 가능 (재고 마감 데이터 노출 방지)
    if (!getApiUser(request)) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const date = searchParams.get('date')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseServer
      .from('closing_history')
      .select('*')
      .order('closing_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 특정 날짜 필터링
    if (date) {
      query = query.eq('closing_date', date)
    }

    const { data: history, error } = await query

    if (error) {
      console.error('마감 이력 조회 오류:', error)
      return NextResponse.json(
        { error: '마감 이력을 가져오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    // 총 개수 조회
    let countQuery = supabaseServer
      .from('closing_history')
      .select('*', { count: 'exact', head: true })

    if (date) {
      countQuery = countQuery.eq('closing_date', date)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('마감 이력 개수 조회 오류:', countError)
    }

    return NextResponse.json({
      history: history || [],
      total: count || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('마감 이력 조회 오류:', error)
    return NextResponse.json(
      { error: '마감 이력을 가져오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // 마감 이력 기록(쓰기)은 관리자만
    const apiUser = getApiUser(request)
    if (!apiUser) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }
    if (!isAdminUser(apiUser)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { closingDate, itemId, product, spec, maker, location, closingQuantity, unitPrice, closedBy } = await request.json()

    // 마감 이력 저장
    const { data, error } = await supabaseServer
      .from('closing_history')
      .insert({
        closing_date: closingDate,
        item_id: itemId,
        product,
        spec,
        maker,
        location,
        closing_quantity: closingQuantity,
        unit_price: unitPrice,
        total_amount: closingQuantity * unitPrice,
        closed_by: closedBy,
        created_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('마감 이력 저장 오류:', error)
      return NextResponse.json(
        { error: '마감 이력 저장에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '마감 이력이 저장되었습니다.',
      data: data[0]
    })
  } catch (error) {
    console.error('마감 이력 저장 오류:', error)
    return NextResponse.json(
      { error: '마감 이력 저장에 실패했습니다.' },
      { status: 500 }
    )
  }
}
