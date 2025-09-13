-- ========================================
-- 최종 테이블 통합 스크립트
-- items + current_stock → 단일 items 테이블 (UUID 기반)
-- ========================================

-- 1단계: 현재 상태 확인
SELECT '=== 현재 테이블 상태 확인 ===' as info;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('items', 'current_stock', 'unified_items')
ORDER BY table_name;

-- 2단계: 기존 테이블 백업
CREATE TABLE IF NOT EXISTS items_backup_final AS SELECT * FROM items;
CREATE TABLE IF NOT EXISTS current_stock_backup_final AS SELECT * FROM current_stock;

-- 3단계: 통합된 테이블 생성 (UUID 기반)
DROP TABLE IF EXISTS unified_items_final CASCADE;

CREATE TABLE unified_items_final (
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

-- 4단계: 기존 데이터 통합 및 마이그레이션
INSERT INTO unified_items_final (
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
  gen_random_uuid() as id,  -- 새로운 UUID 생성
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
LEFT JOIN current_stock cs ON i.id::text = cs.item_id::text
UNION ALL
SELECT 
  gen_random_uuid() as id,  -- 새로운 UUID 생성
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
WHERE NOT EXISTS (
  SELECT 1 FROM items i WHERE i.id::text = cs.item_id::text
);

-- 5단계: 기존 테이블 삭제
DROP TABLE IF EXISTS current_stock CASCADE;
DROP TABLE IF EXISTS items CASCADE;

-- 6단계: 통합된 테이블을 items로 이름 변경
ALTER TABLE unified_items_final RENAME TO items;

-- 7단계: 인덱스 및 제약조건 설정
CREATE INDEX IF NOT EXISTS idx_items_product ON items(product);
CREATE INDEX IF NOT EXISTS idx_items_spec ON items(spec);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(stock_status);
CREATE INDEX IF NOT EXISTS idx_items_location ON items(location);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at);

-- 8단계: RLS 정책 설정
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "모든 사용자 읽기 가능" ON items;
DROP POLICY IF EXISTS "인증된 사용자 수정 가능" ON items;
DROP POLICY IF EXISTS "인증된 사용자 삭제 가능" ON items;

-- 새로운 정책 생성
CREATE POLICY "모든 사용자 읽기 가능" ON items
FOR SELECT USING (true);

CREATE POLICY "인증된 사용자 수정 가능" ON items
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "인증된 사용자 삭제 가능" ON items
FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "인증된 사용자 삽입 가능" ON items
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 9단계: 결과 확인
SELECT '=== 통합 완료 ===' as info;
SELECT COUNT(*) as total_items FROM items;
SELECT 
  id,
  product,
  spec,
  maker,
  current_quantity,
  stock_status,
  location
FROM items 
ORDER BY created_at DESC
LIMIT 5;

-- 10단계: ID 타입 확인
SELECT '=== ID 타입 확인 ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'items'
AND column_name = 'id';

SELECT '=== 통합 완료! 이제 UUID 기반 단일 테이블을 사용합니다 ===' as info;
