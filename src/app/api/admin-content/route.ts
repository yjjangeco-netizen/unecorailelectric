import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { getAssistantOwnerById } from '@/lib/assistantAccessServer'

export const dynamic = 'force-dynamic'

const CONFIG_KEY = 'admin-content'

function hasUsableGoogleTokens(value: unknown) {
  if (!value || typeof value !== 'object') return false
  const tokens = value as { access_token?: string; refresh_token?: string }
  return Boolean(tokens.access_token || tokens.refresh_token)
}

function isMissingSettingsTable(error: { message?: string; code?: string } | null | undefined) {
  if (!error) return false
  const message = error.message || ''
  return error.code === 'PGRST205' || message.includes('app_settings') || message.includes('schema cache')
}

async function requireGoogleConnected(request: NextRequest) {
  const owner = await getAssistantOwnerById(request.headers.get('x-user-id'))
  if (!owner) {
    return {
      ok: false,
      response: NextResponse.json({
        error: 'Google 인증 대상 사용자가 아닙니다.',
        googleRequired: true
      }, { status: 403 })
    }
  }

  const { data, error } = await supabaseServer
    .from('assistant_settings')
    .select('google_connected, google_tokens')
    .eq('user_id', owner.id)
    .maybeSingle()

  if (error || !data?.google_connected || !hasUsableGoogleTokens(data?.google_tokens)) {
    return {
      ok: false,
      response: NextResponse.json({
        error: 'Google Drive 인증이 필요합니다.',
        googleRequired: true,
        setupSql: error ? 'database/create_assistant_automation.sql' : undefined
      }, { status: 403 })
    }
  }

  return { ok: true, owner }
}

export async function GET(request: NextRequest) {
  const google = await requireGoogleConnected(request)
  if (!google.ok) return google.response

  const { data, error } = await supabaseServer
    .from('app_settings')
    .select('value')
    .eq('key', CONFIG_KEY)
    .maybeSingle()

  if (error) {
    if (isMissingSettingsTable(error)) {
      return NextResponse.json({
        items: [],
        setupRequired: true,
        setupSql: 'database/create_app_settings.sql'
      })
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    items: Array.isArray(data?.value?.items) ? data.value.items : [],
    setupRequired: false
  })
}

export async function PUT(request: NextRequest) {
  try {
    const google = await requireGoogleConnected(request)
    if (!google.ok) return google.response

    const body = await request.json()
    const items = Array.isArray(body?.items) ? body.items : []

    const { error } = await supabaseServer
      .from('app_settings')
      .upsert({
        key: CONFIG_KEY,
        value: { items },
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })

    if (error) {
      if (isMissingSettingsTable(error)) {
        return NextResponse.json({
          items,
          setupRequired: true,
          setupSql: 'database/create_app_settings.sql'
        })
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ items, setupRequired: false })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : '관리자 콘텐츠 저장 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
