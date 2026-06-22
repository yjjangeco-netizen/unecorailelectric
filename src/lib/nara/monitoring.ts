import type { BidItem, MonitoringConfig, MonitoringStatus } from './types'
import { naraConfigManager } from './config'
import { getNaraItemKey, searchKorailBids } from './korailSearch'
import { sendTelegramMessage } from '@/lib/telegram'
import { supabaseServer } from '@/lib/supabaseServer'

export class NaraMonitoringService {
  private isRunning = false
  private intervalId: ReturnType<typeof setInterval> | null = null
  private bids: BidItem[] = []
  private lastCheck: Date | null = null
  private errors: string[] = []
  private notifiedKeys = new Set<string>()
  /** start() 시 받은 config를 직접 보관 (서버 메모리 싱글턴에 의존하지 않기 위함) */
  private activeConfig: MonitoringConfig | null = null

  async start(config: MonitoringConfig): Promise<boolean> {
    try {
      if (this.intervalId) clearInterval(this.intervalId)

      // 서버 메모리에 config 직접 보관 (싱글턴 동기화에 의존 안 함)
      this.activeConfig = { ...config }

      naraConfigManager.update({
        keywords: config.keywords,
        enableTelegramNotifications: config.telegramEnabled,
        telegramBotToken: config.telegramBotToken || '',
        telegramChatId: config.telegramChatId,
        naramarketApiKey: config.naraMarketApiKey || ''
      })

      this.isRunning = true
      this.errors = []
      this.bids = []
      await this.refreshNow({ notify: false })

      const intervalMs = Math.max(10, config.checkInterval || 30) * 1000
      this.intervalId = setInterval(() => {
        this.refreshNow().catch((error) => {
          this.errors.push(error instanceof Error ? error.message : 'NARA 검색 실패')
        })
      }, intervalMs)

      return true
    } catch (error) {
      this.isRunning = false
      this.errors.push(error instanceof Error ? error.message : 'NARA 모니터링 시작 실패')
      return false
    }
  }

  stop(): boolean {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    return true
  }

  async refreshNow(options: { notify?: boolean } = {}): Promise<BidItem[]> {
    this.lastCheck = new Date()

    // 1) DB(Supabase)에서 최신 설정을 동기적으로 로드하여 런타임 매니저 및 activeConfig 동기화
    try {
      const { data, error } = await supabaseServer
        .from('app_settings')
        .select('value')
        .eq('key', 'nara-monitoring')
        .maybeSingle()

      if (!error && data?.value) {
        const dbConfig = data.value
        naraConfigManager.update({
          keywords: dbConfig.keywords,
          enableTelegramNotifications: dbConfig.telegramEnabled,
          telegramBotToken: dbConfig.telegramBotToken,
          telegramChatId: dbConfig.telegramChatId,
          naramarketApiKey: dbConfig.naraMarketApiKey
        })
        if (this.activeConfig) {
          this.activeConfig.keywords = dbConfig.keywords
          this.activeConfig.telegramEnabled = dbConfig.telegramEnabled
          this.activeConfig.telegramChatId = dbConfig.telegramChatId
          this.activeConfig.naraMarketApiKey = dbConfig.naraMarketApiKey
          this.activeConfig.checkInterval = dbConfig.checkInterval || 30
          // activeConfig 인터페이스에 telegramBotToken이 필요하므로 동적 바인딩
          ;(this.activeConfig as any).telegramBotToken = dbConfig.telegramBotToken
        } else {
          this.activeConfig = {
            enabled: true,
            keywords: dbConfig.keywords,
            telegramEnabled: dbConfig.telegramEnabled,
            telegramChatId: dbConfig.telegramChatId,
            naraMarketApiKey: dbConfig.naraMarketApiKey,
            checkInterval: dbConfig.checkInterval || 30,
            sources: ['korail', 'naramarket'],
            workHoursOnly: false
          }
          ;(this.activeConfig as any).telegramBotToken = dbConfig.telegramBotToken
        }
      }
    } catch (dbError) {
      console.error('[NaraMonitoringService] DB 설정 동기화 실패:', dbError)
    }

    // activeConfig에서 키워드 사용. 없으면 naraConfigManager fallback
    const keywords = this.activeConfig?.keywords ?? naraConfigManager.getSearchConfig().keywords
    const result = await searchKorailBids(keywords, { naraMarketApiKey: this.activeConfig?.naraMarketApiKey })

    const next = new Map(this.bids.map((bid) => [bid.id, bid]))
    const newItems: BidItem[] = []

    result.bids.forEach((bid) => {
      if (!next.has(bid.id)) newItems.push(bid)
      next.set(bid.id, bid)
    })

    this.bids = Array.from(next.values())
    if (options.notify !== false) {
      await this.notifyNewItems(newItems)
    }

    this.errors.push(...result.errors)
    if (this.bids.length === 0 && result.errors.length === 0) {
      this.errors.push(`NARA 검색 결과가 없습니다. 검색 키워드: ${keywords.join(', ')}`)
    }
    if (this.errors.length > 100) this.errors = this.errors.slice(-100)

    return this.getBids()
  }

  getStatus(): MonitoringStatus {
    const intervalHours = naraConfigManager.get('searchIntervalHours')
    const nextCheck = this.isRunning ? new Date(Date.now() + intervalHours * 60 * 60 * 1000) : null

    return {
      enabled: this.isRunning,
      lastCheck: this.lastCheck?.toISOString() || null,
      totalBids: this.bids.length,
      newBids: this.bids.filter((bid) => {
        const createdAt = new Date(bid.createdAt)
        return createdAt.getTime() > Date.now() - 60 * 60 * 1000
      }).length,
      errors: [...this.errors],
      nextCheck: nextCheck?.toISOString() || null
    }
  }

  getBids(): BidItem[] {
    return [...this.bids].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  getBidsByKeywords(keywords: string[]): BidItem[] {
    const normalized = keywords.map((keyword) => keyword.toLowerCase())
    if (normalized.length === 0) return this.getBids()

    return this.getBids().filter((bid) => {
      const text = `${bid.title} ${bid.description || ''} ${bid.category || ''}`.toLowerCase()
      return normalized.some((keyword) => text.includes(keyword))
    })
  }

  getBidsByStatus(status: 'active' | 'closed' | 'upcoming'): BidItem[] {
    return this.getBids().filter((bid) => bid.status === status)
  }

  getBidsBySource(source: 'naramarket' | 'korail'): BidItem[] {
    return this.getBids().filter((bid) => bid.source === source)
  }

  cleanup(daysToKeep = 30): void {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000)
    this.bids = this.bids.filter((bid) => new Date(bid.createdAt) > cutoffDate)
  }

  getErrors(): string[] {
    return [...this.errors]
  }

  clearErrors(): void {
    this.errors = []
  }

  private async notifyNewItems(items: BidItem[]) {
    const telegramEnabled = naraConfigManager.get('enableTelegramNotifications')
    const token = naraConfigManager.get('telegramBotToken') || undefined
    const chatId = naraConfigManager.get('telegramChatId') || process.env['TELEGRAM_WORK_CHAT_ID']
    if (!telegramEnabled || !chatId || items.length === 0) return

    const unsent: BidItem[] = []
    for (const item of items) {
      if (await this.markNotificationPending(item)) unsent.push(item)
    }

    if (unsent.length === 0) return

    const chunks = chunkItems(unsent, 8)
    for (const chunk of chunks) {
      const text = [
        `<b>NARA 신규 검색 결과 ${chunk.length}건</b>`,
        ...chunk.map((item, index) => [
          '',
          `<b>${index + 1}. ${escapeHtml(item.title)}</b>`,
          `분류: ${escapeHtml(item.category || 'Korail')}`,
          item.deadline ? `마감/일자: ${escapeHtml(item.deadline)}` : '',
          item.price ? `금액: ${escapeHtml(item.price)}` : '',
          escapeHtml(item.url)
        ].filter(Boolean).join('\n'))
      ].join('\n')

      const result = await sendTelegramMessage({ chatId, text, token })
      if (!result?.ok) {
        this.errors.push(`텔레그램 전송 실패: ${result?.description || 'unknown error'}`)
      }
    }
  }

  private async markNotificationPending(item: BidItem) {
    const key = getNaraItemKey(item)
    if (this.notifiedKeys.has(key)) return false
    this.notifiedKeys.add(key)

    try {
      const { error } = await supabaseServer
        .from('nara_sent_notifications')
        .insert({
          item_key: key,
          title: item.title,
          category: item.category || null,
          url: item.url,
          sent_at: new Date().toISOString()
        })

      if (!error) return true
      if (error.code === '23505') return false

      // 테이블이 아직 없으면 메모리 중복 제거만 사용합니다.
      if (error.code === '42P01' || error.message?.includes('nara_sent_notifications')) return true

      console.warn(`NARA duplicate record failed: ${error.message}`)
      return true
    } catch (error) {
      console.warn(`NARA duplicate record failed: ${error instanceof Error ? error.message : 'unknown error'}`)
      return true
    }
  }
}

export const naraMonitoringService = new NaraMonitoringService()

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
