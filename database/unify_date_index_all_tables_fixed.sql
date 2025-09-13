-- ========================================
-- 올바른 테이블 구조에 맞춰 date_index 통일
-- 형식: 20250831_001, 20250831_002...
-- ========================================

-- 1단계: items 테이블에 date_index 컬럼 추가 (이미 있다면 건너뜀)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'items' AND column_name = 'date_index') THEN
        ALTER TABLE items ADD COLUMN date_index VARCHAR(20);
    END IF;
END $$;

-- 2단계: current_stock 테이블에 date_index 컬럼 추가 (이미 있다면 건너뜀)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'current_stock' AND column_name = 'date_index') THEN
        ALTER TABLE current_stock ADD COLUMN date_index VARCHAR(20);
    END IF;
END $$;

-- 3단계: stock_history 테이블에 date_index 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stock_history' AND column_name = 'date_index') THEN
        ALTER TABLE stock_history ADD COLUMN date_index VARCHAR(20);
    END IF;
END $$;

-- 4단계: items 테이블의 date_index 업데이트
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

-- 5단계: current_stock 테이블의 date_index 업데이트
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

-- 6단계: stock_history 테이블의 date_index 업데이트
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

-- 7단계: current_stock 테이블을 items 테이블과 동기화
-- items에 있지만 current_stock에 없는 품목들을 current_stock에 추가
INSERT INTO current_stock (
  name, specification, maker, location, stock_status,
  current_quantity, unit_price, in_data, out_data, total_qunty
)
SELECT
  i.product as name,
  i.spec as specification,
  i.maker,
  '창고A' as location,
  i.stock_status,
  COALESCE(i.current_quantity, 0) as current_quantity,
  i.unit_price,
  0 as in_data,
  0 as out_data,
  COALESCE(i.current_quantity, 0) as total_qunty
FROM items i
LEFT JOIN current_stock cs ON i.product = cs.name AND i.spec = cs.specification
WHERE cs.id IS NULL;

-- 8단계: 결과 확인
SELECT '=== date_index 통일 완료 ===' as info;

-- items 테이블 결과
SELECT
  'items' as table_name,
  COUNT(*) as total_count,
  MIN(date_index) as min_date_index,
  MAX(date_index) as max_date_index
FROM items
UNION ALL
SELECT
  'current_stock' as table_name,
  COUNT(*) as total_count,
  MIN(date_index) as min_date_index,
  MAX(date_index) as max_date_index
FROM current_stock
UNION ALL
SELECT
  'stock_history' as table_name,
  COUNT(*) as total_count,
  MIN(date_index) as min_date_index,
  MAX(date_index) as max_date_index
FROM stock_history;

-- 9단계: 각 테이블별 date_index 샘플 확인
SELECT '=== items 테이블 date_index 샘플 ===' as info;
SELECT
  date_index,
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
  event_type,
  quantity,
  condition_type,
  created_at
FROM stock_history
ORDER BY date_index
LIMIT 10;
