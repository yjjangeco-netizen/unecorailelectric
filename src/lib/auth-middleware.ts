import { NextRequest } from 'next/server'
import { verifyToken } from './security'

export interface AuthenticatedUser {
  userId: string
  username: string
  level: string
}

export function authenticateRequest(request: NextRequest): AuthenticatedUser | null {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7) // "Bearer " 제거
    const decoded = verifyToken(token)
    
    return decoded
  } catch (error) {
    console.error('토큰 검증 실패:', error)
    return null
  }
}

export function requireAuth(handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    const user = authenticateRequest(request)
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return handler(request, user)
  }
}
