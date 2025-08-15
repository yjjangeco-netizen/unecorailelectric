import { z } from 'zod'

// 환경변수 스키마 정의
const envSchema = z.object({
  // Supabase 설정
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('유효한 Supabase URL이 필요합니다'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key가 필요합니다'),
  
  // 애플리케이션 설정
  NEXT_PUBLIC_APP_NAME: z.string().default('유네코레일 전기파트'),
  NEXT_PUBLIC_APP_VERSION: z.string().default('1.0.0'),
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  
  // Google Calendar API (선택사항)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // 보안 설정
  NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS: z.coerce.number().min(1).max(10).default(5),
  NEXT_PUBLIC_SESSION_TIMEOUT: z.coerce.number().min(300000).max(86400000).default(3600000), // 5분~24시간
  
  // 로깅 설정
  NEXT_PUBLIC_ENABLE_LOGGING: z.coerce.boolean().default(true),
  NEXT_PUBLIC_LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
})

// 환경변수 검증 및 타입 추론
export const env = envSchema.parse(process.env)

// 타입 내보내기
export type Env = z.infer<typeof envSchema>

// 환경변수 검증 함수
export const validateEnv = (): Env => {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.'))
      throw new Error(
        `환경변수 검증 실패:\n${missingVars.join('\n')}\n\n.env.local 파일을 확인해주세요.`
      )
    }
    throw error
  }
}

// 개발 환경에서만 환경변수 로깅
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 환경변수 로드됨:', {
    appName: env.NEXT_PUBLIC_APP_NAME,
    appVersion: env.NEXT_PUBLIC_APP_VERSION,
    appEnv: env.NEXT_PUBLIC_APP_ENV,
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '누락',
    supabaseKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '누락',
    maxLoginAttempts: env.NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS,
    sessionTimeout: env.NEXT_PUBLIC_SESSION_TIMEOUT,
    enableLogging: env.NEXT_PUBLIC_ENABLE_LOGGING,
    logLevel: env.NEXT_PUBLIC_LOG_LEVEL,
  })
}
