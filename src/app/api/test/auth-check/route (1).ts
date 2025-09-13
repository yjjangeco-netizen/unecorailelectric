import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      return NextResponse.json({ 
        authenticated: false, 
        error: '인증 오류', 
        details: authError.message 
      }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ 
        authenticated: false, 
        error: '사용자 정보 없음' 
      }, { status: 401 })
    }

    // 사용자 프로필 정보 조회
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, username, name, level, depart, position')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ 
        authenticated: true, 
        user: { id: user.id, email: user.email },
        error: '프로필 조회 실패',
        details: profileError.message
      })
    }

    return NextResponse.json({ 
      authenticated: true, 
      user: {
        id: user.id,
        email: user.email,
        profile: userProfile
      }
    })

  } catch (error) {
    console.error('인증 확인 오류:', error)
    return NextResponse.json({ 
      authenticated: false, 
      error: '서버 오류',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
}
