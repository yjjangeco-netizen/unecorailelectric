/**
 * Nara 입찰 모니터링 설정 관리
 */

export interface NaraConfig {
  // 검색 설정
  keywords: string[]
  searchIntervalHours: number
  immediateSearchDays: number
  
  // API 설정
  naramarketApiKey: string
  telegramBotToken: string
  telegramChatId: string
  
  // 업무시간 설정
  workHoursStart: number
  workHoursEnd: number
  workDays: number[] // 0=월요일
  
  // 시스템 설정
  headlessMode: boolean
  maxRetries: number
  timeoutSeconds: number
  logLevel: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  
  // 모니터링 설정
  enableTelegramNotifications: boolean
  enableScreenshotCapture: boolean
  maxLogEntries: number
  cleanupOldLogsDays: number
  
  // 성능 설정
  maxConcurrentSearches: number
  searchDelaySeconds: number
  memoryCleanupIntervalHours: number
}

export class NaraConfigManager {
  private config: NaraConfig
  private configKey = 'nara-monitoring-config'

  constructor() {
    this.config = this.getDefaultConfig()
    this.loadConfig()
  }

  private getDefaultConfig(): NaraConfig {
    return {
      // 검색 설정
      keywords: ['전기', '전력', '케이블', '변압기'],
      searchIntervalHours: 3,
      immediateSearchDays: 30,
      
      // API 설정
      naramarketApiKey: '',
      telegramBotToken: '',
      telegramChatId: '',
      
      // 업무시간 설정
      workHoursStart: 8,
      workHoursEnd: 19,
      workDays: [0, 1, 2, 3, 4], // 월-금
      
      // 시스템 설정
      headlessMode: true,
      maxRetries: 3,
      timeoutSeconds: 30,
      logLevel: 'INFO',
      
      // 모니터링 설정
      enableTelegramNotifications: true,
      enableScreenshotCapture: true,
      maxLogEntries: 1000,
      cleanupOldLogsDays: 30,
      
      // 성능 설정
      maxConcurrentSearches: 2,
      searchDelaySeconds: 1,
      memoryCleanupIntervalHours: 6
    }
  }

  private loadConfig(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.configKey)
        if (stored) {
          const parsed = JSON.parse(stored)
          this.config = { ...this.config, ...parsed }
        }
      }
    } catch (error) {
      console.error('설정 로드 실패:', error)
    }
  }

  saveConfig(): boolean {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.configKey, JSON.stringify(this.config))
      }
      return true
    } catch (error) {
      console.error('설정 저장 실패:', error)
      return false
    }
  }

  get<K extends keyof NaraConfig>(key: K): NaraConfig[K] {
    return this.config[key]
  }

  set<K extends keyof NaraConfig>(key: K, value: NaraConfig[K]): boolean {
    try {
      this.config[key] = value
      this.validateConfig()
      return true
    } catch (error) {
      console.error(`설정값 설정 실패: ${key} = ${value}`, error)
      return false
    }
  }

  update(updates: Partial<NaraConfig>): boolean {
    try {
      this.config = { ...this.config, ...updates }
      this.validateConfig()
      return true
    } catch (error) {
      console.error('설정값 일괄 업데이트 실패:', error)
      return false
    }
  }

  private validateConfig(): void {
    const errors: string[] = []

    // 숫자 범위 검증
    if (!(1 <= this.config.searchIntervalHours && this.config.searchIntervalHours <= 24)) {
      errors.push('검색 주기는 1-24시간 사이여야 합니다')
    }

    if (!(1 <= this.config.immediateSearchDays && this.config.immediateSearchDays <= 365)) {
      errors.push('즉시 검색 기간은 1-365일 사이여야 합니다')
    }

    if (!(0 <= this.config.workHoursStart && this.config.workHoursStart <= 23)) {
      errors.push('업무 시작 시간은 0-23 사이여야 합니다')
    }

    if (!(0 <= this.config.workHoursEnd && this.config.workHoursEnd <= 23)) {
      errors.push('업무 종료 시간은 0-23 사이여야 합니다')
    }

    if (this.config.workHoursStart >= this.config.workHoursEnd) {
      errors.push('업무 시작 시간은 종료 시간보다 빨라야 합니다')
    }

    // 키워드 검증
    if (!Array.isArray(this.config.keywords) || this.config.keywords.length === 0) {
      errors.push('검색 키워드는 최소 1개 이상이어야 합니다')
    }

    if (errors.length > 0) {
      throw new Error(`설정 검증 실패: ${errors.join('; ')}`)
    }
  }

  isWorkTime(): boolean {
    const now = new Date()
    const currentHour = now.getHours()
    const currentWeekday = now.getDay() - 1 // JavaScript는 일요일이 0, 월요일이 1

    return (
      this.config.workDays.includes(currentWeekday) &&
      this.config.workHoursStart <= currentHour &&
      currentHour < this.config.workHoursEnd
    )
  }

  getTelegramConfig() {
    return {
      botToken: this.config.telegramBotToken,
      chatId: this.config.telegramChatId
    }
  }

  getSearchConfig() {
    return {
      keywords: this.config.keywords,
      intervalHours: this.config.searchIntervalHours,
      immediateDays: this.config.immediateSearchDays
    }
  }

  getSystemConfig() {
    return {
      headlessMode: this.config.headlessMode,
      maxRetries: this.config.maxRetries,
      timeoutSeconds: this.config.timeoutSeconds,
      logLevel: this.config.logLevel
    }
  }

  getAll(): NaraConfig {
    return { ...this.config }
  }

  resetToDefault(): boolean {
    try {
      this.config = this.getDefaultConfig()
      return true
    } catch (error) {
      console.error('기본 설정으로 초기화 실패:', error)
      return false
    }
  }
}

// 전역 설정 관리자 인스턴스
export const naraConfigManager = new NaraConfigManager()

// 편의 함수들
export const getNaraConfig = <K extends keyof NaraConfig>(key: K): NaraConfig[K] => {
  return naraConfigManager.get(key)
}

export const setNaraConfig = <K extends keyof NaraConfig>(key: K, value: NaraConfig[K]): boolean => {
  return naraConfigManager.set(key, value)
}

export const updateNaraConfig = (updates: Partial<NaraConfig>): boolean => {
  return naraConfigManager.update(updates)
}

export const isNaraWorkTime = (): boolean => {
  return naraConfigManager.isWorkTime()
}
