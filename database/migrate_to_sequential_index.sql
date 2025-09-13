-- =====================================================
-- 기존 UUID 기반 DB를 입고 순서 인덱스 기반으로 마이그레이션
-- PostgreSQL용 마이그레이션 스크립트
-- =====================================================

-- 1) 백업 테이블 생성 (안전을 위해)
CREATE TABLE IF NOT EXISTS items_backup AS SELECT * FROM items;
CREATE TABLE IF NOT EXISTS current_stock_backup AS SELECT * FROM current_stock;
CREATE TABLE IF NOT EXISTS stock_in_backup AS SELECT * FROM stock_in;
CREATE TABLE IF NOT EXISTS stock_out_backup AS SELECT * FROM stock_out;

-- 2) 기존 테이블 삭제 (외래키 제약 때문에 순서 중요)
DROP TABLE IF EXISTS stock_out CASCADE;
DROP TABLE IF EXISTS stock_in CASCADE;
DROP TABLE IF EXISTS current_stock CASCADE;
DROP TABLE IF EXISTS items CASCADE;

-- 3) 새로운 스키마로 테이블 재생성
-- 3-1) 품목 테이블 - 입고 순서대로 인덱스 번호를 기본키로 사용
CREATE TABLE items (
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

-- 3-2) 현재 재고 테이블
CREATE TABLE current_stock (
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

-- 3-3) 입고 내역 테이블
CREATE TABLE stock_in (
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

-- 3-4) 출고 내역 테이블
CREATE TABLE stock_out (
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

-- 4) 인덱스 생성
CREATE INDEX idx_items_product ON items(product);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_id ON items(id); -- 입고 순서 인덱스 최적화
CREATE INDEX idx_current_stock_item ON current_stock(item_id);
CREATE INDEX idx_current_stock_product ON current_stock(product);
CREATE INDEX idx_stock_in_item ON stock_in(item_id);
CREATE INDEX idx_stock_in_date ON stock_in(received_at);
CREATE INDEX idx_stock_out_item ON stock_out(item_id);
CREATE INDEX idx_stock_out_date ON stock_out(issued_at);

-- 5) RLS 정책 설정
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_in ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_out ENABLE ROW LEVEL SECURITY;

-- 기본 정책: 모든 사용자가 읽기 가능
CREATE POLICY "모든 사용자 읽기 가능" ON items FOR SELECT USING (true);
CREATE POLICY "모든 사용자 읽기 가능" ON current_stock FOR SELECT USING (true);
CREATE POLICY "모든 사용자 읽기 가능" ON stock_in FOR SELECT USING (true);
CREATE POLICY "모든 사용자 읽기 가능" ON stock_out FOR SELECT USING (true);

-- 관리자만 쓰기 가능
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

-- 6) 기존 데이터 마이그레이션 (순서대로 처리)
-- 6-1) items 테이블 데이터 마이그레이션
INSERT INTO items (product, spec, maker, category, unit_price, purpose, min_stock, note, stock_status, created_at, updated_at)
SELECT 
  product, 
  spec, 
  maker, 
  category, 
  unit_price, 
  purpose, 
  min_stock, 
  note, 
  COALESCE(stock_status, 'new') as stock_status,
  created_at, 
  updated_at
FROM items_backup
ORDER BY created_at; -- 입고 순서대로 정렬하여 인덱스 할당

-- 6-2) current_stock 테이블 데이터 마이그레이션
INSERT INTO current_stock (item_id, product, spec, maker, category, current_quantity, unit_price, total_amount, location, note, created_at, updated_at)
SELECT 
  i.id as item_id, -- 새로운 순차 인덱스 사용
  cs.product, 
  cs.spec, 
  cs.maker, 
  cs.category, 
  cs.current_quantity, 
  cs.unit_price, 
  cs.total_amount, 
  cs.location, 
  cs.note, 
  cs.created_at, 
  cs.updated_at
FROM current_stock_backup cs
JOIN items_backup ib ON cs.item_id = ib.id
JOIN items i ON i.product = ib.product AND i.spec = ib.spec;

-- 6-3) stock_in 테이블 데이터 마이그레이션
INSERT INTO stock_in (item_id, quantity, unit_price, total_amount, received_at, received_by, reason, stock_status, notes, created_at)
SELECT 
  i.id as item_id, -- 새로운 순차 인덱스 사용
  si.quantity, 
  si.unit_price, 
  si.total_amount, 
  si.received_at, 
  si.received_by, 
  si.reason, 
  COALESCE(si.stock_status, 'new') as stock_status,
  si.notes, 
  si.created_at
FROM stock_in_backup si
JOIN items_backup ib ON si.item_id = ib.id
JOIN items i ON i.product = ib.product AND i.spec = ib.spec;

-- 6-4) stock_out 테이블 데이터 마이그레이션
INSERT INTO stock_out (item_id, quantity, issued_at, issued_by, project, is_rental, return_date, notes, created_at)
SELECT 
  i.id as item_id, -- 새로운 순차 인덱스 사용
  so.quantity, 
  so.issued_at, 
  so.issued_by, 
  so.project, 
  so.is_rental, 
  so.return_date, 
  so.notes, 
  so.created_at
FROM stock_out_backup so
JOIN items_backup ib ON so.item_id = ib.id
JOIN items i ON i.product = ib.product AND i.spec = ib.spec;

-- 7) 마이그레이션 완료 확인
SELECT 
  'items' as table_name, 
  COUNT(*) as record_count 
FROM items
UNION ALL
SELECT 
  'current_stock' as table_name, 
  COUNT(*) as record_count 
FROM current_stock
UNION ALL
SELECT 
  'stock_in' as table_name, 
  COUNT(*) as record_count 
FROM stock_in
UNION ALL
SELECT 
  'stock_out' as table_name, 
  COUNT(*) as record_count 
FROM stock_out;

-- 8) 백업 테이블 정리 (마이그레이션 성공 확인 후)
-- DROP TABLE IF EXISTS items_backup;
-- DROP TABLE IF EXISTS current_stock_backup;
-- DROP TABLE IF EXISTS stock_in_backup;
-- DROP TABLE IF EXISTS stock_out_backup;

-- 9) 시퀀스 재설정 (필요시)
-- SELECT setval('items_id_seq', (SELECT MAX(id) FROM items));
