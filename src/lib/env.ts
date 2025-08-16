// 환경변수 타입 안전성을 위한 설정
export const env = {
  SUPABASE_URL: process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'https://example.supabase.co',
  SUPABASE_ANON_KEY: process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || 'example-key',
  NODE_ENV: process.env['NODE_ENV'] || 'development',
  LOG_LEVEL: process.env['NEXT_PUBLIC_LOG_LEVEL'] || process.env['LOG_LEVEL'] || 'info',
} as const

// 프로덕션 환경에서만 필수 환경변수 검증
if (env.NODE_ENV === 'production' && typeof window === 'undefined') {
  if (!process.env['NEXT_PUBLIC_SUPABASE_URL'] || !process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']) {
    console.warn('Missing required environment variables for production')
  }
}
