import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getAssistantOwnerById } from '@/lib/assistantAccessServer'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const owner = await getAssistantOwnerById(request.headers.get('x-user-id'))

  if (!owner) {
    return NextResponse.json({ error: 'yjjang 개인 비서 전용 기능입니다.' }, { status: 403 })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const redirectUri = `${appUrl}/api/assistant/google/callback`

  if (!clientId || !clientSecret) {
    return NextResponse.json({
      error: 'GOOGLE_CLIENT_ID 또는 GOOGLE_CLIENT_SECRET 환경변수가 필요합니다.',
      requiredEnv: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'NEXT_PUBLIC_APP_URL']
    }, { status: 500 })
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    state: owner.id,
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/tasks'
    ]
  })

  return NextResponse.json({ url })
}
