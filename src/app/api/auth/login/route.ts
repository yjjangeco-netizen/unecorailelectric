import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyPassword, generateToken, validateUsername, sanitizeInput } from '@/lib/security'

export const dynamic = 'force-dynamic'

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

    // 입력값 검증 및 XSS 방지
    const sanitizedUsername = sanitizeInput(username)
    const usernameValidation = validateUsername(sanitizedUsername)
    
    if (!usernameValidation.isValid) {
      return NextResponse.json(
        { error: '사용자명 형식이 올바르지 않습니다', details: usernameValidation.errors },
        { status: 400 }
      )
    }

    console.log('로그인 시도:', sanitizedUsername)

    // Supabase에서 사용자 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', sanitizedUsername)
      .eq('is_active', true)
      .single()

    if (userError || !user) {
      console.log('사용자 없음:', sanitizedUsername, userError)
      return NextResponse.json(
        { error: '사용자명 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 }
      )
    }

    // 해시된 비밀번호 검증
    const isPasswordValid = await verifyPassword(password, user.password)
    
    if (!isPasswordValid) {
      console.log('비밀번호 불일치')
      return NextResponse.json(
        { error: '사용자명 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 }
      )
    }

    console.log('로그인 성공:', user.username)

    // JWT 토큰 생성
    const token = generateToken({
      userId: user.id,
      username: user.username,
      level: user.level
    })

    // 사용자 정보 반환 (비밀번호 제외)
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json({
      user: userWithoutPassword,
      token
    })
  } catch (error) {
    console.error('로그인 오류:', error)
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
