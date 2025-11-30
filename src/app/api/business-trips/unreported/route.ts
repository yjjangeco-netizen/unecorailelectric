import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabaseServer'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createApiClient()
    const cookieStore = cookies()
    const authToken = cookieStore.get('auth-token')?.value

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 토큰 디코딩
    let userId: string
    try {
      const decoded = JSON.parse(atob(authToken))
      userId = decoded.id
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 사용자 레벨 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('level')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      console.error('사용자 정보 조회 실패:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const userLevel = String(userData.level).toLowerCase()
    const isAdmin = userLevel === '5' || userLevel === 'administrator' || userLevel === 'admin'

    let query = supabase
      .from('business_trips')
      .select('*')
      .neq('report_status', 'submitted') // 보고서가 제출되지 않은 내역 조회
      .order('start_date', { ascending: false })

    // 관리자가 아니면 본인의 내역만 조회
    if (!isAdmin) {
      query = query.eq('user_id', userId)
    }

    const { data: trips, error } = await query

    if (error) {
      console.error('미보고 내역 조회 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ trips: trips || [] })
  } catch (error) {
    console.error('미보고 내역 조회 예상치 못한 오류:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
