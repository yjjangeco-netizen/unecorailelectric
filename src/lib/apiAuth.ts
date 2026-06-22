import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/security'

export interface ApiUser {
  userId: string
  username: string
  level: string
}

export function getApiUser(request: NextRequest): ApiUser | null {
  const cookieToken = request.cookies.get('auth-token')?.value
  const authHeader = request.headers.get('authorization')
  const headerToken = authHeader?.replace(/^Bearer /i, '')

  for (const token of [cookieToken, headerToken]) {
    if (!token) continue

    const decoded = verifyToken(token)
    if (decoded) {
      return decoded
    }
  }

  return null
}
