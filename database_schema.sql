-- 품목 마스터 테이블
CREATE TABLE items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  specification VARCHAR(255),
  maker VARCHAR(255),
  purpose TEXT,
  unit_price DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- items 테이블에 specification과 purpose 컬럼 추가
ALTER TABLE items ADD COLUMN specification VARCHAR(255), ADD COLUMN purpose TEXT;

-- 기존 데이터에 기본값 설정 (선택사항)
UPDATE items SET specification = '', purpose = '' WHERE specification IS NULL OR purpose IS NULL;

-- items 테이블에 maker 컬럼 추가
ALTER TABLE items ADD COLUMN maker VARCHAR(255);

-- 기존 데이터에 기본값 설정
UPDATE items SET maker = '' WHERE maker IS NULL;

-- 입고 이력 테이블
CREATE TABLE stock_in (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  condition_type VARCHAR(50) DEFAULT 'new' CHECK (condition_type IN ('new', 'used_good', 'used_defective', 'unknown')),
  received_by VARCHAR(100),
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  project VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 출고 이력 테이블
CREATE TABLE stock_out (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  issued_by VARCHAR(100),
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  project VARCHAR(255),
  is_rental BOOLEAN DEFAULT FALSE,
  return_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 폐기 이력 테이블
CREATE TABLE disposal (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_in_id UUID REFERENCES stock_in(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  disposed_by VARCHAR(100),
  disposed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 실시간 재고 뷰 (현재 재고량과 총 금액 계산) - 폐기 수량 제외
CREATE VIEW current_stock AS
SELECT 
  i.id,
  i.name,
  i.specification,
  i.maker,
  i.purpose,
  i.unit_price,
  COALESCE(SUM(si.quantity), 0) - COALESCE(SUM(so.quantity), 0) - COALESCE(SUM(d.quantity), 0) as current_quantity,
  COALESCE(SUM(si.quantity), 0) as total_in,
  COALESCE(SUM(so.quantity), 0) as total_out,
  COALESCE(SUM(d.quantity), 0) as total_disposed,
  (COALESCE(SUM(si.quantity), 0) - COALESCE(SUM(so.quantity), 0) - COALESCE(SUM(d.quantity), 0)) * i.unit_price as total_value
FROM items i
LEFT JOIN stock_in si ON i.id = si.item_id
LEFT JOIN stock_out so ON i.id = so.item_id
LEFT JOIN disposal d ON i.id = d.item_id
GROUP BY i.id, i.name, i.specification, i.maker, i.purpose, i.unit_price;

-- 사용자 테이블
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(100),
  position VARCHAR(100),
  phone VARCHAR(20),
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 그룹 테이블
CREATE TABLE user_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 그룹 멤버십 테이블
CREATE TABLE user_group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES user_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);

-- 기본 사용자 그룹들 추가
INSERT INTO user_groups (name, description) VALUES
('Administrator', '시스템 관리자 - 모든 권한'),
('PIC', '담당자 - 프로젝트 및 재고 관리'),
('Manager', '매니저 - 팀 및 부서 관리'),
('Normal', '일반 사용자 - 기본 권한');

-- 기본 관리자 계정 추가
INSERT INTO users (username, password, name, department, position, phone, is_admin) VALUES
('admin', 'admin', '관리자', 'IT', '시스템관리자', '010-0000-0000', true);

-- 관리자를 Administrator 그룹에 추가
INSERT INTO user_group_members (user_id, group_id)
SELECT u.id, g.id
FROM users u, user_groups g
WHERE u.username = 'admin' AND g.name = 'Administrator';

-- stock_out 테이블에 reason 컬럼 추가
ALTER TABLE stock_out ADD COLUMN IF NOT EXISTS reason TEXT; 