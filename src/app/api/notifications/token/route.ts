import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

// FCM 디바이스 토큰 등록/갱신
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const token = body.token
  if (!token) return NextResponse.json({ error: '토큰이 필요합니다.' }, { status: 400 })

  const { error } = await supabaseServer
    .from('push_tokens')
    .upsert({
      user_id: userId,
      token,
      platform: body.platform || 'android',
      updated_at: new Date().toISOString()
    }, { onConflict: 'token' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
