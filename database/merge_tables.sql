-- ========================================
-- 테이블 통합 스크립트: items + current_stock → unified_items
-- ========================================

-- 1단계: 기존 테이블 백업
CREATE TABLE IF NOT EXISTS items_backup AS SELECT * FROM items;
CREATE TABLE IF NOT EXISTS current_stock_backup AS SELECT * FROM current_stock;

-- 2단계: 통합된 테이블 생성
DROP TABLE IF EXISTS unified_items CASCADE;

CREATE TABLE unified_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product TEXT NOT NULL,                    -- 품목명
  spec TEXT,                                -- 규격
  maker TEXT,                               -- 제조사
  unit_price DECIMAL(15,2) DEFAULT 0,       -- 단가
  purpose TEXT DEFAULT '재고관리',           -- 용도
  location TEXT DEFAULT '창고A',            -- 보관위치
  current_quantity INTEGER DEFAULT 0,       -- 현재수량
  stock_in_quantity INTEGER DEFAULT 0,      -- 누적 입고수량
  stock_out_quantity INTEGER DEFAULT 0,     -- 누적 출고수량
  stock_status TEXT DEFAULT 'new',          -- 재고상태 (new, used-new, used-used, broken)
  note TEXT,                                -- 비고
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3단계: 기존 데이터 통합 및 마이그레이션
INSERT INTO unified_items (
  id,
  product,
  spec,
  maker,
  unit_price,
  purpose,
  location,
  current_quantity,
  stock_in_quantity,
  stock_out_quantity,
  stock_status,
  note,
  created_at,
  updated_at
)
SELECT 
  COALESCE(cs.id, i.id) as id,
  COALESCE(cs.product, i.product) as product,
  COALESCE(cs.spec, i.spec) as spec,
  COALESCE(cs.maker, i.maker) as maker,
  COALESCE(cs.unit_price, i.unit_price, 0) as unit_price,
  COALESCE(i.purpose, '재고관리') as purpose,
  COALESCE(cs.location, i.location, '창고A') as location,
  COALESCE(cs.current_quantity, i.current_quantity, 0) as current_quantity,
  COALESCE(cs.stock_in_quantity, 0) as stock_in_quantity,
  COALESCE(cs.stock_out_quantity, 0) as stock_out_quantity,
  COALESCE(cs.stock_status, i.stock_status, 'new') as stock_status,
  COALESCE(cs.note, i.note) as note,
  COALESCE(cs.created_at, i.created_at, NOW()) as created_at,
  COALESCE(cs.updated_at, i.updated_at, NOW()) as updated_at
FROM items i
LEFT JOIN current_stock cs ON i.id = cs.item_id
UNION ALL
SELECT 
  cs.id,
  cs.product,
  cs.spec,
  cs.maker,
  cs.unit_price,
  '재고관리' as purpose,
  cs.location,
  cs.current_quantity,
  cs.stock_in_quantity,
  cs.stock_out_quantity,
  cs.stock_status,
  cs.note,
  cs.created_at,
  cs.updated_at
FROM current_stock cs
WHERE cs.item_id IS NULL;

-- 4단계: 기존 테이블 삭제
DROP TABLE IF EXISTS current_stock CASCADE;
DROP TABLE IF EXISTS items CASCADE;

-- 5단계: 통합된 테이블을 items로 이름 변경
ALTER TABLE unified_items RENAME TO items;

-- 6단계: 인덱스 및 제약조건 설정
CREATE INDEX IF NOT EXISTS idx_items_product ON items(product);
CREATE INDEX IF NOT EXISTS idx_items_spec ON items(spec);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(stock_status);
CREATE INDEX IF NOT EXISTS idx_items_location ON items(location);

-- 7단계: RLS 정책 설정
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "모든 사용자 읽기 가능" ON items
FOR SELECT USING (true);

CREATE POLICY "인증된 사용자 수정 가능" ON items
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "인증된 사용자 삭제 가능" ON items
FOR DELETE USING (auth.role() = 'authenticated');

-- 8단계: 결과 확인
SELECT '=== 통합 완료 ===' as info;
SELECT COUNT(*) as total_items FROM items;
SELECT 
  product,
  spec,
  maker,
  current_quantity,
  stock_status,
  location
FROM items 
LIMIT 5;

-- 9단계: 백업 테이블 정리 (필요시)
-- DROP TABLE IF EXISTS items_backup;
-- DROP TABLE IF EXISTS current_stock_backup;
