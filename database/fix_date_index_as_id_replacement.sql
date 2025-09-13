-- ========================================
-- date_index를 UUID ID 대체용으로 수정
-- 형식: 20250831_001, 20250831_002... (UUID 대신 읽기 쉬운 번호)
-- ========================================

-- 1단계: 기존 date_index 컬럼 삭제 (잘못 생성된 것들)
ALTER TABLE items DROP COLUMN IF EXISTS date_index;
ALTER TABLE current_stock DROP COLUMN IF EXISTS date_index;
ALTER TABLE stock_history DROP COLUMN IF EXISTS date_index;

-- 2단계: 새로운 date_index 컬럼 추가
ALTER TABLE items ADD COLUMN date_index VARCHAR(20);
ALTER TABLE current_stock ADD COLUMN date_index VARCHAR(20);
ALTER TABLE stock_history ADD COLUMN date_index VARCHAR(20);

-- 3단계: items 테이블의 date_index 생성 (UUID 대체용)
-- 전체 테이블을 created_at 순서대로 정렬하여 순차 번호 부여
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

-- 4단계: current_stock 테이블의 date_index 생성 (UUID 대체용)
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

-- 5단계: stock_history 테이블의 date_index 생성 (UUID 대체용)
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

-- 6단계: 결과 확인
SELECT '=== date_index ID 대체용 생성 완료 ===' as info;

-- items 테이블 결과
SELECT
  'items' as table_name,
  COUNT(*) as total_count,
  MIN(date_index) as min_date_index,
  MAX(date_index) as min_date_index
FROM items
UNION ALL
SELECT
  'current_stock' as table_name,
  COUNT(*) as total_count,
  MIN(date_index) as min_date_index,
  MAX(date_index) as min_date_index
FROM current_stock
UNION ALL
SELECT
  'stock_history' as table_name,
  COUNT(*) as total_count,
  MIN(date_index) as min_date_index,
  MAX(date_index) as min_date_index
FROM stock_history;

-- 7단계: 각 테이블별 date_index 샘플 확인
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
  id as int_id,
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

-- 8단계: date_index 순서 확인
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
