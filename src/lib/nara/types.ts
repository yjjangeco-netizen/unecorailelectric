/**
 * Nara 입찰 모니터링 관련 타입 정의
 */

export interface BidItem {
  id: string
  title: string
  company: string
  price: string
  deadline: string
  status: 'active' | 'closed' | 'upcoming'
  url: string
  source: 'naramarket' | 'korail'
  createdAt: string
  description?: string
  location?: string
  category?: string
}

export interface MonitoringStatus {
  enabled: boolean
  lastCheck: string | null
  totalBids: number
  newBids: number
  errors: string[]
  nextCheck: string | null
}

export interface SearchResult {
  success: boolean
  bids: BidItem[]
  errors: string[]
  timestamp: string
  source: 'naramarket' | 'korail'
}

export interface TelegramNotification {
  enabled: boolean
  botToken: string
  chatId: string
  lastSent: string | null
  totalSent: number
}

export interface LogEntry {
  id: string
  timestamp: string
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  message: string
  source: string
  data?: any
}

export interface CrawlerConfig {
  headless: boolean
  timeout: number
  retries: number
  delay: number
  userAgent?: string
}

export interface NaraMarketApiResponse {
  success: boolean
  data: {
    items: Array<{
      id: string
      title: string
      company: string
      price: string
      deadline: string
      url: string
      description: string
      location: string
      category: string
    }>
    total: number
    page: number
    limit: number
  }
  error?: string
}

export interface KorailCrawlResult {
  success: boolean
  bids: BidItem[]
  errors: string[]
  timestamp: string
}

export interface MonitoringConfig {
  enabled: boolean
  keywords: string[]
  checkInterval: number
  telegramEnabled: boolean
  telegramChatId: string
  sources: ('naramarket' | 'korail')[]
  workHoursOnly: boolean
}
