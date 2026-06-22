export interface TelegramInlineButton {
  text: string
  callback_data?: string
  url?: string
}

export interface TelegramSendMessageOptions {
  chatId: number | string
  text: string
  replyMarkup?: {
    inline_keyboard: TelegramInlineButton[][]
  }
  token?: string
}

export interface TelegramMessage {
  message_id: number
  text?: string
  chat: {
    id: number
    type: string
  }
  from?: {
    id: number
    is_bot: boolean
    first_name?: string
    last_name?: string
    username?: string
  }
}

export interface TelegramCallbackQuery {
  id: string
  data?: string
  message?: TelegramMessage
  from: {
    id: number
    is_bot: boolean
    first_name?: string
    last_name?: string
    username?: string
  }
}

export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
  callback_query?: TelegramCallbackQuery
}

export async function sendTelegramMessage(options: TelegramSendMessageOptions) {
  const token = options.token || process.env['TELEGRAM_BOT_TOKEN']

  if (!token) {
    console.warn('TELEGRAM_BOT_TOKEN is not configured.')
    return { ok: false, description: 'Telegram bot token is not configured.' }
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: options.chatId,
      text: options.text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: options.replyMarkup
    })
  })

  return response.json()
}

export async function answerTelegramCallbackQuery(callbackQueryId: string, customToken?: string) {
  const token = customToken || process.env['TELEGRAM_BOT_TOKEN']

  if (!token) return

  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId })
  })
}
