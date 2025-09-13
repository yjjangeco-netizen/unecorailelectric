declare namespace NodeJS {
  interface ProcessEnv {
    // Supabase 설정
    NEXT_PUBLIC_SUPABASE_URL: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string
    
    // 환경 설정
    NODE_ENV: 'development' | 'production' | 'test'
    NEXT_PUBLIC_LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error'
    
    // 데이터베이스 설정 (선택사항)
    DATABASE_URL_DEV?: string
    DATABASE_URL_PROD?: string
  }
}
