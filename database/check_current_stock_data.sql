-- ========================================
-- current_stock 테이블 데이터 상태 확인
-- ========================================

-- 1단계: current_stock 테이블 구조 확인
SELECT '=== current_stock 테이블 구조 ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'current_stock'
ORDER BY ordinal_position;

-- 2단계: current_stock 테이블 데이터 확인
SELECT '=== current_stock 테이블 데이터 ===' as info;
SELECT 
  id,
  name,
  specification,
  maker,
  location,
  stock_status,
  current_quantity,
  unit_price,
  in_data,
  out_data,
  total_qunty
FROM current_stock
LIMIT 10;

-- 3단계: current_stock 테이블 데이터 개수
SELECT '=== current_stock 테이블 데이터 개수 ===' as info;
SELECT COUNT(*) as total_count FROM current_stock;

-- 4단계: items 테이블과 current_stock 테이블 비교
SELECT '=== items vs current_stock 비교 ===' as info;
SELECT 
  'items' as table_name,
  COUNT(*) as count
FROM items
UNION ALL
SELECT 
  'current_stock' as table_name,
  COUNT(*) as count
FROM current_stock;

-- 5단계: current_stock에 데이터가 없는 경우 샘플 데이터 생성
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM current_stock) = 0 THEN
    RAISE NOTICE 'current_stock 테이블이 비어있습니다. 샘플 데이터를 생성합니다.';
    
    -- items 테이블의 데이터를 current_stock으로 복사
    INSERT INTO current_stock (
      name, specification, maker, location, stock_status, 
      current_quantity, unit_price, in_data, out_data, total_qunty
    )
    SELECT 
      product as name,
      spec as specification,
      maker,
      COALESCE(location, '창고A') as location,
      stock_status,
      COALESCE(current_quantity, 0) as current_quantity,
      unit_price,
      0 as in_data,
      0 as out_data,
      COALESCE(current_quantity, 0) as total_qunty
    FROM items;
    
    RAISE NOTICE '샘플 데이터 생성 완료!';
  ELSE
    RAISE NOTICE 'current_stock 테이블에 데이터가 있습니다.';
  END IF;
END $$;
