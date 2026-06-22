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

    // Telegram assistant 설정
    TELEGRAM_BOT_TOKEN?: string
    TELEGRAM_WEBHOOK_SECRET?: string
    TELEGRAM_LINK_CODE?: string
    TELEGRAM_LINK_ALLOWED_TELEGRAM_IDS?: string
    TELEGRAM_ALLOWED_CHAT_IDS?: string
    TELEGRAM_DEFAULT_USER_ID?: string
    NEXT_PUBLIC_APP_URL?: string
  }
}
