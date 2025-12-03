-- 완전한 DB 스키마 설계
-- 모든 시스템을 통합한 강력한 데이터베이스 구조

-- 1. 사용자 및 권한 관리
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  department VARCHAR(100),
  position VARCHAR(100),
  level VARCHAR(50) DEFAULT 'user', -- admin, manager, user
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 프로젝트 관리
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_number VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) DEFAULT 'project', -- project, individual, standardization, wheel_conversion
  description TEXT,
  status VARCHAR(50) DEFAULT 'active', -- active, demolished, manufacturing, warranty
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
  start_date DATE,
  end_date DATE,
  assembly_date DATE, -- 조립완료일
  factory_test_date DATE, -- 공장시운전일
  site_test_date DATE, -- 현장시운전일
  completion_date DATE, -- 준공완료일
  warranty_period VARCHAR(100), -- 하자보증기간
  budget DECIMAL(15,2),
  manager_id UUID REFERENCES users(id),
  client_name VARCHAR(255),
  client_contact VARCHAR(255),
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 기본 정보
  base_name VARCHAR(255), -- 기지명
  
  -- 사양 정보
  hardware_version VARCHAR(100), -- 하드웨어 버전
  has_disk BOOLEAN DEFAULT false, -- 디스크 여부
  incoming_power VARCHAR(100), -- 인입전원
  primary_breaker VARCHAR(100), -- 1차 차단기
  
  -- 전원사양
  pvr_ampere DECIMAL(10,2), -- PVR [A]
  frequency DECIMAL(10,2), -- 주파수
  
  -- Drive 사양
  spindle_spec VARCHAR(255), -- 스핀들
  tool_post_spec VARCHAR(255), -- 공구대
  pump_low_spec VARCHAR(255), -- 펌프(저)
  pump_high_spec VARCHAR(255), -- 펌프(고)
  crusher_spec VARCHAR(255), -- 크러셔
  conveyor_spec VARCHAR(255), -- 컨베이어
  dust_collector_spec VARCHAR(255), -- 집진기
  
  -- 380V motor 사양
  vehicle_transfer_device VARCHAR(255), -- 차량이송장치
  oil_heater VARCHAR(255), -- 오일히터
  cooling_fan VARCHAR(255), -- COOLING FAN
  chiller VARCHAR(255), -- CHILLER
  
  -- 220V motor 사양
  lubrication VARCHAR(255), -- Luberication
  grease VARCHAR(255), -- Grease
  
  -- 차륜관리시스템
  cctv_spec VARCHAR(255), -- CCTV
  automatic_cover VARCHAR(255), -- 자동덮개(도어)
  ups_spec VARCHAR(255), -- UPS
  configuration VARCHAR(255), -- 구성
  
  -- 색상
  main_color VARCHAR(50), -- 메인 색상
  auxiliary_color VARCHAR(50), -- 보조 색상
  
  -- 옵션
  warning_light BOOLEAN DEFAULT false, -- 경광등
  buzzer BOOLEAN DEFAULT false, -- 부저
  speaker BOOLEAN DEFAULT false, -- speaker
  automatic_rail BOOLEAN DEFAULT false -- 자동레일
);

-- 3. 프로젝트 멤버
CREATE TABLE IF NOT EXISTS project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- manager, lead, member, observer
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- 4. 업무일지
CREATE TABLE IF NOT EXISTS work_diaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  work_date DATE NOT NULL,
  total_hours DECIMAL(4,2) DEFAULT 0,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'draft', -- draft, submitted, approved
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, work_date)
);

-- 5. 업무일지 상세 항목
CREATE TABLE IF NOT EXISTS work_diary_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  work_diary_id UUID REFERENCES work_diaries(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  custom_project_name VARCHAR(255),
  work_content TEXT NOT NULL,
  work_type VARCHAR(50), -- 신규, 보완, AS, SS, OV
  work_sub_type VARCHAR(50), -- 출장, 외근, 전화, 온라인
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 출장/외근 관리
CREATE TABLE IF NOT EXISTS business_trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  project_id UUID REFERENCES projects(id),
  trip_type VARCHAR(20) NOT NULL, -- business_trip, field_work
  sub_type VARCHAR(50), -- 시운전, 현장답사, 보완작업, AS, SS
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location VARCHAR(255),
  purpose TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, completed
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 출장 동행자
CREATE TABLE IF NOT EXISTS trip_companions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES business_trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

-- 8. 연차/반차 관리
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  leave_type VARCHAR(20) NOT NULL, -- annual, half_day, sick, personal
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME, -- 반차용
  end_time TIME, -- 반차용
  total_days DECIMAL(3,1) NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 재고 관리
CREATE TABLE IF NOT EXISTS stock_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  specification TEXT,
  category VARCHAR(100) NOT NULL,
  location VARCHAR(255),
  current_stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  max_stock INTEGER DEFAULT 0,
  unit VARCHAR(20) DEFAULT '개',
  supplier VARCHAR(255),
  status VARCHAR(20) DEFAULT 'new', -- new, used_new, used_used, broken
  notes TEXT,
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. 재고 입출고 기록
CREATE TABLE IF NOT EXISTS stock_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES stock_items(id) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL, -- in, out, adjustment
  quantity INTEGER NOT NULL,
  reason VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  transaction_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. 일정 관리 (FullCalendar 연동)
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  event_type VARCHAR(50) DEFAULT 'general', -- meeting, deadline, milestone, personal
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES users(id) NOT NULL,
  location VARCHAR(255),
  is_all_day BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. 알림 시스템
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- info, warning, error, success
  is_read BOOLEAN DEFAULT false,
  related_entity_type VARCHAR(50), -- project, trip, leave, stock
  related_entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. 시스템 설정
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_work_diaries_user_date ON work_diaries(user_id, work_date);
CREATE INDEX IF NOT EXISTS idx_work_diary_entries_diary ON work_diary_entries(work_diary_id);
CREATE INDEX IF NOT EXISTS idx_business_trips_user ON business_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_business_trips_status ON business_trips(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_user ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_item ON stock_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- RLS (Row Level Security) 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_diaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- 기본 정책들
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view projects they're members of" ON projects FOR SELECT USING (
  EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid())
);

CREATE POLICY "Users can view their own work diaries" ON work_diaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own work diaries" ON work_diaries FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own business trips" ON business_trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own business trips" ON business_trips FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own leave requests" ON leave_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own leave requests" ON leave_requests FOR ALL USING (auth.uid() = user_id);

-- 트리거 함수들
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 자동 업데이트 트리거들
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_diaries_updated_at BEFORE UPDATE ON work_diaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_trips_updated_at BEFORE UPDATE ON business_trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_items_updated_at BEFORE UPDATE ON stock_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 재고 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_stock_quantity()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_type = 'in' THEN
        UPDATE stock_items 
        SET current_stock = current_stock + NEW.quantity 
        WHERE id = NEW.item_id;
    ELSIF NEW.transaction_type = 'out' THEN
        UPDATE stock_items 
        SET current_stock = current_stock - NEW.quantity 
        WHERE id = NEW.item_id;
    ELSIF NEW.transaction_type = 'adjustment' THEN
        UPDATE stock_items 
        SET current_stock = NEW.quantity 
        WHERE id = NEW.item_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stock_on_transaction 
    AFTER INSERT ON stock_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_stock_quantity();

-- 샘플 데이터 삽입
INSERT INTO users (email, username, password_hash, first_name, last_name, department, position, level) VALUES
('admin@company.com', 'admin', '$2a$10$example', '관리자', '시스템', 'IT', '시스템관리자', 'admin'),
('manager@company.com', 'manager', '$2a$10$example', '팀장', '김', '개발', '팀장', 'manager'),
('user@company.com', 'user', '$2a$10$example', '사원', '이', '개발', '개발자', 'user')
ON CONFLICT (email) DO NOTHING;

INSERT INTO projects (project_number, name, description, status, priority, start_date, end_date, manager_id, created_by) VALUES
('PRJ-2024-001', '전력시스템 개선', '전력시스템 안정성 개선 프로젝트', 'active', 'high', '2024-01-01', '2024-12-31', 
 (SELECT id FROM users WHERE username = 'manager'), (SELECT id FROM users WHERE username = 'admin')),
('PRJ-2024-002', '재고관리 시스템', '재고관리 시스템 구축', 'active', 'medium', '2024-02-01', '2024-08-31',
 (SELECT id FROM users WHERE username = 'manager'), (SELECT id FROM users WHERE username = 'admin'))
ON CONFLICT (project_number) DO NOTHING;

INSERT INTO project_members (project_id, user_id, role) VALUES
((SELECT id FROM projects WHERE project_number = 'PRJ-2024-001'), (SELECT id FROM users WHERE username = 'manager'), 'manager'),
((SELECT id FROM projects WHERE project_number = 'PRJ-2024-001'), (SELECT id FROM users WHERE username = 'user'), 'member'),
((SELECT id FROM projects WHERE project_number = 'PRJ-2024-002'), (SELECT id FROM users WHERE username = 'manager'), 'manager'),
((SELECT id FROM projects WHERE project_number = 'PRJ-2024-002'), (SELECT id FROM users WHERE username = 'user'), 'member')
ON CONFLICT (project_id, user_id) DO NOTHING;
