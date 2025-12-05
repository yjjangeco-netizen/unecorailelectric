'use client'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// 싱글톤 패턴으로 Supabase 클라이언트 생성 (Lazy 초기화)
let supabaseInstance: SupabaseClient | null = null

const getSupabase = () => {
  if (!supabaseInstance) {
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
    const supabaseKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase 환경변수가 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL 및 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인하세요.')
    }

    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  }
  return supabaseInstance
}

// Proxy를 사용한 lazy 초기화
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop]
  }
})
