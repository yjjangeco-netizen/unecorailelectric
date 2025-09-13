-- ========================================
-- 간단한 인덱스 번호 매기기
-- ========================================

-- 1단계: items 테이블에 임시 인덱스 컬럼 추가
ALTER TABLE items ADD COLUMN temp_index INTEGER;

-- 2단계: 순서대로 번호 매기기
UPDATE items 
SET temp_index = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM items
) subquery
WHERE items.id = subquery.id;

-- 3단계: current_stock 테이블에 임시 인덱스 컬럼 추가
ALTER TABLE current_stock ADD COLUMN temp_index INTEGER;

-- 4단계: 순서대로 번호 매기기
UPDATE current_stock 
SET temp_index = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM current_stock
) subquery
WHERE current_stock.id = subquery.id;

-- 5단계: 결과 확인
SELECT '=== 인덱스 번호 매기기 완료 ===' as info;

SELECT 
  'items 테이블' as table_name,
  COUNT(*) as total_count,
  MIN(temp_index) as min_index,
  MAX(temp_index) as max_index
FROM items
UNION ALL
SELECT 
  'current_stock 테이블' as table_name,
  COUNT(*) as total_count,
  MIN(temp_index) as min_index,
  MAX(temp_index) as max_index
FROM current_stock;

-- 6단계: 샘플 데이터 확인
SELECT '=== items 테이블 샘플 ===' as info;
SELECT 
  temp_index,
  product,
  spec,
  stock_status
FROM items
ORDER BY temp_index
LIMIT 5;

SELECT '=== current_stock 테이블 샘플 ===' as info;
SELECT 
  temp_index,
  name,
  specification,
  stock_status
FROM current_stock
ORDER BY temp_index
LIMIT 5;
