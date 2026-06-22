import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { canAccessRoute, isPublicPath } from '@/lib/routeAccess'

interface JwtPayload {
  userId: string
  username: string
  level: string
  exp?: number
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(base64)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function base64UrlToJson<T>(value: string): T {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(value))) as T
}

async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.')
    if (!encodedHeader || !encodedPayload || !encodedSignature) return null

    const header = base64UrlToJson<{ alg?: string }>(encodedHeader)
    if (header.alg !== 'HS256') return null

    // 하드코딩 폴백 제거 — 시크릿 없으면 검증 거부(fail-closed).
    const secret = process.env['JWT_SECRET']
    if (!secret) return null
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlToBytes(encodedSignature),
      new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
    )
    if (!valid) return null

    const payload = base64UrlToJson<JwtPayload>(encodedPayload)
    if (payload.exp && payload.exp * 1000 < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon')) return NextResponse.next()

  // ── API 라우트: 신원 헤더를 서버에서만 신뢰 ──────────────────────────
  // 기존엔 클라이언트가 보낸 x-user-id / x-user-level 을 그대로 신뢰해
  // 누구나 헤더만 바꾸면 타인 사칭·권한 상승이 가능했음(인증 우회).
  // 여기서 클라이언트가 보낸 신원 헤더는 항상 제거하고, 검증된 JWT가 있을
  // 때만 토큰의 값으로 주입한다. (라우트 코드는 그대로 x-user-id 를 읽으면 됨)
  if (pathname.startsWith('/api/')) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.delete('x-user-id')
    requestHeaders.delete('x-user-level')
    requestHeaders.delete('x-username')

    const cookieToken = request.cookies.get('auth-token')?.value
    const bearerToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    const token = cookieToken || bearerToken

    if (token) {
      const payload = await verifyJwt(token)
      if (payload) {
        requestHeaders.set('x-user-id', payload.userId)
        requestHeaders.set('x-user-level', String(payload.level ?? ''))
        requestHeaders.set('x-username', payload.username ?? '')
      }
    }

    // API 응답은 라우트 자체 인가 로직이 401/403 을 처리하므로 리다이렉트하지 않는다.
    // (크론/웹훅 등 토큰 없이 자체 시크릿으로 인증하는 라우트도 통과)
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  if (!isPublicPath(pathname)) {
    const authToken = request.cookies.get('auth-token')?.value
    if (!authToken) {
      return NextResponse.redirect(new URL('/login?error=middleware_redirect', request.url))
    }

    const payload = await verifyJwt(authToken)
    if (!payload) {
      const response = NextResponse.redirect(new URL('/login?error=invalid_session', request.url))
      response.cookies.delete('auth-token')
      return response
    }

    if (pathname !== '/access-denied' && !canAccessRoute(pathname, { level: payload.level, username: payload.username })) {
      const url = new URL('/access-denied', request.url)
      url.searchParams.set('error', 'access_denied')
      url.searchParams.set('from', pathname)
      return NextResponse.redirect(url)
    }
  }

  const response = NextResponse.next()
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  return response
}

export const config = {
  // api 를 포함시켜 API 라우트에서도 신원 헤더 살균/주입이 동작하게 한다.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/).*)'
  ]
}
