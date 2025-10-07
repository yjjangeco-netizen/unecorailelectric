'use client'
import { createClient } from '@supabase/supabase-js'

// 환경변수 검증 및 안전한 클라이언트 생성
const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'https://esvpnrqavaeikzhbmydz.supabase.co'
const supabaseKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8'

console.log('Supabase 클라이언트 설정:', { 
  url: supabaseUrl, 
  keyLength: supabaseKey.length 
})

// 싱글톤 패턴으로 Supabase 클라이언트 생성
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const supabase = (() => {
  if (!supabaseInstance) {
    try {
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
    } catch (error) {
      console.error('Supabase 클라이언트 생성 실패:', error)
      throw error
    }
  }
  return supabaseInstance
})()
