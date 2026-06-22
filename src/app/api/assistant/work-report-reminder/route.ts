import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { getAssistantOwnerById, getDefaultAssistantOwner } from '@/lib/assistantAccessServer'
import { notifyTelegram } from '@/lib/assistantNotifications'
import { isHoliday, isWeekend } from '@/lib/holidays'

export const dynamic = 'force-dynamic'

function kstDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

function kstTime(date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
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

export async function GET(request: NextRequest) {
  try {
    const owner = await resolveOwner(request)
    if (!owner) {
      return NextResponse.json({ error: 'yjjang 개인 비서 전용 기능입니다.' }, { status: 403 })
    }

    const today = kstDate()
    const force = request.nextUrl.searchParams.get('force') === '1'
    const { data: assistantSettings } = await supabaseServer
      .from('assistant_settings')
      .select('settings')
      .eq('user_id', owner.id)
      .maybeSingle()

    const configuredTime = assistantSettings?.settings?.work_report_reminder_time || '16:30'
    if (!force && kstTime() !== configuredTime) {
      return NextResponse.json({ skipped: true, reason: '설정된 알림 시간이 아닙니다.', configuredTime, now: kstTime() })
    }

    const todayDate = new Date(`${today}T00:00:00+09:00`)
    if (isWeekend(todayDate) || isHoliday(today)) {
      return NextResponse.json({ skipped: true, reason: '휴일 알림 제외', date: today })
    }

    const result = await notifyTelegram('work', '<b>업무보고 시간입니다.</b>\n업무보고 하세요.')
    return NextResponse.json({ ok: true, date: today, result })
  } catch (error) {
    console.error('Work report reminder error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : '업무보고 알림 전송에 실패했습니다.'
    }, { status: 500 })
  }
}
