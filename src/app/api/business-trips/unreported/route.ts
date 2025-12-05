import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabaseServer'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createApiClient()
    
    // 헤더에서 사용자 정보 가져오기
    const userLevel = request.headers.get('x-user-level') || '1'
    const userId = request.headers.get('x-user-id') || ''
    
    // 쿠키에서도 시도
    let cookieUserId = ''
    let cookieUserLevel = '1'
    try {
      const cookieStore = cookies()
      const authToken = cookieStore.get('auth-token')?.value
      if (authToken) {
        const decoded = JSON.parse(atob(authToken))
        cookieUserId = decoded.id || ''
        cookieUserLevel = decoded.level || '1'
      }
    } catch (e) {
      console.log('쿠키 파싱 실패, 헤더 사용')
    }

    const finalUserId = userId || cookieUserId
    const finalUserLevel = userLevel || cookieUserLevel
    const isAdmin = finalUserLevel === '5' || finalUserLevel.toLowerCase() === 'administrator' || finalUserLevel.toLowerCase() === 'admin'

    let query = supabase
      .from('business_trips')
      .select('*')
      .neq('report_status', 'submitted') // 보고서가 제출되지 않은 내역 조회
      .neq('report_status', 'approved') // 승인된 내역도 제외
      .order('start_date', { ascending: false })

    // 관리자가 아니면 본인의 내역만 조회
    if (!isAdmin && finalUserId) {
      query = query.eq('user_id', finalUserId)
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
