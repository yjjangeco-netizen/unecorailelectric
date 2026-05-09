import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

// 게시판 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const boardType = searchParams.get('boardType')
    
    if (!boardType) {
      return NextResponse.json({ error: '게시판 타입(boardType)이 필요합니다.' }, { status: 400 })
    }

    const supabase = supabaseServer

    const { data, error } = await supabase
      .from('work_tool_boards')
      .select('id, title, author_name, created_at, views')
      .eq('board_type', boardType)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('게시글 목록 조회 오류:', error)
      return NextResponse.json({ error: '게시글 목록 조회에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('게시글 조회 중 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 게시글 등록
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { boardType, title, content, authorName } = body

    if (!boardType || !title || !content) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다' }, { status: 400 })
    }

    const supabase = supabaseServer

    const { data, error } = await supabase
      .from('work_tool_boards')
      .insert({
        board_type: boardType,
        title,
        content,
        author_id: userId,
        author_name: authorName || '관리자',
        views: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('게시글 생성 오류:', error)
      return NextResponse.json({ error: '게시글 등록에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('게시글 등록 중 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
