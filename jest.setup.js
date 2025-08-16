// Jest 테스트 환경 설정
import '@testing-library/jest-dom'

// Request 객체 모킹 (Next.js API 라우트 테스트용)
global.Request = class Request {
  constructor(input, init = {}) {
    this.url = typeof input === 'string' ? input : input.url
    this.method = init.method || 'GET'
    this.headers = new Map(Object.entries(init.headers || {}))
    this.body = init.body
    this.json = async () => {
      if (this.body) {
        return JSON.parse(this.body)
      }
      return {}
    }
  }
}

// Response 객체 모킹
global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body
    this.status = init.status || 200
    this.headers = new Map(Object.entries(init.headers || {}))
    this.json = async () => {
      if (typeof body === 'string') {
        return JSON.parse(body)
      }
      return body
    }
  }
}

// NextRequest 모킹
global.NextRequest = class NextRequest extends Request {
  constructor(input, init = {}) {
    super(input, init)
    this.nextUrl = new URL(this.url)
    this.ip = '127.0.0.1'
    this.geo = { country: 'KR', city: 'Seoul' }
  }
}

// NextResponse 모킹
global.NextResponse = {
  json: (data, init = {}) => new Response(JSON.stringify(data), init),
  redirect: (url, init = {}) => new Response(null, { ...init, status: 302, headers: { Location: url } }),
  rewrite: (url) => new Response(null, { status: 200 }),
  next: () => new Response(null, { status: 200 })
}

// 환경변수 모킹
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
process.env.NODE_ENV = 'test'

// Supabase 클라이언트 모킹
jest.mock('@/lib/supabase', () => ({
  createBrowserSupabaseClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis()
    })),
    rpc: jest.fn()
  })),
  createServerSupabaseClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            role: 'admin'
          }
        },
        error: null
      })
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis()
    })),
    rpc: jest.fn()
  })),
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis()
    })),
    rpc: jest.fn()
  }
}))

// 콘솔 경고/에러 필터링 (테스트 환경에서만)
const originalConsoleWarn = console.warn
const originalConsoleError = console.error

console.warn = (...args) => {
  // Supabase 클라이언트 중복 경고는 무시
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Multiple GoTrueClient instances')) {
    return
  }
  originalConsoleWarn.call(console, ...args)
}

console.error = (...args) => {
  // 테스트 환경에서 발생하는 일반적인 에러는 무시
  if (args[0] && typeof args[0] === 'string' && (
    args[0].includes('쿠키 로그인 오류') ||
    args[0].includes('감사 로그 기록 실패')
  )) {
    return
  }
  originalConsoleError.call(console, ...args)
}
