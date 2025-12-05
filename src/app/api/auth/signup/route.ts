import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { hashPassword } from '@/lib/security'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseServer

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

    // 새 사용자 생성
    const userData = {
      id: crypto.randomUUID(),
      username: username,
      password: hashedPassword,
      name: name,
      department: department,
      position: position,
      email: email,
      level: username === 'testadmin' ? 'administrator' : (level || 'user'), // testadmin은 관리자로 생성
      is_active: true
    }

    console.log('생성할 사용자 데이터:', userData)

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
