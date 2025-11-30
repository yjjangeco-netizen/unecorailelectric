import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/security'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: '인증 토큰이 없습니다' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다' },
        { status: 401 }
      )
    }

    // Supabase DB에서 사용자 최신 정보 조회
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esvpnrqavaeikzhbmydz.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8'

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email || '',
      name: user.name || '',
      department: user.department || '',
      position: user.position || '',
      level: user.level,
      is_active: user.is_active,
      stock_view: user.stock_view,
      stock_in: user.stock_in,
      stock_out: user.stock_out,
      stock_disposal: user.stock_disposal,
      work_tools: user.work_tools,
      daily_log: user.daily_log,
      work_manual: user.work_manual,
      sop: user.sop,
      user_management: user.user_management,
      created_at: user.created_at,
      updated_at: user.updated_at
    }

    return NextResponse.json({ user: userResponse })
  } catch (error) {
    console.error('세션 확인 오류:', error)
    return NextResponse.json(
      { error: '세션 확인 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
