'use client'
import { createClient } from '@supabase/supabase-js'

// 환경변수 검증 (개발용 임시 설정)
if (!process.env['NEXT_PUBLIC_SUPABASE_URL'] || !process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']) {
  console.warn('Supabase 환경변수가 설정되지 않았습니다. 임시 설정을 사용합니다.')
  // 임시 환경변수 설정
  process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'https://temp.supabase.co'
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'temp-key'
}

// 싱글톤 패턴으로 Supabase 클라이언트 생성
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
    )
  }
  return supabaseInstance
})()
