import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(_request: NextRequest) {
  const response = NextResponse.next()

  // 보안 헤더 설정
  const securityHeaders = {
    // XSS 방지
    'X-XSS-Protection': '1; mode=block',
    
    // MIME 타입 스니핑 방지
    'X-Content-Type-Options': 'nosniff',
    
    // 클릭재킹 방지
    'X-Frame-Options': 'SAMEORIGIN',
    
    // 리퍼러 정책
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // 권한 정책
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    
    // HSTS (HTTPS 강제)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  }

  // CSP (Content Security Policy) 설정
  const cspDirectives = [
    // 기본 소스 제한
    "default-src 'self'",
    
    // 스크립트 소스 (자체 도메인 + Supabase)
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://pnmyxzgyeipbvvnnwtoi.supabase.co",
    
    // 스타일 소스
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    
    // 폰트 소스
    "font-src 'self' https://fonts.gstatic.com",
    
    // 이미지 소스
    "img-src 'self' data: https: blob:",
    
    // 연결 소스 (Supabase API)
    "connect-src 'self' https://pnmyxzgyeipbvvnnwtoi.supabase.co https://*.supabase.co",
    
    // 프레임 소스 제한
    "frame-ancestors 'self'",
    
    // 객체 소스 제한
    "object-src 'none'",
    
    // 기본 URI 제한
    "base-uri 'self'",
    
    // 폼 액션 제한
    "form-action 'self'",
    
    // 업그레이드 인시큐어 요청
    "upgrade-insecure-requests",
  ]

  // 헤더 적용
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // CSP 헤더 설정
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '))

  return response
}

// 미들웨어 적용 경로 설정
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
