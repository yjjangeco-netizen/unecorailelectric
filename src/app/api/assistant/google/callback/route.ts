import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { supabaseServer } from '@/lib/supabaseServer'
import { defaultAssistantSettings } from '@/lib/assistantAutomation'
import { getAssistantOwnerById } from '@/lib/assistantAccessServer'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const userId = request.nextUrl.searchParams.get('state')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  if (!code || !userId) {
    return NextResponse.redirect(`${appUrl}/assistant-automation?google=missing_code`)
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = `${appUrl}/api/assistant/google/callback`

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${appUrl}/assistant-automation?google=missing_env`)
  }

  try {
    const owner = await getAssistantOwnerById(userId)
    if (!owner) {
      return NextResponse.redirect(`${appUrl}/assistant-automation?google=forbidden`)
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
    const { tokens } = await oauth2Client.getToken(code)

    const { error } = await supabaseServer
      .from('assistant_settings')
      .upsert({
        user_id: owner.id,
        settings: {
          ...defaultAssistantSettings,
          google_calendar_sync: true
        },
        google_calendar_id: 'primary',
        google_connected: true,
        google_drive_folder_id: null,
        google_tokens: tokens,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (error) {
      console.error('Google callback save error:', error)
      return NextResponse.redirect(`${appUrl}/assistant-automation?google=db_setup_required`)
    }

    return NextResponse.redirect(`${appUrl}/assistant-automation?google=connected`)
  } catch (error) {
    console.error('Google callback error:', error)
    return NextResponse.redirect(`${appUrl}/assistant-automation?google=error`)
  }
}
