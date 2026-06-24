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

    // 보는 사람의 레벨 (공유 메모 노출 판단용)
    const levelRaw = (request.headers.get('x-user-level') || '').trim()
    const isAdmin = levelRaw.toLowerCase() === 'administrator'
    const numLevel = isAdmin ? 99 : (Number(levelRaw) || 0)

    let query = supabaseServer.from('memos').select('*')

    if (includeArchived) {
      // 보관함은 본인 메모만 (보관 포함)
      query = query.eq('user_id', userId)
    } else {
      // 활성 메모: 본인 것 OR 내 레벨에 공개된 남의 메모
      query = query
        .eq('archived', false)
        .or(`user_id.eq.${userId},and(share_level.gte.1,share_level.lte.${numLevel})`)
    }

    query = query
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false })

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
        share_level: Number.isInteger(body.share_level) ? body.share_level : 0,
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
