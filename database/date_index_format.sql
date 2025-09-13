-- ========================================
-- 날짜_인덱스번호 형식 만들기
-- 형식: 20250831_001, 20250831_002...
-- ========================================

-- 1단계: items 테이블에 날짜_인덱스 컬럼 추가
ALTER TABLE items ADD COLUMN date_index VARCHAR(20);

-- 2단계: 날짜별로 순서대로 번호 매기기
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

-- 3단계: current_stock 테이블에 날짜_인덱스 컬럼 추가
ALTER TABLE current_stock ADD COLUMN date_index VARCHAR(20);

-- 4단계: 날짜별로 순서대로 번호 매기기
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

-- 5단계: 결과 확인
SELECT '=== 날짜_인덱스번호 생성 완료 ===' as info;

-- items 테이블 결과
SELECT 
  'items 테이블' as table_name,
  COUNT(*) as total_count,
  MIN(date_index) as min_date_index,
  MAX(date_index) as max_date_index
FROM items
UNION ALL
SELECT 
  'current_stock 테이블' as table_name,
  COUNT(*) as total_count,
  MIN(date_index) as min_date_index,
  MAX(date_index) as max_date_index
FROM current_stock;

-- 6단계: 날짜별 분포 확인
SELECT '=== items 테이블 날짜별 분포 ===' as info;
SELECT 
  DATE(created_at) as date,
  COUNT(*) as count,
  MIN(date_index) as first_index,
  MAX(date_index) as last_index
FROM items
GROUP BY DATE(created_at)
ORDER BY date;

-- 7단계: 샘플 데이터 확인
SELECT '=== items 테이블 샘플 ===' as info;
SELECT 
  date_index,
  product,
  spec,
  stock_status,
  created_at
FROM items
ORDER BY date_index
LIMIT 10;

SELECT '=== current_stock 테이블 샘플 ===' as info;
SELECT 
  date_index,
  name,
  specification,
  stock_status,
  created_at
FROM current_stock
ORDER BY date_index
LIMIT 10;
