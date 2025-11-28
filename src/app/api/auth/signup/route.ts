import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hashPassword } from '@/lib/security'

export const dynamic = 'force-dynamic'

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

    const body = await request.json()
    const { username, password, name, position, department, email, level } = body

    console.log('받은 데이터:', body)

    // 필수 필드 검증
    if (!username || !password || !name || !position || !department || !email) {
      return NextResponse.json(
        { message: '모든 필수 정보를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 사용자 ID 중복 확인 (username 컬럼 사용)
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single()

    if (checkError && checkError?.code !== 'PGRST116') {
      console.error('사용자 확인 오류:', checkError)
      return NextResponse.json(
        { message: '사용자 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { message: '이미 존재하는 사용자 ID입니다.' },
        { status: 409 }
      )
    }

    // 비밀번호 해시화
    const hashedPassword = await hashPassword(password)

    // 이름 분리 (first_name, last_name)
    const nameParts = name.trim().split(/\s+/)
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '.'
    const firstName = nameParts[0]

    // 새 사용자 생성
    const userData = {
      username: username,
      password_hash: hashedPassword,
      first_name: firstName,
      last_name: lastName,
      name: name, // 호환성을 위해 유지하거나 스키마에 없다면 제거해야 함. 스키마에 없으므로 제거.
      department: department,
      position: position,
      email: email,
      level: level || 'user', // 기본값 'user'
      is_active: true
    }

    // userData에서 스키마에 없는 name 필드 제거
    delete (userData as any).name

    console.log('생성할 사용자 데이터:', userData)

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single()

    if (insertError) {
      console.error('사용자 생성 오류:', insertError)
      return NextResponse.json(
        { message: `사용자 생성 중 오류가 발생했습니다: ${insertError.message}` },
        { status: 500 }
      )
    }

    // 성공 응답
    return NextResponse.json({
      message: '회원가입이 완료되었습니다.',
      user: {
        id: newUser.id,
        username: newUser.username,
        name: `${newUser.first_name} ${newUser.last_name === '.' ? '' : newUser.last_name}`.trim(),
        department: newUser.department,
        position: newUser.position,
        email: newUser.email,
        level: newUser.level
      }
    }, { status: 201 })

  } catch (error) {
    console.error('회원가입 API 오류:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
