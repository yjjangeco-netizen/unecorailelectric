import * as bcrypt from 'bcryptjs'
import jwt, { type SignOptions } from 'jsonwebtoken'

// JWT 시크릿 키 — 하드코딩 폴백 제거(공개 기본값으로 토큰 위조 방지).
// 미설정 시: 발급은 throw, 검증은 실패(null) 로 fail-closed.
const JWT_SECRET = process.env['JWT_SECRET']
const JWT_EXPIRES_IN = process.env['JWT_EXPIRES_IN'] || '24h'

function requireJwtSecret(): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다. (서버 환경변수 설정 필요)')
  }
  return JWT_SECRET
}

// 비밀번호 해시화
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

// 비밀번호 검증
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

// JWT 토큰 생성
export function generateToken(payload: { userId: string; username: string; level: string }): string {
  return jwt.sign(payload, requireJwtSecret(), { expiresIn: '24h' })
}

// JWT 토큰 검증
export function verifyToken(token: string): { userId: string; username: string; level: string } | null {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET 미설정 — 토큰 검증을 거부합니다(fail-closed).')
    return null
  }
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; username: string; level: string }
  } catch (error) {
    console.error('JWT 토큰 검증 실패:', error)
    return null
  }
}

// 비밀번호 강도 검증
export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 4) {
    errors.push('비밀번호는 최소 4자 이상이어야 합니다')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// 사용자명 검증
export function validateUsername(username: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (username.length < 3) {
    errors.push('사용자명은 최소 3자 이상이어야 합니다')
  }

  if (username.length > 20) {
    errors.push('사용자명은 최대 20자까지 가능합니다')
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('사용자명은 영문, 숫자, _, - 만 사용 가능합니다')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// 입력값 XSS 방지
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // HTML 태그 제거
    .replace(/['"]/g, '') // 따옴표 제거
    .trim()
}

// 세션 만료 시간 설정
export const SESSION_TIMEOUT = 30 * 60 * 1000 // 30분 (밀리초)

// 최대 로그인 시도 횟수
export const MAX_LOGIN_ATTEMPTS = 5

// 계정 잠금 시간 (밀리초)
export const ACCOUNT_LOCKOUT_TIME = 15 * 60 * 1000 // 15분
