-- ========================================
-- current_stock 테이블 구조 확인 및 수정 스크립트
-- ========================================

-- 1단계: 현재 테이블 구조 확인
SELECT '=== current_stock 테이블 구조 ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'current_stock'
ORDER BY ordinal_position;

-- 2단계: current_stock이 테이블인지 뷰인지 확인
SELECT 
  schemaname,
  tablename,
  tabletype
FROM pg_tables 
WHERE tablename = 'current_stock'
UNION ALL
SELECT 
  schemaname,
  viewname as tablename,
  'view' as tabletype
FROM pg_views 
WHERE viewname = 'current_stock';

-- 3단계: items 테이블 구조 확인
SELECT '=== items 테이블 구조 ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'items'
ORDER BY ordinal_position;

-- 4단계: stock_history 테이블 구조 확인
SELECT '=== stock_history 테이블 구조 ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'stock_history'
ORDER BY ordinal_position;

-- 5단계: current_stock이 뷰인 경우 재생성
-- 기존 뷰 삭제
DROP VIEW IF EXISTS current_stock CASCADE;

-- 새로운 current_stock 뷰 생성 (items 테이블 기반)
CREATE VIEW current_stock AS
SELECT
  i.id,
  i.product,
  i.spec,
  i.maker,
  i.location,
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
SELECT '=== 수정 후 current_stock 뷰 구조 ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'current_stock'
ORDER BY ordinal_position;

-- 8단계: 테스트 데이터 확인
SELECT '=== current_stock 뷰 테스트 ===' as info;
SELECT 
  id,
  product,
  spec,
  current_quantity,
  stock_status
FROM current_stock 
LIMIT 5;

-- 9단계: 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'current_stock 뷰 재생성 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '- item_id 컬럼 문제 해결';
  RAISE NOTICE '- 자동 재고 계산 로직 적용';
  RAISE NOTICE '- 권한 설정 완료';
  RAISE NOTICE '========================================';
END $$;
