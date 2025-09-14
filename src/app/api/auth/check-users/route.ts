import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(_request: NextRequest) {
  try {
    console.log('=== 사용자 목록 확인 ===')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase 환경변수가 설정되지 않았습니다' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 사용자 목록 조회 (비밀번호 제외)
    const { data, error } = await supabase
      .from('users')
      .select('id, username, first_name, last_name, level, department, position')
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
