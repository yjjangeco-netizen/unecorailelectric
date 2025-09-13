-- ========================================
-- 중복 항목 제거 및 정리
-- ========================================

-- 1단계: items 테이블에서 중복 제거 (product, spec 기준)
-- 중복된 항목 중 가장 최근에 생성된 것만 유지
DELETE FROM items 
WHERE id NOT IN (
  SELECT MAX(id)
  FROM items
  GROUP BY product, spec
);

-- 2단계: current_stock 테이블에서 중복 제거 (name, specification 기준)
-- 중복된 항목 중 가장 최근에 업데이트된 것만 유지
DELETE FROM current_stock 
WHERE id NOT IN (
  SELECT MAX(id)
  FROM current_stock
  GROUP BY name, specification
);

-- 3단계: items 테이블에서 product가 NULL이거나 빈 문자열인 항목 제거
DELETE FROM items 
WHERE product IS NULL OR TRIM(product) = '';

-- 4단계: current_stock 테이블에서 name이 NULL이거나 빈 문자열인 항목 제거
DELETE FROM current_stock 
WHERE name IS NULL OR TRIM(name) = '';

-- 5단계: 정리 결과 확인
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

-- 6단계: 중복 제거 후 데이터 상태 확인
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
