import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// 환경변수 검증 함수
const validateSupabaseEnv = () => {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const key = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
  
  if (!url || !key) {
    console.warn('Supabase 환경변수가 설정되지 않았습니다.')
    return false
  }
  return true
}

// 기본 환경변수 값 (빌드 시 사용)
const getSupabaseConfig = () => {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'https://placeholder.supabase.co'
  const key = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || 'placeholder-key'
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
  return createClient(url, key)
}

// 기존 코드와의 호환성을 위한 기본 클라이언트
export const supabaseServer = (() => {
  try {
    const { url, key } = getSupabaseConfig()
    return createClient(url, key)
  } catch (error) {
    // 환경변수가 없을 때는 기본값으로 클라이언트 생성
    console.warn('Supabase 클라이언트 생성 실패:', error)
    return createClient('https://placeholder.supabase.co', 'placeholder-key')
  }
})()