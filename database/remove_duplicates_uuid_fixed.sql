-- ========================================
-- items와 current_stock 테이블 중복 항목 제거 (UUID 타입 지원)
-- ========================================

-- 1단계: items 테이블에서 중복 제거 (product, spec 기준) - UUID 타입 수정
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

-- 2단계: current_stock 테이블에서 중복 제거 (name, specification 기준) - UUID 타입 수정
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

-- 3단계: items 테이블에서 product가 NULL이거나 빈 문자열인 항목 제거
DELETE FROM items 
WHERE product IS NULL OR TRIM(product) = '';

-- 4단계: current_stock 테이블에서 name이 NULL이거나 빈 문자열인 항목 제거
DELETE FROM current_stock 
WHERE name IS NULL OR TRIM(name) = '';

-- 5단계: items 테이블의 stock_status가 "normal"인 경우 "new"로 수정
UPDATE items 
SET stock_status = 'new'
WHERE stock_status = 'normal';

-- 6단계: current_stock 테이블에 누락된 데이터 추가 (items에 있지만 current_stock에 없는 것)
INSERT INTO current_stock (
  name, specification, maker, location, stock_status, 
  current_quantity, unit_price, in_data, out_data, total_qunty
)
SELECT 
  product as name,
  spec as specification,
  maker,
  '창고A' as location,
  stock_status,
  COALESCE(current_quantity, 0) as current_quantity,
  unit_price,
  0 as in_data,
  0 as out_data,
  COALESCE(current_quantity, 0) as total_qunty
FROM items
WHERE product NOT IN (
  SELECT name FROM current_stock
);

-- 7단계: current_stock 테이블의 current_quantity를 total_qunty와 동기화
UPDATE current_stock 
SET current_quantity = total_qunty
WHERE current_quantity = 0;

-- 8단계: 중복 제거 결과 확인
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

-- 9단계: 최종 데이터 상태 확인
SELECT '=== 최종 데이터 상태 ===' as info;
SELECT 
  'items' as table_name,
  COUNT(*) as count
FROM items
UNION ALL
SELECT 
  'current_stock' as table_name,
  COUNT(*) as count
FROM current_stock;

-- 10단계: items 테이블의 stock_status 분포 확인
SELECT '=== items.stock_status 분포 ===' as info;
SELECT 
  stock_status,
  COUNT(*) as count
FROM items 
GROUP BY stock_status
ORDER BY count DESC;

-- 11단계: 샘플 데이터 확인
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
