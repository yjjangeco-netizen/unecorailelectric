import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hashPassword, validatePasswordStrength, validateUsername, sanitizeInput } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    console.log('=== 회원가입 API 호출 시작 ===')
    
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

    const { username, password, name, department, position, level } = await request.json()

    // 필수 필드 검증
    if (!username || !password || !name || !department || !position || !level) {
      return NextResponse.json(
        { error: '모든 필수 필드를 입력해주세요' },
        { status: 400 }
      )
    }

    // 입력값 검증 및 XSS 방지
    const sanitizedUsername = sanitizeInput(username)
    const sanitizedName = sanitizeInput(name)
    const sanitizedDepartment = sanitizeInput(department)
    const sanitizedPosition = sanitizeInput(position)

    // 사용자명 검증
    const usernameValidation = validateUsername(sanitizedUsername)
    if (!usernameValidation.isValid) {
      return NextResponse.json(
        { error: '사용자명 형식이 올바르지 않습니다', details: usernameValidation.errors },
        { status: 400 }
      )
    }

    // 비밀번호 강도 검증
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: '비밀번호가 보안 기준에 맞지 않습니다', details: passwordValidation.errors },
        { status: 400 }
      )
    }

    // 중복 사용자명 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', sanitizedUsername)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 사용 중인 사용자명입니다' },
        { status: 409 }
      )
    }

    // 비밀번호 해시화
    const hashedPassword = await hashPassword(password)

    // 사용자 생성
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        username: sanitizedUsername,
        password: hashedPassword,
        name: sanitizedName,
        department: sanitizedDepartment,
        position: sanitizedPosition,
        level: level,
        is_active: true,
        stock_view: level === '1' || level === '2' || level === '3' || level === '4' || level === '5',
        stock_in: level === '3' || level === '4' || level === '5',
        stock_out: level === '3' || level === '4' || level === '5',
        stock_disposal: level === '4' || level === '5',
        work_tools: level === '2' || level === '3' || level === '4' || level === '5',
        daily_log: level === '1' || level === '2' || level === '3' || level === '4' || level === '5',
        work_manual: level === '4' || level === '5',
        sop: level === '5',
        user_management: level === '5',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('사용자 생성 오류:', createError)
      return NextResponse.json(
        { error: '회원가입 중 오류가 발생했습니다' },
        { status: 500 }
      )
    }

    console.log('회원가입 성공:', newUser.username)

    // 비밀번호 제외하고 반환
    const { password: _, ...userWithoutPassword } = newUser
    return NextResponse.json({
      message: '회원가입이 완료되었습니다',
      user: userWithoutPassword
    }, { status: 201 })

  } catch (error) {
    console.error('회원가입 오류:', error)
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
