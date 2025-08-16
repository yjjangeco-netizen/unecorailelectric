import { env } from './env'

// 구조화된 로깅 시스템
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context: string
  data: Record<string, unknown>
  error: Error | undefined
}

class Logger {
  private logLevel: LogLevel = LogLevel.INFO

  constructor() {
    this.logLevel = this.getLogLevel()
  }

  private getLogLevel(): LogLevel {
    const level = env.LOG_LEVEL
    switch (level) {
      case 'error': return LogLevel.ERROR
      case 'warn': return LogLevel.WARN
      case 'info': return LogLevel.INFO
      case 'debug': return LogLevel.DEBUG
      default: return LogLevel.INFO
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 1,
      [LogLevel.WARN]: 2,
      [LogLevel.ERROR]: 3
    }
    
    return levels[level] >= levels[this.logLevel]
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context, data, error } = entry
    
    let logMessage = `[${timestamp}] ${level.toUpperCase()}`
    
    if (context) {
      logMessage += ` [${context}]`
    }
    
    logMessage += `: ${message}`
    
    if (data && Object.keys(data).length > 0) {
      logMessage += `\nData: ${JSON.stringify(data, null, 2)}`
    }
    
    if (error) {
      logMessage += `\nError: ${error.message}`
      if (error.stack) {
        logMessage += `\nStack: ${error.stack}`
      }
    }
    
    return logMessage
  }

  private log(level: LogLevel, message: string, context?: string, data?: Record<string, unknown>, error?: Error): void {
    if (!this.shouldLog(level)) {
      return
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context || '',
      data: data || {},
      error: error || undefined,
    }

    const formattedMessage = this.formatLog(entry)

    // 프로덕션에서는 외부 로깅 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger(entry)
    }

    // 콘솔 출력 (개발/테스트 환경)
    switch (level) {
      case LogLevel.DEBUG:
        console.warn(`[DEBUG] ${formattedMessage}`)
        break
      case LogLevel.INFO:
        console.warn(`[INFO] ${formattedMessage}`)
        break
      case LogLevel.WARN:
        console.warn(formattedMessage)
        break
      case LogLevel.ERROR:
        console.error(formattedMessage)
        break
    }
  }

  private sendToExternalLogger(entry: LogEntry): void {
    // TODO: 외부 로깅 서비스 (Sentry, DataDog 등) 연동
    // 현재는 개발 목적으로 콘솔에만 출력
    if (entry.level === 'error') {
      // 에러는 반드시 기록
      console.error(this.formatLog(entry))
    }
  }

  debug(message: string, context?: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context, data)
  }

  info(message: string, context?: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context, data)
  }

  warn(message: string, context?: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context, data)
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, undefined, data, error)
  }

  // 특정 컨텍스트용 로거 생성
  context(contextName: string) {
    return {
      debug: (message: string, data?: Record<string, unknown>) => 
        this.debug(message, contextName, data),
      info: (message: string, data?: Record<string, unknown>) => 
        this.info(message, contextName, data),
      warn: (message: string, data?: Record<string, unknown>) => 
        this.warn(message, contextName, data),
      error: (message: string, error?: Error, data?: Record<string, unknown>) => 
        this.error(message, error, data)
    }
  }
}

// 싱글톤 로거 인스턴스
export const logger = new Logger()

// 편의 함수들
export const log = {
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
  context: logger.context.bind(logger)
}

// 기존 logError 함수와의 호환성
export const logError = (context: string, error: unknown, additionalInfo?: Record<string, unknown>): void => {
  const errorObj = error instanceof Error ? error : new Error(String(error))
  logger.error(`${context}: ${errorObj.message}`, errorObj, additionalInfo)
}
