-- ========================================
-- DB 스키마 및 제약조건 최종 수정 스크립트
-- ========================================

-- 1단계: 현재 테이블 구조 확인
SELECT '=== 현재 테이블 구조 ===' as info;

-- items 테이블 구조
SELECT 'items 테이블' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'items'
ORDER BY ordinal_position;

-- stock_history 테이블 구조  
SELECT 'stock_history 테이블' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'stock_history'
ORDER BY ordinal_position;

-- 2단계: 제약조건 확인
SELECT '=== 현재 제약조건 ===' as info;

-- items 테이블 제약조건
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'items';

-- stock_history 테이블 제약조건
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'stock_history';

-- 3단계: items 테이블 수정
SELECT '=== items 테이블 수정 ===' as info;

-- 기존 제약조건 삭제
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_stock_status_check;
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_pkey CASCADE;

-- id 컬럼을 UUID로 변경
ALTER TABLE items ALTER COLUMN id TYPE UUID USING gen_random_uuid();
ALTER TABLE items ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE items ALTER COLUMN id SET NOT NULL;

-- unit_price 제약조건 수정
ALTER TABLE items ALTER COLUMN unit_price SET NOT NULL;
ALTER TABLE items ADD CONSTRAINT items_unit_price_positive CHECK (unit_price > 0);

-- stock_status 제약조건 재생성
ALTER TABLE items ADD CONSTRAINT items_stock_status_check 
  CHECK (stock_status IN ('new', 'used-new', 'used-used', 'broken'));

-- 기본값 설정
ALTER TABLE items ALTER COLUMN stock_status SET DEFAULT 'new';

-- Primary Key 재생성
ALTER TABLE items ADD CONSTRAINT items_pkey PRIMARY KEY (id);

-- 4단계: stock_history 테이블 수정
SELECT '=== stock_history 테이블 수정 ===' as info;

-- 기존 제약조건 삭제
ALTER TABLE stock_history DROP CONSTRAINT IF EXISTS stock_history_condition_type_check;
ALTER TABLE stock_history DROP CONSTRAINT IF EXISTS stock_history_item_id_fkey;

-- item_id 컬럼을 UUID로 변경
ALTER TABLE stock_history ALTER COLUMN item_id TYPE UUID USING gen_random_uuid();
ALTER TABLE stock_history ALTER COLUMN item_id SET NOT NULL;

-- condition_type 제약조건 재생성
ALTER TABLE stock_history ADD CONSTRAINT stock_history_condition_type_check 
  CHECK (condition_type IN ('new', 'used-new', 'used-used', 'broken'));

-- 기본값 설정
ALTER TABLE stock_history ALTER COLUMN condition_type SET DEFAULT 'new';

-- Foreign Key 재생성
ALTER TABLE stock_history ADD CONSTRAINT stock_history_item_id_fkey 
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;

-- 5단계: current_stock 뷰 재생성
SELECT '=== current_stock 뷰 재생성 ===' as info;

-- 기존 뷰/테이블 삭제
DROP VIEW IF EXISTS current_stock CASCADE;
DROP TABLE IF EXISTS current_stock CASCADE;

-- 새로운 current_stock 뷰 생성
CREATE VIEW current_stock AS
SELECT
  i.id,
  i.product,
  i.spec,
  i.maker,
  COALESCE(i.location, '창고A') as location,
  i.unit_price,
  i.purpose,
  i.min_stock,
  i.category,
  i.stock_status,
  i.note,
  COALESCE(
    (SELECT SUM(sh.quantity) 
     FROM stock_history sh 
     WHERE sh.item_id = i.id 
     AND sh.event_type IN ('IN', 'PLUS', 'ADJUSTMENT')
    ), 0
  ) - COALESCE(
    (SELECT SUM(sh.quantity) 
     FROM stock_history sh 
     WHERE sh.item_id = i.id 
     AND sh.event_type IN ('OUT', 'MINUS', 'DISPOSAL')
    ), 0
  ) as current_quantity,
  (COALESCE(
    (SELECT SUM(sh.quantity) 
     FROM stock_history sh 
     WHERE sh.item_id = i.id 
     AND sh.event_type IN ('IN', 'PLUS', 'ADJUSTMENT')
    ), 0
  ) - COALESCE(
    (SELECT SUM(sh.quantity) 
     FROM stock_history sh 
     WHERE sh.item_id = i.id 
     AND sh.event_type IN ('OUT', 'MINUS', 'DISPOSAL')
    ), 0
  )) * i.unit_price as total_amount,
  i.created_at,
  i.updated_at
FROM items i;

-- 6단계: 뷰 권한 설정
GRANT SELECT ON current_stock TO authenticated;
GRANT SELECT ON current_stock TO anon;

-- 7단계: 최종 구조 확인
SELECT '=== 수정 후 구조 확인 ===' as info;

-- items 테이블 최종 구조
SELECT 'items 테이블 (수정 후)' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'items'
ORDER BY ordinal_position;

-- stock_history 테이블 최종 구조
SELECT 'stock_history 테이블 (수정 후)' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'stock_history'
ORDER BY ordinal_position;

-- 8단계: 테스트 데이터 확인
SELECT '=== 테스트 데이터 확인 ===' as info;
SELECT 
  id,
  product,
  spec,
  current_quantity,
  stock_status,
  unit_price
FROM current_stock 
LIMIT 5;

-- 9단계: 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DB 스키마 및 제약조건 수정 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '- items.id: UUID 타입으로 변경';
  RAISE NOTICE '- stock_history.item_id: UUID 타입으로 변경';
  RAISE NOTICE '- unit_price: NOT NULL + 양수 제약';
  RAISE NOTICE '- stock_status: 올바른 값만 허용';
  RAISE NOTICE '- condition_type: 올바른 값만 허용';
  RAISE NOTICE '- current_stock: 뷰로 재생성';
  RAISE NOTICE '========================================';
END $$;
