import { supabaseServer } from '@/lib/supabaseServer'
import { sendTelegramMessage } from '@/lib/telegram'

type TelegramTarget = 'personal' | 'work'

async function getTelegramChatId(target: TelegramTarget) {
  const envKey = target === 'personal' ? 'TELEGRAM_PERSONAL_CHAT_ID' : 'TELEGRAM_WORK_CHAT_ID'
  const fromEnv = process.env[envKey]
  if (fromEnv) return fromEnv

  if (target === 'personal') {
    const { data } = await supabaseServer
      .from('telegram_users')
      .select('chat_id')
      .eq('linked_user_id', 'yjjang')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return data?.chat_id || null
  }

  return null
}

export async function notifyTelegram(target: TelegramTarget, text: string) {
  const chatId = await getTelegramChatId(target)
  if (!chatId) {
    return { ok: false, skipped: true, reason: `${target} telegram chat is not configured.` }
  }

  return sendTelegramMessage({ chatId, text })
}

export async function notifyPersonalAiDone(title: string, detail?: string) {
  return notifyTelegram('personal', [
    '<b>AI 작업 완료</b>',
    title,
    detail || ''
  ].filter(Boolean).join('\n'))
}

export async function notifyWorkUpdate(title: string, detail?: string) {
  return notifyTelegram('work', [
    '<b>업무 업데이트</b>',
    title,
    detail || ''
  ].filter(Boolean).join('\n'))
}
