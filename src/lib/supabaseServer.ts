import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// 환경변수에서 Supabase 설정 가져오기 (하드코딩 금지)
const getSupabaseConfig = () => {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const key = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
  
  if (!url || !key) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL 및 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인하세요.')
  }
  
  return { url, key }
}

// 서버 사이드용 Supabase 클라이언트 생성 (쿠키 기반 인증)
export const createServerSupabaseClient = () => {
  const { url, key } = getSupabaseConfig()
  const cookieStore = cookies()
  
  return createClient(url, key, {
    auth: {
      storage: {
        getItem: (key: string) => {
          return cookieStore.get(key)?.value || null
        },
        setItem: (key: string, value: string) => {
          cookieStore.set(key, value)
        },
        removeItem: (key: string) => {
          cookieStore.delete(key)
        },
      },
    },
  })
}

// API 라우트용 createClient 함수
export const createApiClient = () => {
  const { url, key } = getSupabaseConfig()
  
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}

// Lazy 초기화를 위한 싱글톤 패턴
let _supabaseServer: SupabaseClient | null = null

// 기존 코드와의 호환성을 위한 기본 클라이언트 (Lazy 초기화)
export const supabaseServer = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabaseServer) {
      const { url, key } = getSupabaseConfig()
      _supabaseServer = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      })
    }
    return (_supabaseServer as any)[prop]
  }
})