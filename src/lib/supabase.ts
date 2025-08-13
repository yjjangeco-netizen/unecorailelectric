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
    maker: '삼성',
    unit_price: 1200000,
    purpose: '업무용',
    current_quantity: 8,
    total_value: 9600000,
    stock_status: 'normal',
    category: '전자기기',
    description: '사무실 업무용 노트북',
    min_stock: 5
  },
  {
    id: '2',
    name: '프린터',
    specification: 'A4 컬러',
    maker: 'HP',
    unit_price: 300000,
    purpose: '문서출력',
    current_quantity: 2,
    total_value: 600000,
    stock_status: 'low_stock',
    category: '사무용품',
    description: '컬러 레이저 프린터',
    min_stock: 3
  },
  {
    id: '3',
    name: '의자',
    specification: '사무용',
    maker: '시디즈',
    unit_price: 150000,
    purpose: '업무환경',
    current_quantity: 15,
    total_value: 2250000,
    stock_status: 'normal',
    category: '가구',
    description: '인체공학 사무용 의자',
    min_stock: 10
  },
  {
    id: '4',
    name: '모니터',
    specification: '27인치',
    maker: 'LG',
    unit_price: 350000,
    purpose: '업무용',
    current_quantity: 12,
    total_value: 4200000,
    stock_status: 'normal',
    category: '전자기기',
    description: 'IPS 패널 모니터',
    min_stock: 8
  },
  {
    id: '5',
    name: '키보드',
    specification: '기계식',
    maker: '체리',
    unit_price: 150000,
    purpose: '업무용',
    current_quantity: 20,
    total_value: 3000000,
    stock_status: 'normal',
    category: '전자기기',
    description: '청축 기계식 키보드',
    min_stock: 15
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
  maker: string
  unit_price: number
  purpose: string
  current_quantity: number
  total_value: number
  stock_status: 'normal' | 'low_stock'
  category?: string
  description?: string
  min_stock: number
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