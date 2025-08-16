import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { log } from './logger'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 통화 형식으로 포맷팅
 */
export const formatCurrency = (amount: number): string => {
  try {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  } catch (error) {
    log.warn('통화 포맷팅 오류', 'formatCurrency', { amount, error })
    return `${amount.toLocaleString()}원`
  }
}

/**
 * 재고 상태에 따른 색상 반환
 */
export const getStockStatusColor = (status: string): string => {
  switch (status) {
    case 'low_stock':
      return 'text-red-600'
    case 'normal':
      return 'text-green-600'
    default:
      return 'text-gray-600'
  }
}

/**
 * 재고 상태에 따른 배경색 반환
 */
export const getStockStatusBgColor = (status: string): string => {
  switch (status) {
    case 'low_stock':
      return 'bg-red-100'
    case 'normal':
      return 'bg-green-100'
    default:
      return 'bg-gray-100'
  }
}

/**
 * 날짜 형식으로 포맷팅
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date string')
    }
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    log.warn('날짜 포맷팅 오류', 'formatDate', { dateString, error })
    return '날짜 오류'
  }
}

/**
 * 날짜와 시간 형식으로 포맷팅
 */
export const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date string')
    }
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    log.warn('날짜시간 포맷팅 오류', 'formatDateTime', { dateString, error })
    return '날짜시간 오류'
  }
}

/**
 * 안전한 숫자 변환
 */
export const safeParseInt = (value: string | number, defaultValue: number = 0): number => {
  try {
    if (typeof value === 'number') {
      return value
    }
    const parsed = parseInt(value, 10)
    return isNaN(parsed) ? defaultValue : parsed
  } catch (error) {
    log.warn('정수 변환 오류', 'safeParseInt', { value, defaultValue, error })
    return defaultValue
  }
}

/**
 * 안전한 실수 변환
 */
export const safeParseFloat = (value: string | number, defaultValue: number = 0): number => {
  try {
    if (typeof value === 'number') {
      return value
    }
    const parsed = parseFloat(value)
    return isNaN(parsed) ? defaultValue : parsed
  } catch (error) {
    log.warn('실수 변환 오류', 'safeParseFloat', { value, defaultValue, error })
    return defaultValue
  }
}

/**
 * 입력값 검증
 */
export const validateInput = {
  required: (value: string): boolean => value.trim().length > 0,
  minLength: (value: string, min: number): boolean => value.trim().length >= min,
  maxLength: (value: string, max: number): boolean => value.trim().length <= max,
  email: (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  phone: (value: string): boolean => /^[0-9-+\s()]+$/.test(value),
  number: (value: string): boolean => !isNaN(Number(value)) && value.trim() !== '',
  positiveNumber: (value: string): boolean => {
    const num = Number(value)
    return !isNaN(num) && num > 0
  }
}

/**
 * 에러 로깅
 */
export const logError = (context: string, error: unknown, additionalInfo?: Record<string, unknown>): void => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    context,
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error,
    additionalInfo,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
    url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
  }
  
  log.error(context, error instanceof Error ? error : new Error(String(error)), {
    ...additionalInfo,
    timestamp: errorInfo.timestamp,
    userAgent: errorInfo.userAgent,
    url: errorInfo.url
  })
}

/**
 * 성능 측정
 */
export const measurePerformance = <T>(name: string, fn: () => T): T => {
  const start = performance.now()
  try {
    const result = fn()
    const end = performance.now()
    log.debug(`${name} 실행 완료`, 'Performance', { executionTime: `${(end - start).toFixed(2)}ms` })
    return result
  } catch (error) {
    const end = performance.now()
    log.error(`${name} 실행 실패`, error instanceof Error ? error : new Error(String(error)), { executionTime: `${(end - start).toFixed(2)}ms` })
    throw error
  }
}

/**
 * 비동기 성능 측정
 */
export const measureAsyncPerformance = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  const start = performance.now()
  try {
    const result = await fn()
    const end = performance.now()
    log.debug(`${name} 실행 완료`, 'AsyncPerformance', { executionTime: `${(end - start).toFixed(2)}ms` })
    return result
  } catch (error) {
    const end = performance.now()
    log.error(`${name} 실행 실패`, error instanceof Error ? error : new Error(String(error)), { executionTime: `${(end - start).toFixed(2)}ms` })
    throw error
  }
}

/**
 * 디바운스 함수
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {clearTimeout(timeout)}
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * 스로틀 함수
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * 로컬 스토리지 안전한 접근
 */
export const safeLocalStorage = {
  get: (key: string): string | null => {
    try {
      return localStorage.getItem(key)
    } catch (error) {
      log.warn('localStorage 접근 오류', 'SafeLocalStorage', { key, error })
      return null
    }
  },
  
  set: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      log.warn('localStorage 저장 오류', 'SafeLocalStorage', { key, value, error })
      return false
    }
  },
  
  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      log.warn('localStorage 삭제 오류', 'SafeLocalStorage', { key, error })
      return false
    }
  },
  
  clear: (): boolean => {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      log.warn('localStorage 초기화 오류', 'SafeLocalStorage', { error })
      return false
    }
  }
} 