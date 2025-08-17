import { createClient } from '@supabase/supabase-js'
import { env } from './env'

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = env.SUPABASE_URL
const supabaseAnonKey = env.SUPABASE_ANON_KEY

// 개발 환경에서는 기본값 사용, 프로덕션에서는 환경변수 필수
if (env.NODE_ENV === 'production' && (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY)) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// 개발 환경에서 기본값 사용 시 경고
if (env.NODE_ENV === 'development' && (supabaseUrl === 'https://your-project.supabase.co' || supabaseAnonKey === 'your-anon-key')) {
  console.warn('개발 환경: Supabase 기본값을 사용합니다. 실제 데이터베이스 연결을 위해 .env.local 파일을 설정하세요.')
  console.warn('또는 https://supabase.com 에서 새 프로젝트를 생성하고 환경변수를 설정하세요.')
}

// 브라우저용 클라이언트 (SSR 지원)
export const createBrowserSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
}

// 서버용 클라이언트 (SSR 지원)
export const createServerSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// 기존 클라이언트 (하위 호환성)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// 품목 타입 정의
export interface Item {
  id: string
  name: string           // 품명
  specification: string   // 규격
  maker: string          // 메이커
  unit_price: number     // 금액
  purpose: string        // 용도
  min_stock: number      // 최소재고
  category?: string
  description?: string
  created_at: string
  updated_at: string
}

// 입고 타입 정의
export interface StockIn {
  id: string
  item_id: string
  quantity: number
  unit_price: number
  condition_type: 'new' | 'used_good' | 'used_defective' | 'unknown'
  reason?: string
  ordered_by?: string
  received_by: string
  received_at: string
}

// 출고 타입 정의
export interface StockOut {
  id: string
  item_id: string
  quantity: number
  project?: string
  issued_by: string
  is_rental: boolean
  return_date?: string
  issued_at: string
}

// 출고와 품목 정보를 결합한 타입
export interface StockOutWithItem extends StockOut {
  item: Item
  reason?: string
  notes?: string
  unit_price?: number
  total_amount?: number
}

// 현재 재고 타입 정의
export interface CurrentStock {
  id: string
  name: string
  specification: string
  maker?: string
  unit_price: number
  current_quantity: number
  total_amount: number
  notes?: string
  category?: string
  stock_status: 'normal' | 'low_stock'
  purpose?: string
  location?: string
  material?: string
  unit?: string
  previousQuarterQuantity?: number
  stockInQuantity?: number
  stockOutQuantity?: number
  actualQuantity?: number
  stockOutContent?: string
}

// 대량 입고 행 타입 정의
export interface BulkStockInRow {
  name: string
  specification: string
  maker: string
  unit_price: number
  purpose: string
  quantity: number
  condition_type: 'new' | 'used_good' | 'used_defective' | 'unknown'
  reason: string
  ordered_by: string
  received_by: string
  received_date: string
}

export interface User {
  id: string
  username: string
  password: string
  name: string
  department: string
  position: string
  phone: string
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface UserGroup {
  id: string
  name: string
  description: string
  created_at: string
}

export interface UserGroupMember {
  id: string
  user_id: string
  group_id: string
  created_at: string
}

export interface Disposal {
  id: string
  stock_in_id: string
  item_id: string
  quantity: number
  disposed_by: string
  disposed_at: string
  reason: string
  notes: string
  created_at: string
}

// 업무일지 항목 타입 정의
export interface WorkDiaryEntry {
  id: string
  date: string
  userId: string
  userName: string
  content: string
  createdAt: string
  updatedAt: string
  googleCalendarEventId?: string | undefined
  googleCalendarLink?: string | undefined
} 