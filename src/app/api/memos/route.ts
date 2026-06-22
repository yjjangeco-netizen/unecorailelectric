import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

const allowedColors = new Set(['yellow', 'blue', 'green', 'pink', 'purple', 'white'])

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeArchived = searchParams.get('archived') === 'true'

    let query = supabaseServer
      .from('memos')
      .select('*')
      .eq('user_id', userId)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false })

    if (!includeArchived) {
      query = query.eq('archived', false)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({
        error: '메모 조회에 실패했습니다.',
        details: error.message,
        setupSql: 'database/create_memos.sql'
      }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Memo GET error:', error)
    return NextResponse.json({ error: '메모 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const color = allowedColors.has(body.color) ? body.color : 'yellow'

    const { data, error } = await supabaseServer
      .from('memos')
      .insert({
        user_id: userId,
        title: body.title || '',
        content: body.content || '',
        color,
        is_pinned: Boolean(body.is_pinned),
        archived: false,
        position_x: Number(body.position_x || 0),
        position_y: Number(body.position_y || 0),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({
        error: '메모 생성에 실패했습니다.',
        details: error.message,
        setupSql: 'database/create_memos.sql'
      }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Memo POST error:', error)
    return NextResponse.json({ error: '메모 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
