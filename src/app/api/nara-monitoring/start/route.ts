import { NextRequest, NextResponse } from 'next/server'
import { naraMonitoringService } from '@/lib/nara/monitoring'
import type { MonitoringConfig } from '@/lib/nara/types'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

const DEFAULT_KEYWORDS = ['전기', '전력', '케이블', '변압기']

function normalizeKeywords(keywords: unknown) {
  const values = Array.isArray(keywords)
    ? keywords.map((keyword) => String(keyword).trim()).filter(Boolean)
    : []

  return values.length > 0 ? values : DEFAULT_KEYWORDS
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { telegramEnabled, telegramBotToken, telegramChatId, naraMarketApiKey, checkInterval } = body
    const keywords = normalizeKeywords(body.keywords)

    if (telegramEnabled && !telegramChatId && !process.env['TELEGRAM_WORK_CHAT_ID']) {
      return NextResponse.json({ message: '텔레그램 채팅 ID가 필요합니다.' }, { status: 400 })
    }

    const config: MonitoringConfig = {
      enabled: true,
      keywords,
      telegramEnabled: Boolean(telegramEnabled),
      telegramBotToken: telegramBotToken || '',
      telegramChatId: telegramChatId || '',
      naraMarketApiKey: naraMarketApiKey || '',
      checkInterval: Number(checkInterval) || 30,
      sources: ['korail', 'naramarket'],
      workHoursOnly: false
    }

    await supabaseServer
      .from('app_settings')
      .upsert({
        key: 'nara-monitoring',
        value: {
          keywords,
          telegramEnabled: Boolean(telegramEnabled),
          telegramBotToken: telegramBotToken || '',
          telegramChatId: telegramChatId || '',
          naraMarketApiKey: naraMarketApiKey || '',
          checkInterval: Number(checkInterval) || 30,
          running: true
        },
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })

    // 참고: 실제 주기 검색은 Vercel 크론(/api/nara-monitoring/cron)이 수행한다.
    // (서버리스에선 setInterval 이 유지되지 않으므로 start() 결과에 의존하지 않음)
    await naraMonitoringService.start(config).catch(() => false)

    return NextResponse.json({
      success: true,
      message: '모니터링을 시작했습니다.',
      config: { keywords, telegramEnabled, telegramBotToken, telegramChatId, naraMarketApiKey, checkInterval },
      bidItems: naraMonitoringService.getBids(),
      status: naraMonitoringService.getStatus()
    })
  } catch (error) {
    console.error('NARA monitoring start error:', error)
    return NextResponse.json({ message: '모니터링 시작에 실패했습니다.' }, { status: 500 })
  }
}
