export type PositionType = '사원' | '대리' | '과장' | '차장' | '부장' | '임원';
export type DepartmentType = '전기팀' | 'AS' | '기계' | '구매' | '영업';
export type PermissionType = 'level1' | 'level2' | 'level3' | 'level4' | 'level5' | 'administrator';

export interface User {
  id: string
  username: string
  password: string
  name: string
  department?: string
  position?: string
  level: string
  // Modified: permissions 속성 추가 (level과 호환성 유지)
  permissions?: PermissionType[]
  is_active: boolean
  stock_view: boolean
  stock_in: boolean
  stock_out: boolean
  stock_disposal: boolean
  work_tools: boolean
  daily_log: boolean
  work_manual: boolean
  sop: boolean
  user_management: boolean
  created_at: string
  updated_at: string
}

export interface UserPublic {
  id: string;
  name: string;
  department: DepartmentType;
  position: PositionType;
  is_active: boolean;
}

// 현재 데이터베이스 구조에 맞춘 타입 정의

export interface CurrentStock {
  id: string
  product: string
  spec?: string
  maker?: string
  category?: string
  unit_price: number
  purpose?: string
  min_stock: number
  note?: string
  stock_status: string
  current_quantity: number
  location?: string
  created_at: string
  updated_at: string
}

// items 테이블 기반 ProfessionalStockItem
export interface ProfessionalStockItem {
  id: number
  name: string
  specification: string
  maker: string
  location: string
  status: string
  stock_status: string
  note: string
  unit_price: number
  current_quantity: number
  in_data: number
  out_data: number
  plus_data: number
  minus_data: number
  total_qunty: number
}

// 입고/출고 수량을 포함한 완전한 재고 정보
export interface StockItemWithHistory {
  id: string
  product: string
  spec?: string
  maker?: string
  category?: string
  unit_price: number
  purpose: string
  min_stock: number
  note?: string
  stock_status: string
  current_quantity: number
  location?: string
  total_amount: number
  stock_in_quantity: number
  stock_out_quantity: number
  created_at: string
  updated_at: string
}

export interface Item {
  id: string
  product: string
  spec?: string
  maker?: string
  note?: string
  unit_price: number
  purpose: string
  min_stock: number
  category: string
  stock_status: string
  created_at: string
  updated_at: string
}

export interface StockHistory {
  id: string
  item_id: string
  event_type: string
  quantity: number
  unit_price?: number
  reason?: string
  ordered_by?: string
  received_by?: string
  project?: string
  notes?: string
  return_date?: string
  disposal_reason?: string
  requester?: string
  approver?: string
  approval_date?: string
  approval_notes?: string
  evidence_url?: string
  condition_type: string
  is_rental: boolean
  disposal_status: string
  event_date: string
  created_at: string
}

export interface Disposal {
  DisposalID: number;
  HistoryID: number;
  DisposalReason?: string;
  Approver?: string;
  EvidenceURL?: string;
}

// 폼 데이터 타입
export interface StockInFormData {
  name: string
  specification: string
  maker: string
  location: string
  note: string
  quantity: number
  unit_price: number
  stock_status: string
  reason?: string
  received_by: string
}

export interface StockOutFormData {
  name: string
  specification: string
  maker: string
  location: string
  note: string
  quantity: number
  project?: string
  is_rental: boolean
  return_date?: string
  issued_by: string
}

// 기존 타입들 유지 (호환성)
export interface StockIn extends Omit<StockHistory, 'id' | 'event_type'> {
  event_type: 'IN'
}

export interface StockOut extends Omit<StockHistory, 'id' | 'event_type'> {
  event_type: 'OUT'
}

export interface Disposal extends Omit<StockHistory, 'id' | 'event_type'> {
  event_type: 'DISPOSAL'
}
