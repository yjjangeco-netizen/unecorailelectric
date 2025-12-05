import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    console.log('=== 사용자 목록 확인 ===')
    
    const supabase = supabaseServer

    // 사용자 목록 조회 (비밀번호 제외)
    const { data, error } = await supabase
      .from('users')
      .select('id, username, name, level, department, position')
      .order('username')

    if (error) {
      console.error('사용자 조회 오류:', error)
      return NextResponse.json(
        { error: '사용자 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    console.log('사용자 목록:', data)

    return NextResponse.json({
      users: data,
      count: data?.length || 0
    })
  } catch (error) {
    console.error('사용자 목록 확인 오류:', error)
    return NextResponse.json(
      { error: '사용자 목록을 확인할 수 없습니다' },
      { status: 500 }
    )
  }
}
