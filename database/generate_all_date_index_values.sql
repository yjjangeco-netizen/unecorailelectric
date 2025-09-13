-- ========================================
-- 모든 테이블에 date_index 값 생성 (UUID/SERIAL ID 대체용)
-- 형식: 20250831_001, 20250831_002...
-- ========================================

-- 1단계: items 테이블의 date_index 값 생성 (UUID 대체용)
UPDATE items
SET date_index = subquery.date_index
FROM (
  SELECT
    id,
    TO_CHAR(created_at, 'YYYYMMDD') || '_' ||
    LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 3, '0') as date_index
  FROM items
) subquery
WHERE items.id = subquery.id;

-- 2단계: current_stock 테이블의 date_index 값 생성 (SERIAL ID 대체용)
UPDATE current_stock
SET date_index = subquery.date_index
FROM (
  SELECT
    id,
    TO_CHAR(created_at, 'YYYYMMDD') || '_' ||
    LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 3, '0') as date_index
  FROM current_stock
) subquery
WHERE current_stock.id = subquery.id;

-- 3단계: stock_history 테이블의 date_index 값 생성 (UUID 대체용)
UPDATE stock_history
SET date_index = subquery.date_index
FROM (
  SELECT
    id,
    TO_CHAR(created_at, 'YYYYMMDD') || '_' ||
    LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 3, '0') as date_index
  FROM stock_history
) subquery
WHERE stock_history.id = subquery.id;

-- 4단계: 결과 확인
SELECT '=== 모든 테이블 date_index 생성 완료 ===' as info;

-- items 테이블 결과
SELECT
  'items' as table_name,
  COUNT(*) as total_count,
  COUNT(date_index) as date_index_count,
  MIN(date_index) as min_date_index,
  MAX(date_index) as max_date_index
FROM items
UNION ALL
SELECT
  'current_stock' as table_name,
  COUNT(*) as total_count,
  COUNT(date_index) as date_index_count,
  MIN(date_index) as min_date_index,
  MAX(date_index) as max_date_index
FROM current_stock
UNION ALL
SELECT
  'stock_history' as table_name,
  COUNT(*) as total_count,
  COUNT(date_index) as date_index_count,
  MIN(date_index) as min_date_index,
  MAX(date_index) as max_date_index
FROM stock_history;

-- 5단계: 각 테이블별 date_index 샘플 확인
SELECT '=== items 테이블 date_index 샘플 ===' as info;
SELECT
  date_index,
  id as uuid_id,
  product,
  spec,
  stock_status,
  created_at
FROM items
ORDER BY date_index
LIMIT 10;

SELECT '=== current_stock 테이블 date_index 샘플 ===' as info;
SELECT
  date_index,
  id as serial_id,
  name,
  specification,
  stock_status,
  current_quantity,
  created_at
FROM current_stock
ORDER BY date_index
LIMIT 10;

SELECT '=== stock_history 테이블 date_index 샘플 ===' as info;
SELECT
  date_index,
  id as uuid_id,
  event_type,
  quantity,
  condition_type,
  created_at
FROM stock_history
ORDER BY date_index
LIMIT 10;

-- 6단계: date_index 순서 확인
SELECT '=== date_index 순서 확인 ===' as info;
SELECT
  'items' as table_name,
  date_index,
  product,
  created_at
FROM items
ORDER BY date_index
LIMIT 5;

SELECT
  'current_stock' as table_name,
  date_index,
  name,
  created_at
FROM current_stock
ORDER BY date_index
LIMIT 5;

SELECT
  'stock_history' as table_name,
  date_index,
  event_type,
  quantity,
  created_at
FROM stock_history
ORDER BY date_index
LIMIT 5;

-- 7단계: 외래키 연결 상태 확인
SELECT '=== 외래키 연결 상태 확인 ===' as info;
SELECT
  'stock_history.item_id → items.id' as connection,
  COUNT(*) as connected_records
FROM stock_history sh
INNER JOIN items i ON sh.item_id = i.id
UNION ALL
SELECT
  'stock_history.item_id → current_stock.id (via items)' as connection,
  COUNT(*) as connected_records
FROM stock_history sh
INNER JOIN items i ON sh.item_id = i.id
INNER JOIN current_stock cs ON i.product = cs.name AND i.spec = cs.specification;
