-- ========================================
-- current_stock 테이블의 date_index를 SERIAL ID 대체용으로 수정
-- 형식: 20250831_001, 20250831_002... (SERIAL ID 대신 읽기 쉬운 번호)
-- ========================================

-- 1단계: current_stock 테이블의 date_index 값 생성
-- SERIAL ID를 대체하는 순차 번호 생성
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

-- 2단계: 결과 확인
SELECT '=== current_stock date_index 생성 완료 ===' as info;

-- date_index 분포 확인
SELECT
  COUNT(*) as total_count,
  MIN(date_index) as min_date_index,
  MAX(date_index) as max_date_index
FROM current_stock;

-- 3단계: date_index 샘플 확인
SELECT '=== current_stock date_index 샘플 ===' as info;
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

-- 4단계: date_index 순서 확인
SELECT '=== date_index 순서 확인 ===' as info;
SELECT
  date_index,
  name,
  specification,
  created_at
FROM current_stock
ORDER BY date_index
LIMIT 5;

-- 5단계: items 테이블과의 연결 확인
SELECT '=== items와 current_stock 연결 상태 ===' as info;
SELECT
  'items 총 레코드' as info,
  COUNT(*) as count
FROM items
UNION ALL
SELECT
  'current_stock 총 레코드' as info,
  COUNT(*) as count
FROM current_stock
UNION ALL
SELECT
  '연결된 레코드' as info,
  COUNT(*) as count
FROM items i
INNER JOIN current_stock cs ON i.product = cs.name AND i.spec = cs.specification;

-- 6단계: 연결되지 않은 current_stock 레코드 확인
SELECT '=== 연결되지 않은 current_stock 레코드 ===' as info;
SELECT
  cs.date_index,
  cs.name,
  cs.specification,
  cs.created_at
FROM current_stock cs
LEFT JOIN items i ON cs.name = i.product AND cs.spec = i.spec
WHERE i.id IS NULL
ORDER BY cs.created_at;
