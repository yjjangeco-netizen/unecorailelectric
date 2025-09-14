import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== 로그인 API 호출 시작 ===')
    
    // 환경 변수 확인
    console.log('환경 변수 확인:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '미설정',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '미설정',
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env['VERCEL_ENV']
    })

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase 환경 변수가 설정되지 않음')
      return NextResponse.json(
        { 
          error: '데이터베이스 연결이 설정되지 않았습니다',
          details: 'Vercel 환경 변수를 확인해주세요',
          debug: {
            hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            nodeEnv: process.env.NODE_ENV,
            vercelEnv: process.env['VERCEL_ENV']
          }
        },
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
    console.log('사용자 조회 시작:', username)
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    console.log('DB 조회 결과:', { data: data ? '사용자 발견' : '사용자 없음', error })

    if (error) {
      console.log('로그인 실패:', error)
      return NextResponse.json(
        { 
          error: '사용자명 또는 비밀번호가 올바르지 않습니다',
          details: error.message
        },
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

    // 비밀번호 확인 (실제로는 해시 비교해야 함)
    if (data.password_hash !== password) {
      console.log('비밀번호 불일치')
      return NextResponse.json(
        { error: '사용자명 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 }
      )
    }

    console.log('로그인 성공:', data.username)

    // 비밀번호 제외하고 사용자 정보 반환
    const { password_hash: _, ...userWithoutPassword } = data as any
    
    return NextResponse.json({
      user: {
        id: userWithoutPassword.id,
        username: userWithoutPassword.username,
        name: `${userWithoutPassword.first_name} ${userWithoutPassword.last_name}`,
        department: userWithoutPassword.department || '',
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
