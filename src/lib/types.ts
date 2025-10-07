export type PositionType = '사원' | '대리' | '과장' | '차장' | '부장' | '임원';
export type DepartmentType = '전기팀' | 'AS' | '기계' | '구매' | '영업';
export type PermissionType = 'level1' | 'level2' | 'level3' | 'level4' | 'level5' | 'administrator';

export interface User {
  id: string
  username: string
  password: string
  name: string
  email?: string
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

// 프로젝트 타입 정의 (실제 DB 스키마에 맞춤)
export interface Project {
  id: string // DB: INTEGER, API: string 변환
  project_number: string // DB: project_number
  name: string // DB: project_name
  description?: string
  status: 'Manufacturing' | 'Demolished' | 'Warranty' | 'WarrantyComplete'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  start_date?: string
  end_date?: string
  assembly_date?: string // 조립완료일
  factory_test_date?: string // 공장시운전일
  site_test_date?: string // 현장시운전일
  completion_date?: string // 준공완료일
  warranty_period?: string // 하자보증기간
  budget?: number
  manager_id?: string
  client_name?: string
  client_contact?: string
  created_by: string
  created_at: string
  updated_at: string
  
  // 기본 정보
  base_name?: string // 기지명
  
  // 사양 정보
  hardware_version?: string // 하드웨어 버전
  has_disk?: boolean // 디스크 여부
  incoming_power?: string // 인입전원
  primary_breaker?: string // 1차 차단기
  
  // 전원사양
  pvr_ampere?: number // PVR [A]
  frequency?: number // 주파수
  
  // Drive 사양
  spindle_spec?: string // 스핀들
  tool_post_spec?: string // 공구대
  pump_low_spec?: string // 펌프(저)
  pump_high_spec?: string // 펌프(고)
  crusher_spec?: string // 크러셔
  conveyor_spec?: string // 컨베이어
  dust_collector_spec?: string // 집진기
  
  // 380V motor 사양
  vehicle_transfer_device?: string // 차량이송장치
  oil_heater?: string // 오일히터
  cooling_fan?: string // COOLING FAN
  chiller?: string // CHILLER
  
  // 220V motor 사양
  lubrication?: string // Luberication
  grease?: string // Grease
  
  // 차륜관리시스템
  cctv_spec?: string // CCTV
  automatic_cover?: string // 자동덮개(도어)
  ups_spec?: string // UPS
  configuration?: string // 구성
  
  // 색상
  main_color?: string // 메인 색상
  auxiliary_color?: string // 보조 색상
  
  // 옵션
  warning_light?: boolean // 경광등
  buzzer?: boolean // 부저
  speaker?: boolean // speaker
  automatic_rail?: boolean // 자동레일
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

// SimpleStockInModal용 타입
export interface SimpleStockItem {
  name: string
  specification: string
  maker: string
  location: string
  remark: string
  status: string
  in_data: number
  unit_price: number
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

// 업무일지 타입 정의
export interface WorkDiary {
  id: string
  user_id: string
  work_date: string
  work_content: string
  work_type: string
  work_sub_type: string
  project_id?: number
  custom_project_name?: string
  start_time?: string
  end_time?: string
  work_hours?: number // 계산된 근무시간 (퇴근시간 - 출근시간 - 1시간)
  overtime_hours?: number // 초과근무시간
  created_at: string
  updated_at: string
}

// 업무일지 작성용 폼 데이터 타입
export interface WorkEntry {
  projectId: string
  workContent: string
  workType: string
  workSubType: string
  customProjectName: string
  startTime?: string
  endTime?: string
  workHours?: number // 계산된 근무시간
  overtimeHours?: number // 초과근무시간
}