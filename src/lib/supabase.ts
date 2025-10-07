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
  process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'https://esvpnrqavaeikzhbmydz.supabase.co',
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8',
)

// 서버용 Supabase 클라이언트는 별도 파일에서 관리
// src/lib/supabaseServer.ts 참조 