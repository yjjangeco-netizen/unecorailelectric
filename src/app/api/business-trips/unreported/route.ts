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

    // 전체 조회 후 JS에서 필터링
    // ⚠️ Supabase .neq() / .or()은 NULL 처리가 불안정하므로 JS 레벨에서 필터링
    let query = supabase
      .from('business_trips')
      .select('*')
      .order('start_date', { ascending: false })

    // 관리자가 아니면 본인의 내역만 조회
    if (!isAdmin && finalUserId) {
      query = query.eq('user_id', finalUserId)
    }

    const { data: allTrips, error } = await query

    if (error) {
      console.error('미보고 내역 조회 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // submitted / approved 가 아닌 모든 항목 (NULL, 'pending', 'rejected', 기타 포함)
    const trips = (allTrips || []).filter(
      t => t.report_status !== 'submitted' && t.report_status !== 'approved'
    )

    console.log(`[unreported] 전체: ${allTrips?.length}건, 미보고: ${trips.length}건 (isAdmin: ${isAdmin})`)

    return NextResponse.json({ trips })
  } catch (error) {
    console.error('미보고 내역 조회 예상치 못한 오류:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
