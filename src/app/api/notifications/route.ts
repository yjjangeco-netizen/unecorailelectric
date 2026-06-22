import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

// 내 알림 목록 + 안읽음 개수
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { data, error } = await supabaseServer
    .from('notifications')
    .select('id, type, title, body, link, is_read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ notifications: [], unread: 0, setupRequired: true })
  }

  const unread = (data || []).filter((n) => !n.is_read).length
  return NextResponse.json({ notifications: data || [], unread })
}

// 읽음 처리 ({ id } 또는 { all: true })
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  let query = supabaseServer.from('notifications').update({ is_read: true }).eq('user_id', userId)
  if (!body.all && body.id) query = query.eq('id', body.id)
  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
