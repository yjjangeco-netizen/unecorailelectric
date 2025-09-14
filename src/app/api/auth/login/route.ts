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

    // 하드코딩된 테스트 계정들
    const testUsers = [
      {
        id: '1',
        username: 'admin',
        password: 'admin123',
        name: '관리자 계정',
        department: '전기팀',
        position: '팀장',
        level: '5'
      },
      {
        id: '2',
        username: 'yjjang',
        password: 'yjjang123',
        name: '양재정',
        department: '전기팀',
        position: '대리',
        level: '3'
      },
      {
        id: '3',
        username: 'test',
        password: 'test123',
        name: '테스트 사용자',
        department: '전기팀',
        position: '사원',
        level: '2'
      }
    ]

    // 테스트 계정에서 사용자 찾기
    const user = testUsers.find(u => u.username === username)
    
    if (!user) {
      console.log('사용자 없음:', username)
      return NextResponse.json(
        { error: '사용자명 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 }
      )
    }

    if (user.password !== password) {
      console.log('비밀번호 불일치')
      return NextResponse.json(
        { error: '사용자명 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 }
      )
    }

    console.log('로그인 성공:', user.username)

    // 사용자 정보 반환
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        department: user.department,
        position: user.position,
        level: user.level,
        is_active: true,
        stock_view: true,
        stock_in: true,
        stock_out: true,
        stock_disposal: true,
        work_tools: user.level === '5',
        daily_log: parseInt(user.level) >= 3,
        work_manual: user.level === '5',
        sop: user.level === '5',
        user_management: user.level === '5',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
