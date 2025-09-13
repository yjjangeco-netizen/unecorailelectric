// 환경변수 타입 안전성을 위한 설정
export const env = {
  SUPABASE_URL: process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || 'your-anon-key',
  NODE_ENV: process.env['NODE_ENV'] || 'development',
  LOG_LEVEL: process.env['NEXT_PUBLIC_LOG_LEVEL'] || process.env['LOG_LEVEL'] || 'info',
} as const

// 개발 환경에서는 상세 로그 표시
if (env.NODE_ENV === 'development') {
  console.log('=== 환경변수 로딩 시작 ===')
  console.log('NODE_ENV:', process.env['NODE_ENV'])
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env['NEXT_PUBLIC_SUPABASE_URL'] ? '설정됨' : '설정되지 않음')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ? '설정됨' : '설정되지 않음')
  
  if (!process.env['NEXT_PUBLIC_SUPABASE_URL'] || !process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']) {
    console.warn('개발 환경: Supabase 환경변수가 설정되지 않았습니다. 기본값을 사용합니다.')
    console.warn('현재 env.SUPABASE_URL:', env.SUPABASE_URL)
    console.warn('현재 env.SUPABASE_ANON_KEY:', env.SUPABASE_ANON_KEY ? '설정됨' : '설정되지 않음')
  } else {
    console.log('✅ Supabase 환경변수가 정상적으로 설정되었습니다.')
    console.log('URL:', process.env['NEXT_PUBLIC_SUPABASE_URL'])
    console.log('Key 길이:', process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']?.length || 0)
  }
  console.log('=== 환경변수 로딩 완료 ===')
}

// 프로덕션 환경에서만 필수 환경변수 검증
if (env.NODE_ENV === 'production' && typeof window === 'undefined') {
  if (!process.env['NEXT_PUBLIC_SUPABASE_URL'] || !process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']) {
    console.warn('Missing required environment variables for production')
  }
}
