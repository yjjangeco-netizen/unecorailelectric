import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/utils'

// Rate Limiting 설정
interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests: boolean
  skipFailedRequests: boolean
}

// IP별 요청 추적
const requestCounts = new Map<string, { count: number; resetTime: number }>()

// 기본 설정
const defaultConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15분
  maxRequests: 100, // 최대 100개 요청
  skipSuccessfulRequests: false,
  skipFailedRequests: false
}

// 로그인 전용 설정 (더 엄격)
const loginConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15분
  maxRequests: 5, // 최대 5번 로그인 시도
  skipSuccessfulRequests: true,
  skipFailedRequests: false
}

// API 전용 설정
const apiConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1분
  maxRequests: 30, // 최대 30개 요청
  skipSuccessfulRequests: false,
  skipFailedRequests: false
}

export function createRateLimiter(config: RateLimitConfig) {
  return function rateLimiter(request: NextRequest): NextResponse | null {
    const ip = getClientIP(request)
    const now = Date.now()
    
    // IP 추적 정보 가져오기
    const ipData = requestCounts.get(ip)
    
    if (!ipData || now > ipData.resetTime) {
      // 새로운 윈도우 시작
      requestCounts.set(ip, {
        count: 1,
        resetTime: now + config.windowMs
      })
      return null
    }
    
    // 요청 수 증가
    ipData.count++
    
    if (ipData.count > config.maxRequests) {
      // Rate limit 초과
      logError('Rate limit 초과', new Error(`IP ${ip}에서 rate limit 초과`), {
        ip,
        count: ipData.count,
        maxRequests: config.maxRequests,
        windowMs: config.windowMs
      })
      
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
          retryAfter: Math.ceil(config.windowMs / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(config.windowMs / 1000).toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(ipData.resetTime).toISOString()
          }
        }
      )
    }
    
    // Rate limit 헤더 추가
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', (config.maxRequests - ipData.count).toString())
    response.headers.set('X-RateLimit-Reset', new Date(ipData.resetTime).toISOString())
    
    return null
  }
}

// 클라이언트 IP 추출
function getClientIP(request: NextRequest): string {
  // X-Forwarded-For 헤더 확인 (프록시 환경)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return (forwardedFor.split(',')[0] || '').trim()
  }
  
  // X-Real-IP 헤더 확인
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  // 기본 IP (개발 환경)
  return (request as any).ip || '127.0.0.1'
}

// 로그인 전용 Rate Limiter
export const loginRateLimiter = createRateLimiter(loginConfig)

// API 전용 Rate Limiter
export const apiRateLimiter = createRateLimiter(apiConfig)

// 기본 Rate Limiter
export const defaultRateLimiter = createRateLimiter(defaultConfig)

// Rate Limiting 미들웨어
export function rateLimitMiddleware(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname
  
  // 로그인 경로는 더 엄격한 제한
  if (pathname === '/api/auth/login' || pathname === '/api/auth/signin') {
    return loginRateLimiter(request)
  }
  
  // API 경로는 중간 제한
  if (pathname.startsWith('/api/')) {
    return apiRateLimiter(request)
  }
  
  // 기타 경로는 기본 제한
  return defaultRateLimiter(request)
}

// 정기적인 메모리 정리 (메모리 누수 방지)
setInterval(() => {
  const now = Date.now()
  for (const [ip, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(ip)
    }
  }
}, 60 * 1000) // 1분마다 정리
