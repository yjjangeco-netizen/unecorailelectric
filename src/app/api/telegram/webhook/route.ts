import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { analyzeConversationText, defaultAssistantSettings } from '@/lib/assistantAutomation'
import { applyAssistantAnalysis } from '@/lib/assistantApply'
import { isAssistantOwner } from '@/lib/assistantAccess'
import { syncAssistantCalendar } from '@/lib/assistantGoogle'
import {
  answerTelegramCallbackQuery,
  sendTelegramMessage,
  type TelegramUpdate
} from '@/lib/telegram'
import {
  buildCalendarBrief,
  buildMissingDiaryBrief,
  getAssistantKeyboard,
  getHelpMessage,
  getLinkedAssistantUser,
  getTodayRange,
  getWeekRange,
  isTelegramChatAllowed,
  linkTelegramChat,
  parseAssistantCommand,
  registerTelegramChat
} from '@/lib/assistantTelegram'

export const dynamic = 'force-dynamic'

function verifyTelegramSecret(request: NextRequest) {
  const expected = process.env['TELEGRAM_WEBHOOK_SECRET']
  if (!expected) return true

  return request.headers.get('x-telegram-bot-api-secret-token') === expected
}

function getMessageText(update: TelegramUpdate) {
  if (update.callback_query?.data) return update.callback_query.data
  return update.message?.text || ''
}

function getChatId(update: TelegramUpdate) {
  return update.message?.chat.id || update.callback_query?.message?.chat.id
}

function getTelegramUser(update: TelegramUpdate) {
  return update.message?.from || update.callback_query?.from
}

async function reply(chatId: number | string, text: string) {
  await sendTelegramMessage({
    chatId,
    text,
    replyMarkup: getAssistantKeyboard()
  })
}

function isConversationCandidate(text: string) {
  const trimmed = text.trim()
  if (trimmed.length < 8) return false
  if (trimmed.startsWith('/')) return false
  return /(했다|한다|하기로|잡기로|까지|보내|정리|회의|미팅|점검|일정|통화|방문|출장|해야|확인|준비|마감)/.test(trimmed)
}

async function getAssistantSettings(userId: string) {
  const { data } = await supabaseServer
    .from('assistant_settings')
    .select('settings')
    .eq('user_id', userId)
    .maybeSingle()

  return {
    ...defaultAssistantSettings,
    ...(data?.settings || {})
  }
}

async function analyzeTelegramConversation(params: {
  chatId: number | string
  user: { id: string; username?: string; email?: string; name: string; level: string }
  text: string
}) {
  if (!isAssistantOwner(params.user)) {
    await reply(params.chatId, '대화 자동 분석은 yjjang 개인 계정으로 연결된 채팅에서만 작동합니다.')
    return true
  }

  const settings = await getAssistantSettings(params.user.id)

  if (!settings.conversation_analysis && !settings.auto_todo_extract && !settings.auto_calendar_create) {
    return false
  }

  const analysis = analyzeConversationText(params.text)
  const { data: log, error } = await supabaseServer
    .from('assistant_analysis_logs')
    .insert({
      user_id: params.user.id,
      source_type: 'telegram',
      source_title: '텔레그램 자동 수집',
      source_uri: `telegram:${params.chatId}`,
      raw_text: params.text,
      summary: analysis.summary,
      decisions: analysis.decisions,
      todos: analysis.todos,
      events: analysis.events,
      improvements: analysis.improvements,
      risks: analysis.risks,
      status: 'analyzed'
    })
    .select()
    .single()

  if (error) {
    await reply(params.chatId, `대화는 받았지만 분석 저장에 실패했습니다.\n${error.message}`)
    return true
  }

  const applied = await applyAssistantAnalysis({
    userId: params.user.id,
    userName: params.user.name,
    userLevel: params.user.level,
    summary: analysis.summary,
    todos: analysis.todos,
    events: analysis.events,
    createTodos: settings.auto_todo_extract,
    createEvents: settings.auto_calendar_create
  })

  if (applied.eventCount > 0 && settings.google_calendar_sync) {
    try {
      await syncAssistantCalendar(params.user)
    } catch (syncError) {
      console.warn('Telegram assistant Google sync skipped:', syncError)
    }
  }

  const status = applied.todoCount > 0 || applied.eventCount > 0 ? 'applied' : 'analyzed'
  await supabaseServer
    .from('assistant_analysis_logs')
    .update({ status })
    .eq('id', log.id)

  const lines = [
    '<b>대화 자동 분석 완료</b>',
    '',
    `요약: ${analysis.summary || '요약 없음'}`,
    `할 일: ${analysis.todos.length}건${settings.auto_todo_extract ? ` / 자동 반영 ${applied.todoCount}건` : ''}`,
    `일정: ${analysis.events.length}건${settings.auto_calendar_create ? ` / 자동 반영 ${applied.eventCount}건` : ' / 자동 등록 꺼짐'}`,
    '',
    settings.auto_calendar_create
      ? '일정 자동 등록이 켜져 있어 명확한 일정만 캘린더에 넣었습니다.'
      : '일정 자동 등록은 꺼져 있어 후보만 저장했습니다.'
  ]

  await reply(params.chatId, lines.join('\n'))
  return true
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyTelegramSecret(request)) {
      return NextResponse.json({ ok: false, error: 'Invalid Telegram secret' }, { status: 401 })
    }

    const update = await request.json() as TelegramUpdate
    const chatId = getChatId(update)

    if (!chatId) {
      return NextResponse.json({ ok: true })
    }

    if (!isTelegramChatAllowed(chatId)) {
      await sendTelegramMessage({
        chatId,
        text: '허용되지 않은 텔레그램 채팅입니다. 관리자에게 chat_id 등록을 요청하세요.'
      })
      return NextResponse.json({ ok: true })
    }

    if (update.callback_query?.id) {
      await answerTelegramCallbackQuery(update.callback_query.id)
    }

    const telegramUser = getTelegramUser(update)
    await registerTelegramChat({
      chatId,
      telegramUserId: telegramUser?.id,
      username: telegramUser?.username,
      firstName: telegramUser?.first_name
    })

    const rawText = getMessageText(update)
    const command = parseAssistantCommand(rawText)

    if (command === 'start') {
      await reply(chatId, getHelpMessage())
      return NextResponse.json({ ok: true })
    }

    if (command === 'help') {
      await reply(chatId, getHelpMessage())
      return NextResponse.json({ ok: true })
    }

    if (command === 'link') {
      const [, userId, linkCode] = rawText.trim().split(/\s+/)

      if (!userId) {
        await reply(chatId, '사용법: /link 사용자ID 연결코드')
        return NextResponse.json({ ok: true })
      }

      const result = await linkTelegramChat({
        chatId,
        telegramUserId: telegramUser?.id,
        userId,
        linkCode
      })
      await reply(chatId, result.message)
      return NextResponse.json({ ok: true })
    }

    const user = await getLinkedAssistantUser(chatId)

    if (!user) {
      await reply(chatId, '아직 웹 계정과 연결되지 않았습니다.\n/link 사용자ID 연결코드 로 먼저 연결해주세요.')
      return NextResponse.json({ ok: true })
    }

    if (command === 'today') {
      await reply(chatId, await buildCalendarBrief(user, getTodayRange()))
      return NextResponse.json({ ok: true })
    }

    if (command === 'week') {
      await reply(chatId, await buildCalendarBrief(user, getWeekRange()))
      return NextResponse.json({ ok: true })
    }

    if (command === 'missing') {
      await reply(chatId, await buildMissingDiaryBrief(user))
      return NextResponse.json({ ok: true })
    }

    if (isConversationCandidate(rawText)) {
      const handled = await analyzeTelegramConversation({
        chatId,
        user,
        text: rawText
      })

      if (handled) {
        return NextResponse.json({ ok: true })
      }
    }

    await reply(chatId, getHelpMessage())
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    name: 'Telegram assistant webhook',
    requiredEnv: [
      'TELEGRAM_BOT_TOKEN',
      'TELEGRAM_WEBHOOK_SECRET',
      'TELEGRAM_LINK_CODE'
    ]
  })
}
