import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
)

export async function POST(request: NextRequest) {
  try {
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

    if (checkError && checkError.code !== 'PGRST116') {
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

    // 새 사용자 생성 - id와 username 모두 설정
    const userData = {
      id: username, // id 컬럼도 설정 (PRIMARY KEY)
      username: username, // username 컬럼 설정
      password: password,
      name: name,
      department: department,
      position: position,
      email: email,
      level: level || '1',
      is_active: true
    }

    console.log('생성할 사용자 데이터:', userData)

    // 첫 번째 시도: 전체 구조
    let { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single()

    // 첫 번째 시도 실패 시 대체 구조 시도
    if (insertError) {
      console.error('첫 번째 시도 실패:', insertError)
      
      // 두 번째 시도: id, username과 기본 필드만
      const basicUserData = {
        id: username,
        username: username,
        password: password,
        name: name
      }
      
      console.log('두 번째 시도 - 기본 데이터:', basicUserData)
      
      const { data: newUser2, error: insertError2 } = await supabase
        .from('users')
        .insert([basicUserData])
        .select()
        .single()

      if (insertError2) {
        console.error('두 번째 시도 실패:', insertError2)
        
        // 세 번째 시도: id와 username만
        const minimalUserData = {
          id: username,
          username: username
        }
        
        console.log('세 번째 시도 - 최소 데이터:', minimalUserData)
        
        const { data: newUser3, error: insertError3 } = await supabase
          .from('users')
          .insert([minimalUserData])
          .select()
          .single()

        if (insertError3) {
          console.error('모든 시도 실패:', insertError3)
          const errorMessage = insertError3.message || '알 수 없는 오류'
          return NextResponse.json(
            { message: `사용자 생성 중 오류가 발생했습니다: ${errorMessage}` },
            { status: 500 }
          )
        }
        
        newUser = newUser3
        insertError = null
      } else {
        newUser = newUser2
        insertError = null
      }
    }

    if (insertError) {
      console.error('사용자 생성 오류:', insertError)
      return NextResponse.json(
        { message: '사용자 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 성공 응답
    return NextResponse.json({
      message: '회원가입이 완료되었습니다.',
      user: {
        id: newUser.id || username,
        username: newUser.username || username,
        name: newUser.name || name,
        department: newUser.department || department,
        position: newUser.position || position,
        email: newUser.email || email,
        level: newUser.level || level || '1'
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
