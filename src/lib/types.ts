export type PermissionType = string;
export type DepartmentType = string;
export type PositionType = string;

// ACTUAL_SCHEMA.md 기반 User 정의
export interface User {
  id: string; // DB: TEXT
  username: string;
  name: string; // DB: name (single field)
  email: string;
  level: string; // DB: level (TEXT)
  permissions?: PermissionType[];
  department: DepartmentType;
  position: PositionType;
  is_active: boolean;
  // 권한 필드
  stock_view?: boolean;
  stock_in?: boolean;
  stock_out?: boolean;
  stock_disposal?: boolean;
  work_tools?: boolean;
  daily_log?: boolean;
  work_manual?: boolean;
  sop?: boolean;
  user_management?: boolean;
  color?: string; // DB: color
  created_at: string;
  updated_at: string;
}

// ACTUAL_SCHEMA.md 기반 Project 정의
export interface Project {
  id: number; // DB: INTEGER
  project_number: string;
  project_name: string; // DB: project_name
  category?: string; // DB: category
  description?: string;
  ProjectStatus: 'Manufacturing' | 'Demolished' | 'Warranty' | 'WarrantyComplete'; // DB: ProjectStatus
  is_active: boolean;
  assembly_date?: string;
  factory_test_date?: string;
  site_test_date?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;

  // UI에서 사용되는 추가 필드 (DB에는 없을 수 있음, 호환성 유지)
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  start_date?: string;
  end_date?: string;
  completion_date?: string;
  warranty_period?: string;
  budget?: number;
  manager_id?: string;
  client_name?: string;
  client_contact?: string;
  created_by?: string;
  base_name?: string;
  hardware_version?: string;
  has_disk?: boolean;
  incoming_power?: string;
  primary_breaker?: string;
  pvr_ampere?: number;
  frequency?: number;
  spindle_spec?: string;
  tool_post_spec?: string;
  pump_low_spec?: string;
  pump_high_spec?: string;
  crusher_spec?: string;
  conveyor_spec?: string;
  dust_collector_spec?: string;
  vehicle_transfer_device?: string;
  oil_heater?: string;
  cooling_fan?: string;
  chiller?: string;
  lubrication?: string;
  grease?: string;
  cctv_spec?: string;
  automatic_cover?: string;
  ups_spec?: string;
  configuration?: string;
  main_color?: string;
  auxiliary_color?: string;
  warning_light?: boolean;
  buzzer?: boolean;
  speaker?: boolean;
  automatic_rail?: boolean;
}

// ACTUAL_SCHEMA.md 기반 WorkDiary 정의
export interface WorkDiary {
  id: number; // DB: INTEGER
  user_id: string; // DB: VARCHAR
  work_date: string;
  project_id?: number; // DB: INTEGER
  work_content: string;
  work_type?: string;
  work_sub_type?: string;
  custom_project_name?: string;
  created_at: string;
  updated_at: string;
  
  // UI 편의를 위한 확장 필드
  start_time?: string;
  end_time?: string;
  work_hours?: number;
  overtime_hours?: number;
}

// ACTUAL_SCHEMA.md 기반 BusinessTrip 정의
export interface BusinessTrip {
  id: string; // DB: UUID
  user_id: string; // DB: TEXT
  user_name: string;
  title: string;
  location: string;
  purpose: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  report_status: 'pending' | 'submitted' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

// ACTUAL_SCHEMA.md 기반 BusinessTripReport 정의
export interface BusinessTripReport {
  id: string; // DB: UUID
  trip_id: string; // DB: UUID
  user_id: string;
  user_name: string;
  title: string;
  content: string;
  attachments?: any[]; // JSONB
  status: 'submitted' | 'approved' | 'rejected';
  submitted_at: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

// ACTUAL_SCHEMA.md 기반 Item (StockItem) 정의
export interface StockItem {
  id: string; // DB: UUID
  name: string;
  specification?: string;
  maker?: string;
  category: string;
  location?: string;
  purpose?: string;
  min_stock: number;
  current_quantity: number;
  closing_quantity?: number;
  stock_in?: number;
  stock_out?: number;
  disposal_qunty?: number;
  total_qunty?: number;
  unit_price: number;
  note?: string;
  stock_status: string;
  status: string;
  date_index?: string;
  created_at: string;
  updated_at: string;
}

// ACTUAL_SCHEMA.md 기반 StockHistory 정의
export interface StockHistory {
  id: string; // DB: UUID
  item_id: string; // DB: UUID
  event_type: 'IN' | 'OUT' | 'DISPOSAL' | 'ADJUSTMENT' | 'PLUS' | 'MINUS';
  quantity: number;
  unit_price?: number;
  reason?: string;
  ordered_by?: string;
  received_by?: string;
  project?: string;
  notes?: string;
  return_date?: string;
  disposal_reason?: string;
  requester?: string;
  approver?: string;
  approval_date?: string;
  approval_notes?: string;
  evidence_url?: string;
  condition_type?: string;
  is_rental?: boolean;
  disposal_status?: string;
  date_index?: string;
  event_date: string;
  created_at: string;
}

// 호환성 유지를 위한 별칭 및 기존 인터페이스
export type Item = StockItem;
export type CurrentStock = StockItem;

export interface ProfessionalStockItem extends StockItem {
  in_data: number;
  out_data: number;
  plus_data: number;
  minus_data: number;
}

export interface SimpleStockItem {
  name: string;
  specification: string;
  maker: string;
  location: string;
  remark: string;
  status: string;
  in_data: number;
  unit_price: number;
}

export interface StockItemWithHistory extends StockItem {
  total_amount: number;
  stock_in_quantity: number;
  stock_out_quantity: number;
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
  name: string;
  specification: string;
  maker: string;
  location: string;
  note: string;
  quantity: number;
  unit_price: number;
  stock_status: string;
  reason?: string;
  received_by: string;
}

export interface StockOutFormData {
  name: string;
  specification: string
  maker: string;
  location: string
  note: string;
  quantity: number;
  project?: string;
  is_rental: boolean
  return_date?: string
  issued_by: string;
}

export interface StockIn extends Omit<StockHistory, 'id' | 'event_type'> {
  event_type: 'IN';
}

export interface StockOut extends Omit<StockHistory, 'id' | 'event_type'> {
  event_type: 'OUT';
}

// 업무일지 작성용 폼 데이터 타입
export interface WorkEntry {
  projectId: string;
  workContent: string;
  workType: string;
  workSubType: string;
  customProjectName: string;
  startTime?: string;
  endTime?: string;
  workHours?: number;
  overtime_hours?: number;
}

// 기타 필요한 인터페이스
export interface AccessLog {
  id: string;
  user_id: string;
  action: string;
  ip_address?: string;
  created_at: string;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  total_days: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  extendedProps?: {
    description?: string;
    location?: string;
    type?: string;
    projectId?: number;
  };
}

export interface ProjectEvent {
  id: string;
  project_id: number;
  event_type: string;
  event_date: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface LocalEvent {
  id: string;
  participant_id: string;
  created_by_id: string;
  summary: string;
  category: string;
  sub_category?: string;
  sub_sub_category?: string;
  project_id?: number;
  project_type?: string;
  custom_project?: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  start_date_time?: string;
  end_date_time?: string;
  created_at: string;
  updated_at: string;
}