import { createClient } from '@supabase/supabase-js'

// 하드코딩으로 테스트
const supabaseUrl = 'https://pnmyxzgyeipbvvnnwtoi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubXl4emd5ZWlwYnZ2bm53dG9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMjQyMjUsImV4cCI6MjA2OTgwMDIyNX0.-0N6pDO0HjjTZd7WqqXJBwf0eBHvGIP_zPQlKpwealA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 임시 데이터 (데이터베이스 연결 실패 시 사용)
export const mockItems: Item[] = [
  {
    id: '1',
    name: '노트북',
    specification: '15인치',
    maker: '삼성',
    unit_price: 1200000,
    purpose: '업무용',
    min_stock: 5,
    category: '전자기기',
    description: '사무실 업무용 노트북',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: '프린터',
    specification: 'A4 컬러',
    maker: 'HP',
    unit_price: 300000,
    purpose: '문서출력',
    min_stock: 3,
    category: '사무용품',
    description: '컬러 레이저 프린터',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    name: '의자',
    specification: '사무용',
    maker: '시디즈',
    unit_price: 150000,
    purpose: '업무환경',
    min_stock: 10,
    category: '가구',
    description: '인체공학 사무용 의자',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export const mockCurrentStock: CurrentStock[] = [
  {
    id: '1',
    name: '노트북',
    specification: '15인치',
    unit_price: 1200000,
    current_quantity: 8,
    total_amount: 9600000,
    notes: '사무실 업무용',
    category: '전자기기',
    stock_status: 'normal'
  },
  {
    id: '2',
    name: '프린터',
    specification: 'A4 컬러',
    unit_price: 300000,
    current_quantity: 2,
    total_amount: 600000,
    notes: '컬러 레이저',
    category: '사무용품',
    stock_status: 'low_stock'
  },
  {
    id: '3',
    name: '의자',
    specification: '사무용',
    unit_price: 150000,
    current_quantity: 15,
    total_amount: 2250000,
    notes: '인체공학',
    category: '가구',
    stock_status: 'normal'
  },
  {
    id: '4',
    name: '모니터',
    specification: '27인치',
    unit_price: 350000,
    current_quantity: 12,
    total_amount: 4200000,
    notes: 'IPS 패널',
    category: '전자기기',
    stock_status: 'normal'
  },
  {
    id: '5',
    name: '키보드',
    specification: '기계식',
    unit_price: 150000,
    current_quantity: 20,
    total_amount: 3000000,
    notes: '청축',
    category: '전자기기',
    stock_status: 'normal'
  }
]

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