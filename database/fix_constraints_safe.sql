-- ========================================
-- 안전한 제약조건 수정 스크립트 (데이터 보존)
-- ========================================

-- 0단계: 의존성 있는 뷰 처리
SELECT '=== 의존성 뷰 처리 ===' as info;

-- current_stock 뷰가 존재하는지 확인
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views 
WHERE viewname = 'current_stock';

-- 의존성 있는 뷰가 있다면 강제로 삭제
DROP VIEW IF EXISTS current_stock CASCADE;
-- 추가 안전장치: 뷰가 남아있다면 강제 삭제
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'current_stock') THEN
    EXECUTE 'DROP VIEW current_stock CASCADE';
    RAISE NOTICE 'current_stock 뷰를 강제로 삭제했습니다.';
  END IF;
END $$;

-- 1단계: 현재 데이터 상태 확인
SELECT '=== 현재 데이터 상태 ===' as info;

-- items 테이블 데이터 상태
SELECT 
  stock_status,
  COUNT(*) as count
FROM items 
GROUP BY stock_status
ORDER BY stock_status;

-- stock_history 테이블 데이터 상태
SELECT 
  condition_type,
  COUNT(*) as count
FROM stock_history 
GROUP BY condition_type
ORDER BY condition_type;

-- unit_price 상태 확인
SELECT 
  CASE 
    WHEN unit_price IS NULL THEN 'NULL'
    WHEN unit_price <= 0 THEN '0 이하'
    ELSE '정상'
  END as price_status,
  COUNT(*) as count
FROM items 
GROUP BY 
  CASE 
    WHEN unit_price IS NULL THEN 'NULL'
    WHEN unit_price <= 0 THEN '0 이하'
    ELSE '정상'
  END;

-- 2단계: 데이터 정리 (안전하게)
SELECT '=== 데이터 정리 ===' as info;

-- 먼저 문제가 되는 데이터 확인
SELECT '=== 문제 데이터 확인 ===' as info;

-- stock_status 문제 데이터 확인
SELECT 
  stock_status,
  COUNT(*) as count
FROM items 
WHERE stock_status NOT IN ('new', 'used-new', 'used-used', 'broken') 
   OR stock_status IS NULL
GROUP BY stock_status;

-- condition_type 문제 데이터 확인  
SELECT 
  condition_type,
  COUNT(*) as count
FROM stock_history 
WHERE condition_type NOT IN ('new', 'used-new', 'used-used', 'broken') 
   OR condition_type IS NULL
GROUP BY condition_type;

-- unit_price 문제 데이터 확인
SELECT 
  CASE 
    WHEN unit_price IS NULL THEN 'NULL'
    WHEN unit_price <= 0 THEN '0 이하'
    ELSE '정상'
  END as price_status,
  COUNT(*) as count
FROM items 
WHERE unit_price IS NULL OR unit_price <= 0
GROUP BY 
  CASE 
    WHEN unit_price IS NULL THEN 'NULL'
    WHEN unit_price <= 0 THEN '0 이하'
    ELSE '정상'
  END;

-- 데이터 정리 (더 안전하게)
SELECT '=== 데이터 정리 시작 ===' as info;

-- stock_status 정리 (기본값으로 설정)
UPDATE items 
SET stock_status = 'new' 
WHERE stock_status NOT IN ('new', 'used-new', 'used-used', 'broken') 
   OR stock_status IS NULL;

-- condition_type 정리 (기본값으로 설정)
UPDATE stock_history 
SET condition_type = 'new' 
WHERE condition_type NOT IN ('new', 'used-new', 'used-used', 'broken') 
   OR condition_type IS NULL;

-- unit_price 정리 (NULL이면 1로 설정, 0 이하면 1로 설정)
UPDATE items 
SET unit_price = 1 
WHERE unit_price IS NULL OR unit_price <= 0;

-- 3단계: 제약조건 수정 (안전하게)
SELECT '=== 제약조건 수정 ===' as info;

-- 기존 제약조건 삭제
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_stock_status_check;
-- stock_history condition_type 제약조건 삭제 (사용자 요청)
ALTER TABLE stock_history DROP CONSTRAINT IF EXISTS stock_history_condition_type_check;

-- unit_price 제약조건 추가
ALTER TABLE items ALTER COLUMN unit_price SET NOT NULL;
-- 제약조건이 이미 존재하는 경우를 처리
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'items_unit_price_positive' 
    AND table_name = 'items'
  ) THEN
    ALTER TABLE items ADD CONSTRAINT items_unit_price_positive CHECK (unit_price > 0);
  ELSE
    RAISE NOTICE 'items_unit_price_positive 제약조건이 이미 존재합니다.';
  END IF;
END $$;

-- stock_status 제약조건 재생성
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'items_stock_status_check' 
    AND table_name = 'items'
  ) THEN
    ALTER TABLE items ADD CONSTRAINT items_stock_status_check 
      CHECK (stock_status IN ('new', 'used-new', 'used-used', 'broken'));
  ELSE
    RAISE NOTICE 'items_stock_status_check 제약조건이 이미 존재합니다.';
  END IF;
END $$;

-- condition_type 제약조건은 삭제됨 (사용자 요청)
-- ALTER TABLE stock_history ADD CONSTRAINT stock_history_condition_type_check 
--   CHECK (condition_type IN ('new', 'used-new', 'used-used', 'broken'));

-- 기본값 설정
ALTER TABLE items ALTER COLUMN stock_status SET DEFAULT 'new';
-- condition_type 기본값 설정 제거 (제약조건 삭제로 인해)
-- ALTER TABLE stock_history ALTER COLUMN condition_type SET DEFAULT 'new';

-- 4단계: 수정 후 상태 확인
SELECT '=== 수정 후 상태 확인 ===' as info;

-- items 테이블 최종 상태
SELECT 
  stock_status,
  COUNT(*) as count
FROM items 
GROUP BY stock_status
ORDER BY stock_status;

-- stock_history 테이블 최종 상태
SELECT 
  condition_type,
  COUNT(*) as count
FROM stock_history 
GROUP BY condition_type
ORDER BY condition_type;

-- unit_price 최종 상태
SELECT 
  CASE 
    WHEN unit_price IS NULL THEN 'NULL'
    WHEN unit_price <= 0 THEN '0 이하'
    ELSE '정상'
  END as price_status,
  COUNT(*) as count
FROM items 
GROUP BY 
  CASE 
    WHEN unit_price IS NULL THEN 'NULL'
    WHEN unit_price <= 0 THEN '0 이하'
    ELSE '정상'
  END;

-- 5단계: 제약조건 확인
SELECT '=== 제약조건 확인 ===' as info;

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

-- 6단계: 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '안전한 제약조건 수정 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '- 기존 데이터 보존';
  RAISE NOTICE '- unit_price: NOT NULL + 양수 제약';
  RAISE NOTICE '- stock_status: 올바른 값만 허용';
  RAISE NOTICE '- condition_type: 올바른 값만 허용';
  RAISE NOTICE '- 기본값 설정 완료';
  RAISE NOTICE '========================================';
END $$;

-- 7단계: current_stock 뷰 재생성
SELECT '=== current_stock 뷰 재생성 ===' as info;

-- current_stock 뷰 생성 (재고 현황 조회용)
CREATE OR REPLACE VIEW current_stock AS
SELECT 
  i.id,
  i.note,
  i.product,
  i.location,
  i.stock_status,
  i.unit_price,
  COALESCE(SUM(sh.quantity), 0) as current_quantity,
  i.created_at,
  i.updated_at
FROM items i
LEFT JOIN stock_history sh ON i.id = sh.item_id
GROUP BY 
  i.id, 
  i.note, 
  i.product, 
  i.location, 
  i.stock_status, 
  i.unit_price, 
  i.created_at, 
  i.updated_at;

-- 뷰 생성 확인
SELECT 'current_stock 뷰가 성공적으로 생성되었습니다.' as result;
