import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { getNaraItemKey, searchKorailBids } from '@/lib/nara/korailSearch'
import type { BidItem } from '@/lib/nara/types'
import { sendTelegramMessage } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

const CONFIG_KEY = 'nara-monitoring'
const DEFAULT_CONFIG = {
  keywords: ['전기', '전력', '케이블', '변압기'],
  telegramEnabled: false,
  telegramBotToken: '',
  telegramChatId: '',
  naraMarketApiKey: '',
  checkInterval: 30,
  naraCronInitialized: false,
  running: false
}

type CronConfig = typeof DEFAULT_CONFIG

function normalizeConfig(value: any): CronConfig {
  const keywords = Array.isArray(value?.keywords)
    ? value.keywords.map((keyword: unknown) => String(keyword).trim()).filter(Boolean)
    : DEFAULT_CONFIG.keywords

  return {
    keywords: keywords.length > 0 ? keywords : DEFAULT_CONFIG.keywords,
    telegramEnabled: Boolean(value?.telegramEnabled),
    telegramBotToken: String(value?.telegramBotToken || ''),
    telegramChatId: String(value?.telegramChatId || ''),
    naraMarketApiKey: String(value?.naraMarketApiKey || ''),
    checkInterval: Math.min(300, Math.max(10, Number(value?.checkInterval) || DEFAULT_CONFIG.checkInterval)),
    naraCronInitialized: Boolean(value?.naraCronInitialized),
    running: Boolean(value?.running)
  }
}

function isMissingTable(error: { message?: string; code?: string } | null | undefined, tableName: string) {
  if (!error) return false
  const message = error.message || ''
  return error.code === 'PGRST205' || message.includes(tableName) || message.includes('schema cache')
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function chunk<T>(items: T[], size: number) {
  const result: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size))
  }
  return result
}

function formatTelegramMessage(items: BidItem[]) {
  const lines = items.map((item, index) => {
    const title = escapeHtml(item.title || '제목 없음')
    const category = escapeHtml(item.category || 'NARA')
    const deadline = item.deadline ? ` / 마감: ${escapeHtml(item.deadline)}` : ''
    const url = item.url ? `\n<a href="${escapeHtml(item.url)}">공고 보기</a>` : ''
    return `${index + 1}. [${category}] ${title}${deadline}${url}`
  })

  return `<b>NARA 신규 입찰공고</b>\n\n${lines.join('\n\n')}`
}

async function readConfig() {
  const { data, error } = await supabaseServer
    .from('app_settings')
    .select('value')
    .eq('key', CONFIG_KEY)
    .maybeSingle()

  if (error) return { config: DEFAULT_CONFIG, error }
  return { config: normalizeConfig(data?.value || DEFAULT_CONFIG), error: null }
}

async function saveInitialized(config: CronConfig) {
  return supabaseServer
    .from('app_settings')
    .upsert({
      key: CONFIG_KEY,
      value: { ...config, naraCronInitialized: true },
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' })
}

async function markPending(item: BidItem) {
  const { error } = await supabaseServer
    .from('nara_sent_notifications')
    .insert({
      item_key: getNaraItemKey(item),
      title: item.title,
      url: item.url,
      category: item.category,
      sent_at: new Date().toISOString()
    })

  if (!error) return true
  if (error.code === '23505') return false
  throw error
}

export async function GET(request: NextRequest) {
  // 크론 전용 엔드포인트 — CRON_SECRET 설정 시 Vercel 크론의 Bearer 토큰만 허용.
  // (외부 무인증 트리거로 인한 텔레그램 스팸/외부 API 호출 남용 차단)
  const cronSecret = process.env['CRON_SECRET']
  if (cronSecret && request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { config, error: configError } = await readConfig()

  if (configError) {
    return NextResponse.json({
      ok: false,
      error: configError.message,
      setupRequired: isMissingTable(configError, 'app_settings'),
      setupSql: 'database/create_app_settings.sql'
    }, { status: 500 })
  }

  const chatId = config.telegramChatId || process.env['TELEGRAM_WORK_CHAT_ID']
  const token = config.telegramBotToken || process.env['TELEGRAM_BOT_TOKEN']
  const canSendTelegram = config.telegramEnabled && Boolean(chatId) && Boolean(token)
  // 자동 발송은 "모니터링 시작(running)" 상태일 때만 (중지하면 발송 안 함)
  const active = canSendTelegram && config.running

  if (request.nextUrl.searchParams.get('testTelegram') === '1') {
    if (!canSendTelegram) {
      return NextResponse.json({
        ok: false,
        error: 'Telegram config is incomplete.',
        telegramEnabled: config.telegramEnabled,
        hasChatId: Boolean(chatId),
        hasToken: Boolean(token)
      }, { status: 400 })
    }

    const response = await sendTelegramMessage({
      chatId: chatId!,
      token,
      text: '<b>NARA 텔레그램 테스트</b>\n설정이 정상입니다.'
    })

    return NextResponse.json({
      ok: Boolean(response?.ok),
      telegramResponse: response
    }, { status: response?.ok ? 200 : 500 })
  }

  const searchResult = await searchKorailBids(config.keywords, { naraMarketApiKey: config.naraMarketApiKey })
  const pending: BidItem[] = []
  let duplicates = 0

  if (!config.naraCronInitialized || active) {
    try {
      for (const item of searchResult.bids) {
        if (await markPending(item)) pending.push(item)
        else duplicates += 1
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'notification table error'
      return NextResponse.json({
        ok: false,
        error: message,
        setupRequired: isMissingTable(error as any, 'nara_sent_notifications'),
        setupSql: 'database/create_nara_sent_notifications.sql'
      }, { status: 500 })
    }
  }

  if (!config.naraCronInitialized) {
    await saveInitialized(config)
    return NextResponse.json({
      ok: true,
      initialized: true,
      found: searchResult.bids.length,
      seeded: pending.length,
      duplicates,
      sent: 0,
      errors: searchResult.errors
    })
  }

  if (!active || pending.length === 0) {
    return NextResponse.json({
      ok: true,
      found: searchResult.bids.length,
      newItems: pending.length,
      duplicates,
      sent: 0,
      telegramEnabled: config.telegramEnabled,
      hasChatId: Boolean(chatId),
      hasToken: Boolean(token),
      errors: searchResult.errors
    })
  }

  let sent = 0
  const telegramErrors: string[] = []
  for (const items of chunk(pending, 8)) {
    const response = await sendTelegramMessage({
      chatId,
      token,
      text: formatTelegramMessage(items)
    })

    if (response?.ok) sent += items.length
    else telegramErrors.push(response?.description || 'Telegram send failed')
  }

  return NextResponse.json({
    ok: telegramErrors.length === 0,
    found: searchResult.bids.length,
    newItems: pending.length,
    duplicates,
    sent,
    errors: [...searchResult.errors, ...telegramErrors]
  })
}
