import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, username, userLevel, action, page, ipAddress, userAgent } = body

    // 접속 로그 테이블이 없으면 생성
    const { error: createTableError } = await supabase.rpc('create_access_logs_table_if_not_exists')
    if (createTableError) {
      console.error('테이블 생성 오류:', createTableError)
    }

    // 접속 로그 저장
    const { data, error } = await supabase
      .from('access_logs')
      .insert({
        user_id: userId,
        username: username,
        user_level: userLevel,
        action: action, // 'login', 'logout', 'page_view', 'button_click' 등
        page: page,
        ip_address: ipAddress,
        user_agent: userAgent,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('접속 로그 저장 오류:', error)
      return NextResponse.json({ error: '로그 저장 실패' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('접속 로그 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const page = searchParams.get('page')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('access_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (page) {
      query = query.eq('page', page)
    }

    const { data, error } = await query

    if (error) {
      console.error('접속 로그 조회 오류:', error)
      return NextResponse.json({ error: '로그 조회 실패' }, { status: 500 })
    }

    return NextResponse.json({ logs: data })
  } catch (error) {
    console.error('접속 로그 조회 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
