import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // 환경 변수 확인
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase 환경 변수가 설정되지 않음')
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다' },
        { status: 500 }
      )
    }

    // Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: '사용자명과 비밀번호를 입력해주세요' },
        { status: 400 }
      )
    }

    console.log('로그인 시도:', username)

    // DB에서 사용자 조회
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single()

    if (error) {
      console.log('로그인 실패:', error)
      return NextResponse.json(
        { error: '사용자명 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 }
      )
    }

    if (!data) {
      console.log('사용자를 찾을 수 없음')
      return NextResponse.json(
        { error: '사용자명 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 }
      )
    }

    console.log('로그인 성공:', data.username)

    // 비밀번호 제외하고 사용자 정보 반환
    const { password: _, ...userWithoutPassword } = data as any
    
    return NextResponse.json({
      user: {
        id: userWithoutPassword.id,
        username: userWithoutPassword.username,
        name: userWithoutPassword.name,
        department: userWithoutPassword.depart || userWithoutPassword.department || '',
        position: userWithoutPassword.position || '',
        level: userWithoutPassword.level || '1',
        is_active: userWithoutPassword.is_active !== undefined ? userWithoutPassword.is_active : true,
        stock_view: userWithoutPassword.stock_view || false,
        stock_in: userWithoutPassword.stock_in || false,
        stock_out: userWithoutPassword.stock_out || false,
        stock_disposal: userWithoutPassword.stock_disposal || false,
        work_tools: userWithoutPassword.work_tools || false,
        daily_log: userWithoutPassword.daily_log || false,
        work_manual: userWithoutPassword.work_manual || false,
        sop: userWithoutPassword.sop || false,
        user_management: userWithoutPassword.user_management || false,
        created_at: userWithoutPassword.created_at,
        updated_at: userWithoutPassword.updated_at
      }
    })
  } catch (error) {
    console.error('로그인 오류:', error)
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
