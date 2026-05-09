import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

// 게시글 상세 조회 및 조회수 증가
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    if (!id) return NextResponse.json({ error: '게시글 ID가 필요합니다' }, { status: 400 })

    const supabase = supabaseServer

    // 조회수 1 증가 (Supabase의 rpc 기능을 사용하거나, 먼저 읽어온 후 update)
    // 여기서는 간단하게 select 후 update 방식으로 구현
    const { data: boardData, error: fetchError } = await supabase
      .from('work_tool_boards')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !boardData) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다' }, { status: 404 })
    }

    // 조회수 증가 업데이트 (비동기로 던져두기)
    supabase.from('work_tool_boards').update({ views: (boardData.views || 0) + 1 }).eq('id', id).then()

    // 최신 데이터를 리턴할 때 views에 +1 해서 응답 (사용자 경험)
    return NextResponse.json({ ...boardData, views: (boardData.views || 0) + 1 })
  } catch (error) {
    console.error('게시글 상세 조회 중 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 게시글 수정
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get('x-user-id')
    const userLevel = request.headers.get('x-user-level')
    if (!userId) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

    const id = params.id
    const body = await request.json()
    const { title, content } = body

    const supabase = supabaseServer

    // 작성자 본인 또는 관리자만 수정 가능
    const { data: existingData, error: fetchError } = await supabase
      .from('work_tool_boards')
      .select('author_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingData) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다' }, { status: 404 })
    }

    const numLevel = parseInt(userLevel || '0', 10)
    if (existingData.author_id !== userId && userLevel !== 'admin' && userLevel !== 'administrator' && numLevel < 5) {
      return NextResponse.json({ error: '수정 권한이 없습니다' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('work_tool_boards')
      .update({
        title,
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('게시글 수정 중 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 게시글 삭제
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get('x-user-id')
    const userLevel = request.headers.get('x-user-level')
    if (!userId) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

    const id = params.id
    const supabase = supabaseServer

    // 작성자 본인 또는 관리자만 삭제 가능
    const { data: existingData, error: fetchError } = await supabase
      .from('work_tool_boards')
      .select('author_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingData) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다' }, { status: 404 })
    }

    const numLevel = parseInt(userLevel || '0', 10)
    if (existingData.author_id !== userId && userLevel !== 'admin' && userLevel !== 'administrator' && numLevel < 5) {
      return NextResponse.json({ error: '삭제 권한이 없습니다' }, { status: 403 })
    }

    const { error } = await supabase
      .from('work_tool_boards')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('게시글 삭제 중 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
