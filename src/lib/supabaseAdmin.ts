import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// 서버 전용 service role 클라이언트 (RLS 우회). API 라우트에서만 사용.
let cached: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      `Supabase 설정 누락 (url=${url ? 'O' : 'X'}, serviceKey=${key ? 'O' : 'X'}). Vercel 환경변수 확인 필요.`
    )
  }
  if (!cached) {
    cached = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  }
  return cached
}
