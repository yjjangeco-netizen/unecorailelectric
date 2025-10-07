import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// 환경변수 검증 함수
const validateSupabaseEnv = () => {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const key = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
  
  if (!url || !key) {
    console.error('Supabase 환경변수가 설정되지 않았습니다.')
    return false
  }
  return true
}

// 안전한 Supabase 설정 가져오기
const getSupabaseConfig = () => {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'https://esvpnrqavaeikzhbmydz.supabase.co'
  const key = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8'
  
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
  try {
    // 환경변수가 없으면 실제 Supabase 정보 사용
    const url = process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'https://esvpnrqavaeikzhbmydz.supabase.co'
    const key = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8'
    
    console.log('Supabase 클라이언트 생성:', { url, keyLength: key.length })
    
    return createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  } catch (error) {
    console.error('API 클라이언트 생성 실패:', error)
    throw error
  }
}

// 기존 코드와의 호환성을 위한 기본 클라이언트
export const supabaseServer = (() => {
  try {
    const { url, key } = getSupabaseConfig()
    return createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  } catch (error) {
    console.error('Supabase 서버 클라이언트 생성 실패:', error)
    throw error
  }
})()