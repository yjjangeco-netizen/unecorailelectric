import { createClient } from '@supabase/supabase-js'

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pnmyxzgyeipbvvnnwtoi.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubXl4emd5ZWlwYnZ2bm53dG9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMjQyMjUsImV4cCI6MjA2OTgwMDIyNX0.-0N6pDO0HjjTZd7WqqXJBwf0eBHvGIP_zPQlKpwealA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

// 현재 재고 타입 정의
export interface CurrentStock {
  id: string
  name: string
  specification: string
  unit_price: number
  current_quantity: number
  total_amount: number
  notes?: string
  category?: string
  stock_status: 'normal' | 'low_stock'
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