-- 재고 관리 기본 테이블 생성

-- 1. 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  department TEXT,
  position TEXT,
  is_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  password TEXT NOT NULL, -- 비밀번호 컬럼 추가
  level TEXT DEFAULT 'level1', -- 권한 레벨 컬럼 추가
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 품목 테이블 - 입고 순서대로 인덱스 번호를 기본키로 사용
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY, -- 입고 순서대로 1, 2, 3... 자동 생성
  product TEXT NOT NULL,
  spec TEXT,
  maker TEXT,
  category TEXT,
  unit_price DECIMAL(15,2) DEFAULT 0,
  purpose TEXT DEFAULT '재고관리',
  min_stock INTEGER DEFAULT 0,
  note TEXT,
  stock_status TEXT DEFAULT 'new', -- 품목 상태 추가
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 현재 재고 테이블
CREATE TABLE IF NOT EXISTS current_stock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id), -- INTEGER로 변경
  product TEXT NOT NULL,
  spec TEXT,
  maker TEXT,
  category TEXT,
  current_quantity INTEGER DEFAULT 0,
  unit_price DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(18,2) DEFAULT 0,
  location TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 입고 내역 테이블
CREATE TABLE IF NOT EXISTS stock_in (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id), -- INTEGER로 변경
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(18,2) DEFAULT 0,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  received_by TEXT NOT NULL,
  reason TEXT,
  stock_status TEXT DEFAULT 'new', -- 품목 상태 추가
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 출고 내역 테이블
CREATE TABLE IF NOT EXISTS stock_out (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id), -- INTEGER로 변경
  quantity INTEGER NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  issued_by TEXT NOT NULL,
  project TEXT,
  is_rental BOOLEAN DEFAULT false,
  return_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_items_product ON items(product);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_id ON items(id); -- 입고 순서 인덱스 최적화
CREATE INDEX IF NOT EXISTS idx_current_stock_item ON current_stock(item_id);
CREATE INDEX IF NOT EXISTS idx_current_stock_product ON current_stock(product);
CREATE INDEX IF NOT EXISTS idx_stock_in_item ON stock_in(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_in_date ON stock_in(received_at);
CREATE INDEX IF NOT EXISTS idx_stock_out_item ON stock_out(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_out_date ON stock_out(issued_at);

-- RLS 정책 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_in ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_out ENABLE ROW LEVEL SECURITY;

-- 기본 정책: 모든 사용자가 읽기 가능
CREATE POLICY "모든 사용자 읽기 가능" ON users FOR SELECT USING (true);
CREATE POLICY "모든 사용자 읽기 가능" ON items FOR SELECT USING (true);
CREATE POLICY "모든 사용자 읽기 가능" ON current_stock FOR SELECT USING (true);
CREATE POLICY "모든 사용자 읽기 가능" ON stock_in FOR SELECT USING (true);
CREATE POLICY "모든 사용자 읽기 가능" ON stock_out FOR SELECT USING (true);

-- 관리자만 쓰기 가능
CREATE POLICY "관리자만 사용자 관리" ON users FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

CREATE POLICY "관리자만 품목 관리" ON items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

CREATE POLICY "관리자만 재고 관리" ON current_stock FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

CREATE POLICY "관리자만 입고 관리" ON stock_in FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

CREATE POLICY "관리자만 출고 관리" ON stock_out FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

-- 샘플 데이터는 제거됨
-- 실제 운영 환경에서는 관리자가 직접 사용자 계정을 추가하세요

-- 샘플 재고 데이터도 제거됨
-- 실제 운영 환경에서는 관리자가 직접 재고 데이터를 추가하세요
