import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// 환경변수 검증 함수
const validateSupabaseEnv = () => {
  if (!process.env['NEXT_PUBLIC_SUPABASE_URL'] || !process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']) {
    console.error('Supabase 환경변수가 설정되지 않았습니다.')
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.')
  }
}

// 서버 사이드용 Supabase 클라이언트 생성 (쿠키 기반 인증)
export const createServerSupabaseClient = () => {
  validateSupabaseEnv()
  const cookieStore = cookies()
  
  return createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
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
    }
  )
}

// API 라우트용 createClient 함수
export const createApiClient = () => {
  validateSupabaseEnv()
  return createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  )
}

// 기존 코드와의 호환성을 위한 기본 클라이언트
export const supabaseServer = (() => {
  try {
    validateSupabaseEnv()
    return createClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
    )
  } catch (error) {
    // 환경변수가 없을 때는 null을 반환하여 런타임에서 처리하도록 함
    console.warn('Supabase 클라이언트 생성 실패:', error)
    return null as any
  }
})()