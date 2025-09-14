import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Supabase 연결 상태 확인 ===')
    
    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('환경 변수:', {
      url: supabaseUrl ? '설정됨' : '미설정',
      key: supabaseKey ? '설정됨' : '미설정',
      urlValue: supabaseUrl,
      keyValue: supabaseKey?.substring(0, 20) + '...'
    })

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: '환경 변수가 설정되지 않음',
        details: {
          url: !!supabaseUrl,
          key: !!supabaseKey
        }
      })
    }

    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // 연결 테스트
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (error) {
      console.error('Supabase 연결 오류:', error)
      return NextResponse.json({
        success: false,
        error: 'Supabase 연결 실패',
        details: error.message
      })
    }

    console.log('Supabase 연결 성공')
    
    return NextResponse.json({
      success: true,
      message: 'Supabase 연결 성공',
      data: {
        url: supabaseUrl,
        hasUsersTable: true,
        connectionTest: 'OK'
      }
    })

  } catch (error) {
    console.error('Supabase 확인 오류:', error)
    return NextResponse.json({
      success: false,
      error: 'Supabase 확인 중 오류 발생',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    })
  }
}
