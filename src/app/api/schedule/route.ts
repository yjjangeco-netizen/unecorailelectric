import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const supabase = createApiClient()
    
    // 일정 데이터 조회 (현재는 빈 배열 반환)
    // 실제로는 calendar_events 테이블이나 다른 일정 테이블에서 조회해야 함
    const events = []
    
    return NextResponse.json(events)
    
  } catch (error) {
    console.error('일정 조회 오류:', error)
    return NextResponse.json({ error: '일정 조회 실패' }, { status: 500 })
  }
}