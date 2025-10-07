import { NextRequest, NextResponse } from 'next/server'
import { generateToken, validateUsername, sanitizeInput } from '@/lib/security'
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
      .eq('id', sanitizedUsername)
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

    // 비밀번호 검증 (평문 비교)
    if (user.password !== password) {
      console.log('비밀번호 불일치:', sanitizedUsername)
      return NextResponse.json(
        { error: '사용자명 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 }
      )
    }

    console.log('로그인 성공:', user.id)

    // JWT 토큰 생성
    const token = generateToken({
      userId: user.id,
      username: user.id,
      level: user.level
    })

    // 사용자 정보 반환 (비밀번호 제외)
    const userResponse = {
      id: user.id,
      username: user.id,
      email: user.email || '',
      name: user.name || '',
      department: user.department || '',
      position: user.position || '',
      level: user.level,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
    
    return NextResponse.json({
      user: userResponse,
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
