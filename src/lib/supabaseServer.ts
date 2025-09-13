import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// 환경변수 검증
if (!process.env['NEXT_PUBLIC_SUPABASE_URL'] || !process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']) {
  console.error('Supabase 환경변수가 설정되지 않았습니다.')
  throw new Error('Supabase 환경변수가 설정되지 않았습니다.')
}

// 서버 사이드용 Supabase 클라이언트 생성 (쿠키 기반 인증)
export const createServerSupabaseClient = () => {
  const cookieStore = cookies()
  
  return createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      auth: {
        storage: {
          getItem: (key: string) => {
            return cookieStore.get(key)?.value
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

// 기존 코드와의 호환성을 위한 기본 클라이언트
export const supabaseServer = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
)