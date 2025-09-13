-- ========================================
-- 모든 테이블에서 중복 항목 제거
-- ========================================

-- 1단계: items 테이블에서 중복 제거 (product, spec 기준)
-- 중복된 항목 중 가장 최근에 생성된 것만 유지
DELETE FROM items
WHERE id NOT IN (
  SELECT id
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY product, spec ORDER BY created_at DESC) as rn
    FROM items
  ) ranked
  WHERE rn = 1
);

-- 2단계: current_stock 테이블에서 중복 제거 (name, specification 기준)
-- 중복된 항목 중 가장 최근에 업데이트된 것만 유지
DELETE FROM current_stock
WHERE id NOT IN (
  SELECT id
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY name, specification ORDER BY updated_at DESC, created_at DESC) as rn
    FROM current_stock
  ) ranked
  WHERE rn = 1
);

-- 3단계: stock_history 테이블에서 중복 제거 (item_id, event_type, quantity, event_date 기준)
-- 같은 품목, 같은 이벤트, 같은 수량, 같은 날짜의 중복 기록 제거
DELETE FROM stock_history
WHERE id NOT IN (
  SELECT id
  FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY item_id, event_type, quantity, DATE(event_date) 
      ORDER BY created_at DESC
    ) as rn
    FROM stock_history
  ) ranked
  WHERE rn = 1
);

-- 4단계: NULL 또는 빈 문자열인 필수 데이터 제거
-- items 테이블에서 product가 NULL이거나 빈 문자열인 항목 제거
DELETE FROM items
WHERE product IS NULL OR TRIM(product) = '';

-- current_stock 테이블에서 name이 NULL이거나 빈 문자열인 항목 제거
DELETE FROM current_stock
WHERE name IS NULL OR TRIM(name) = '';

-- stock_history 테이블에서 item_id가 NULL인 항목 제거
DELETE FROM stock_history
WHERE item_id IS NULL;

-- 5단계: 중복 제거 결과 확인
SELECT '=== 중복 제거 완료 ===' as info;

-- items 테이블 정리 결과
SELECT
  'items 테이블' as table_name,
  COUNT(*) as total_count,
  COUNT(DISTINCT product) as unique_products,
  COUNT(DISTINCT (product, spec)) as unique_product_specs
FROM items;

-- current_stock 테이블 정리 결과
SELECT
  'current_stock 테이블' as table_name,
  COUNT(*) as total_count,
  COUNT(DISTINCT name) as unique_names,
  COUNT(DISTINCT (name, specification)) as unique_name_specs
FROM current_stock;

-- stock_history 테이블 정리 결과
SELECT
  'stock_history 테이블' as table_name,
  COUNT(*) as total_count,
  COUNT(DISTINCT item_id) as unique_items,
  COUNT(DISTINCT (item_id, event_type, quantity, DATE(event_date))) as unique_events
FROM stock_history;

-- 6단계: 최종 데이터 상태 확인
SELECT '=== 최종 데이터 상태 ===' as info;
SELECT
  'items' as table_name,
  COUNT(*) as count
FROM items
UNION ALL
SELECT
  'current_stock' as table_name,
  COUNT(*) as count
FROM current_stock
UNION ALL
SELECT
  'stock_history' as table_name,
  COUNT(*) as count
FROM stock_history;

-- 7단계: 각 테이블의 샘플 데이터 확인
SELECT '=== items 테이블 샘플 ===' as info;
SELECT
  id,
  product,
  spec,
  maker,
  stock_status,
  created_at
FROM items
ORDER BY created_at DESC
LIMIT 5;

SELECT '=== current_stock 테이블 샘플 ===' as info;
SELECT
  id,
  name,
  specification,
  maker,
  stock_status,
  current_quantity,
  created_at
FROM current_stock
ORDER BY created_at DESC
LIMIT 5;

SELECT '=== stock_history 테이블 샘플 ===' as info;
SELECT
  id,
  item_id,
  event_type,
  quantity,
  event_date,
  created_at
FROM stock_history
ORDER BY created_at DESC
LIMIT 5;

-- 8단계: 외래키 무결성 확인 (타입 안전하게)
SELECT '=== 외래키 무결성 확인 ===' as info;

-- stock_history.item_id가 items.id에 없는 경우
SELECT
  'stock_history.item_id가 items.id에 없는 경우' as check_type,
  COUNT(*) as count
FROM stock_history sh
WHERE NOT EXISTS (
  SELECT 1 FROM items i WHERE i.id::text = sh.item_id::text
);

-- stock_history.item_id가 current_stock.id에 없는 경우  
SELECT
  'stock_history.item_id가 current_stock.id에 없는 경우' as check_type,
  COUNT(*) as count
FROM stock_history sh
WHERE NOT EXISTS (
  SELECT 1 FROM current_stock cs WHERE cs.id::text = sh.item_id::text
);

-- 9단계: 중복 제거 후 date_index 재생성 (필요시)
-- items 테이블의 date_index 재생성
UPDATE items
SET date_index = subquery.date_index
FROM (
  SELECT
    id,
    TO_CHAR(created_at, 'YYYYMMDD') || '_' ||
    LPAD(ROW_NUMBER() OVER (PARTITION BY DATE(created_at) ORDER BY created_at)::TEXT, 3, '0') as date_index
  FROM items
) subquery
WHERE items.id = subquery.id;

-- current_stock 테이블의 date_index 재생성
UPDATE current_stock
SET date_index = subquery.date_index
FROM (
  SELECT
    id,
    TO_CHAR(created_at, 'YYYYMMDD') || '_' ||
    LPAD(ROW_NUMBER() OVER (PARTITION BY DATE(created_at) ORDER BY created_at)::TEXT, 3, '0') as date_index
  FROM current_stock
) subquery
WHERE current_stock.id = subquery.id;

-- stock_history 테이블의 date_index 재생성
UPDATE stock_history
SET date_index = subquery.date_index
FROM (
  SELECT
    id,
    TO_CHAR(created_at, 'YYYYMMDD') || '_' ||
    LPAD(ROW_NUMBER() OVER (PARTITION BY DATE(created_at) ORDER BY created_at)::TEXT, 3, '0') as date_index
  FROM stock_history
) subquery
WHERE stock_history.id = subquery.id;

-- 10단계: 최종 date_index 확인
SELECT '=== 최종 date_index 상태 ===' as info;
SELECT
  'items' as table_name,
  MIN(date_index) as min_date_index,
  MAX(date_index) as max_date_index
FROM items
UNION ALL
SELECT
  'current_stock' as table_name,
  MIN(date_index) as min_date_index,
  MAX(date_index) as max_date_index
FROM current_stock
UNION ALL
SELECT
  'stock_history' as table_name,
  MIN(date_index) as min_date_index,
  MAX(date_index) as max_date_index
FROM stock_history;
