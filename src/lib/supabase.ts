import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { 
  Item, 
  StockIn, 
  StockOut, 
  SimpleStockItem, 
  ProfessionalStockItem, 
  StockHistory, 
  Disposal 
} from './types'

// 브라우저용 Supabase 클라이언트 (Lazy 초기화)
let _supabase: SupabaseClient | null = null

const getSupabase = () => {
  if (!_supabase) {
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
    const supabaseKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase 환경변수가 설정되지 않았습니다.')
    }

    _supabase = createClient(supabaseUrl, supabaseKey)
  }
  return _supabase
}

// Proxy를 사용한 lazy 초기화
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop]
  }
})

// 서버용 Supabase 클라이언트는 별도 파일에서 관리
// src/lib/supabaseServer.ts 참조 