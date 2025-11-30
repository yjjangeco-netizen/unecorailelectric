import { NextRequest, NextResponse } from 'next/server'
import { generateToken, validateUsername, sanitizeInput, verifyPassword } from '@/lib/security'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('=== 로그인 API 호출 시작 (Supabase DB 인증) ===')

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

    // Supabase DB에서 사용자 조회
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esvpnrqavaeikzhbmydz.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8'

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', sanitizedUsername)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('사용자 조회 오류:', error)
      return NextResponse.json(
        { error: '로그인 처리 중 오류가 발생했습니다' },
        { status: 500 }
      )
    }

    if (!user) {
      console.log('사용자 없음:', sanitizedUsername)
      return NextResponse.json(
        { error: '사용자명 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 }
      )
    }

    // 비밀번호 검증 (해시 비교)
    // password_hash가 없는 경우 (구버전 사용자) 평문 비교 시도
    let isValidPassword = false

    if (user.password_hash) {
      isValidPassword = await verifyPassword(password, user.password_hash)
    } else if (user.password) {
      // password 컬럼에 해시된 비밀번호가 저장된 경우 ($2로 시작)
      if (user.password.startsWith('$2')) {
        isValidPassword = await verifyPassword(password, user.password)
      } else {
        // 하위 호환성: 평문 비밀번호가 있는 경우
        isValidPassword = user.password === password
      }
    }

    if (!isValidPassword) {
      console.log('비밀번호 불일치:', sanitizedUsername)
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

    const response = NextResponse.json({
      user: userResponse,
      token
    })

    // Set cookie in response for better reliability
    response.cookies.set('auth-token', token, {
      httpOnly: false, // Allow client access if needed for other logic
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax'
    })

    return response
  } catch (error) {
    console.error('로그인 오류:', error)
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
