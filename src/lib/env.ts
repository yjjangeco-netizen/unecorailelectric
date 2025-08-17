// 환경변수 타입 안전성을 위한 설정
export const env = {
  SUPABASE_URL: process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || 'your-anon-key',
  NODE_ENV: process.env['NODE_ENV'] || 'development',
  LOG_LEVEL: process.env['NEXT_PUBLIC_LOG_LEVEL'] || process.env['LOG_LEVEL'] || 'info',
} as const

// 개발 환경에서는 경고만 표시
if (env.NODE_ENV === 'development') {
  if (!process.env['NEXT_PUBLIC_SUPABASE_URL'] || !process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']) {
    console.warn('개발 환경: Supabase 환경변수가 설정되지 않았습니다. 기본값을 사용합니다.')
  }
}

// 프로덕션 환경에서만 필수 환경변수 검증
if (env.NODE_ENV === 'production' && typeof window === 'undefined') {
  if (!process.env['NEXT_PUBLIC_SUPABASE_URL'] || !process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']) {
    console.warn('Missing required environment variables for production')
  }
}
