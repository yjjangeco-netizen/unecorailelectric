import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 공개 페이지들 (인증 불필요)
  const publicPaths = ['/', '/login', '/signup', '/debug-page']
  
  // API 경로는 제외
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  
  // 정적 파일들은 제외
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }
  
  // 공개 페이지가 아닌 경우 인증 체크
  if (!publicPaths.includes(pathname)) {
    // 쿠키에서 인증 토큰 확인
    const authToken = request.cookies.get('auth-token')?.value
    
    // console.log(`[Middleware] Path: ${pathname}, Token: ${authToken ? 'Present' : 'Missing'}`)
    
    if (!authToken) {
      // console.log(`[Middleware] Redirecting to login: ${pathname}`)
      // 인증되지 않은 경우 로그인 페이지로 리다이렉트
      return NextResponse.redirect(new URL('/login?error=middleware_redirect', request.url))
    }
  }
  
  const response = NextResponse.next()
  
  // 보안 헤더 설정
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/).*)',
  ],
}
