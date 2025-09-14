/**
 * Nara 입찰 모니터링 서비스
 */

import type { BidItem, MonitoringStatus, SearchResult, MonitoringConfig } from './types'
import { naraConfigManager } from './config'

export class NaraMonitoringService {
  private isRunning = false
  private intervalId: NodeJS.Timeout | null = null
  private bids: BidItem[] = []
  private lastCheck: Date | null = null
  private errors: string[] = []

  constructor() {
    // 초기화
  }

  /**
   * 모니터링 시작
   */
  async start(config: MonitoringConfig): Promise<boolean> {
    try {
      if (this.isRunning) {
        console.log('모니터링이 이미 실행 중입니다')
        return true
      }

      // 설정 업데이트
      naraConfigManager.update({
        keywords: config.keywords,
        enableTelegramNotifications: config.telegramEnabled,
        telegramChatId: config.telegramChatId
      })

      this.isRunning = true
      this.errors = []

      // 즉시 한 번 검색 실행
      await this.performSearch()

      // 주기적 검색 설정
      const intervalMs = config.checkInterval * 1000
      this.intervalId = setInterval(async () => {
        await this.performSearch()
      }, intervalMs)

      console.log(`모니터링 시작: ${config.checkInterval}초 간격`)
      return true
    } catch (error) {
      console.error('모니터링 시작 실패:', error)
      this.isRunning = false
      return false
    }
  }

  /**
   * 모니터링 중지
   */
  stop(): boolean {
    try {
      if (this.intervalId) {
        clearInterval(this.intervalId)
        this.intervalId = null
      }

      this.isRunning = false
      console.log('모니터링 중지')
      return true
    } catch (error) {
      console.error('모니터링 중지 실패:', error)
      return false
    }
  }

  /**
   * 검색 실행
   */
  private async performSearch(): Promise<void> {
    try {
      this.lastCheck = new Date()
      const config = naraConfigManager.getSearchConfig()
      const newBids: BidItem[] = []

      // 모의 데이터 생성 (실제로는 API 호출)
      const mockBids: BidItem[] = [
        {
          id: `bid-${Date.now()}-1`,
          title: '전력케이블 공급계약',
          company: 'ABC전력',
          price: '15,000,000원',
          deadline: '2024-01-15',
          status: 'active',
          url: 'https://naramarket.com/bid/1',
          source: 'naramarket',
          createdAt: new Date().toISOString(),
          description: '고압 전력케이블 공급계약',
          location: '서울',
          category: '전기'
        }
      ]

      // 새 입찰공고가 있으면 추가
      if (mockBids.length > 0) {
        this.bids = [...this.bids, ...mockBids]
      }

      // 에러 로그 정리 (최근 100개만 유지)
      if (this.errors.length > 100) {
        this.errors = this.errors.slice(-100)
      }

    } catch (error) {
      console.error('검색 실행 실패:', error)
      this.errors.push(`검색 실행 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    }
  }

  /**
   * 모니터링 상태 조회
   */
  getStatus(): MonitoringStatus {
    const nextCheck = this.intervalId ? 
      new Date(Date.now() + naraConfigManager.get('searchIntervalHours') * 60 * 60 * 1000) : 
      null

    return {
      enabled: this.isRunning,
      lastCheck: this.lastCheck?.toISOString() || null,
      totalBids: this.bids.length,
      newBids: this.bids.filter(bid => {
        const createdAt = new Date(bid.createdAt)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
        return createdAt > oneHourAgo
      }).length,
      errors: [...this.errors],
      nextCheck: nextCheck?.toISOString() || null
    }
  }

  /**
   * 입찰공고 목록 조회
   */
  getBids(): BidItem[] {
    return [...this.bids]
  }

  /**
   * 특정 키워드로 필터링된 입찰공고 조회
   */
  getBidsByKeywords(keywords: string[]): BidItem[] {
    if (keywords.length === 0) return this.bids

    return this.bids.filter(bid => {
      const searchText = `${bid.title} ${bid.description || ''} ${bid.category || ''}`.toLowerCase()
      return keywords.some(keyword => 
        searchText.includes(keyword.toLowerCase())
      )
    })
  }

  /**
   * 입찰공고 상태별 조회
   */
  getBidsByStatus(status: 'active' | 'closed' | 'upcoming'): BidItem[] {
    return this.bids.filter(bid => bid.status === status)
  }

  /**
   * 입찰공고 소스별 조회
   */
  getBidsBySource(source: 'naramarket' | 'korail'): BidItem[] {
    return this.bids.filter(bid => bid.source === source)
  }

  /**
   * 입찰공고 정리 (오래된 것 제거)
   */
  cleanup(daysToKeep = 30): void {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000)
    this.bids = this.bids.filter(bid => new Date(bid.createdAt) > cutoffDate)
    console.log(`입찰공고 정리 완료: ${daysToKeep}일 이전 데이터 제거`)
  }

  /**
   * 에러 로그 조회
   */
  getErrors(): string[] {
    return [...this.errors]
  }

  /**
   * 에러 로그 정리
   */
  clearErrors(): void {
    this.errors = []
  }
}

// 전역 모니터링 서비스 인스턴스
export const naraMonitoringService = new NaraMonitoringService()
