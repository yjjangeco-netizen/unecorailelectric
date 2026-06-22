import { NextRequest, NextResponse } from 'next/server'
import { getAssistantOwnerById, getDefaultAssistantOwner } from '@/lib/assistantAccessServer'
import { createDailySummaryDoc } from '@/lib/assistantGoogle'
import { notifyPersonalAiDone } from '@/lib/assistantNotifications'

export const dynamic = 'force-dynamic'

function kstDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

async function resolveOwner(request: NextRequest) {
  const headerOwner = await getAssistantOwnerById(request.headers.get('x-user-id'))
  if (headerOwner) return headerOwner

  const cronSecret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  if (cronSecret && auth !== `Bearer ${cronSecret}`) return null

  return getDefaultAssistantOwner()
}

export async function POST(request: NextRequest) {
  try {
    const owner = await resolveOwner(request)
    if (!owner) {
      return NextResponse.json({ error: 'yjjang 개인 비서 전용 기능입니다.' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const file = await createDailySummaryDoc(owner, body.date || kstDate())
    await notifyPersonalAiDone('하루 일지를 Google Drive에 저장했습니다.', file.webViewLink || file.name || '')
    return NextResponse.json({ file })
  } catch (error) {
    console.error('Assistant daily summary error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : '하루 일지 생성 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const owner = await resolveOwner(request)
    if (!owner) {
      return NextResponse.json({ error: 'yjjang 개인 비서 전용 기능입니다.' }, { status: 403 })
    }

    const file = await createDailySummaryDoc(owner, kstDate())
    await notifyPersonalAiDone('하루 일지를 Google Drive에 저장했습니다.', file.webViewLink || file.name || '')
    return NextResponse.json({ file })
  } catch (error) {
    console.error('Assistant daily summary cron error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : '하루 일지 생성 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
