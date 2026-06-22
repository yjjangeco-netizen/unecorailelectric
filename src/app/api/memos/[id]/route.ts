import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

const allowedColors = new Set(['yellow', 'blue', 'green', 'pink', 'purple', 'white'])

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (typeof body.title === 'string') updateData.title = body.title
    if (typeof body.content === 'string') updateData.content = body.content
    if (typeof body.color === 'string' && allowedColors.has(body.color)) updateData.color = body.color
    if (typeof body.is_pinned === 'boolean') updateData.is_pinned = body.is_pinned
    if (typeof body.archived === 'boolean') updateData.archived = body.archived
    if (Number.isFinite(body.position_x)) updateData.position_x = Number(body.position_x)
    if (Number.isFinite(body.position_y)) updateData.position_y = Number(body.position_y)

    const { data, error } = await supabaseServer
      .from('memos')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: '메모 수정에 실패했습니다.', details: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Memo PUT error:', error)
    return NextResponse.json({ error: '메모 수정 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { error } = await supabaseServer
      .from('memos')
      .delete()
      .eq('id', params.id)
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({ error: '메모 삭제에 실패했습니다.', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Memo DELETE error:', error)
    return NextResponse.json({ error: '메모 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
