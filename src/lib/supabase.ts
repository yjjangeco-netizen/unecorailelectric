import { createClient } from '@supabase/supabase-js'
import type { 
  Item, 
  StockIn, 
  StockOut, 
  SimpleStockItem, 
  ProfessionalStockItem, 
  StockHistory, 
  Disposal 
} from './types'

// 브라우저용 Supabase 클라이언트
export const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
)

// 서버용 Supabase 클라이언트는 별도 파일에서 관리
// src/lib/supabaseServer.ts 참조 