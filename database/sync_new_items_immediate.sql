-- ========================================
-- items에 새로 추가된 품목들을 current_stock에 즉시 동기화
-- ========================================

-- 1단계: items에 있지만 current_stock에 없는 품목들을 current_stock에 추가
INSERT INTO current_stock (
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
)
SELECT
  i.product as name,
  i.spec as specification,
  i.maker,
  COALESCE(i.location, '창고A') as location,
  i.stock_status,
  0 as current_quantity,
  i.unit_price,
  0 as in_data,
  0 as out_data,
  0 as total_qunty
FROM items i
LEFT JOIN current_stock cs ON i.product = cs.name AND i.spec = cs.specification
WHERE cs.id IS NULL;

-- 2단계: 동기화 결과 확인
SELECT '=== 동기화 완료 ===' as info;

-- items 테이블 개수
SELECT 
  'items' as table_name,
  COUNT(*) as count
FROM items
UNION ALL
SELECT 
  'current_stock' as table_name,
  COUNT(*) as count
FROM current_stock;

-- 3단계: 새로 동기화된 품목들 확인
SELECT '=== 새로 동기화된 품목들 ===' as info;
SELECT
  cs.id,
  cs.name,
  cs.specification,
  cs.maker,
  cs.stock_status,
  cs.created_at
FROM current_stock cs
INNER JOIN items i ON cs.name = i.product AND cs.specification = i.spec
WHERE cs.created_at >= NOW() - INTERVAL '1 hour'
ORDER BY cs.created_at DESC;

-- 4단계: stock_status가 "used-new"인 품목들 재확인
SELECT '=== "used-new" 상태인 품목들 ===' as info;
SELECT
  'items' as table_name,
  id,
  product as name,
  spec as specification,
  stock_status,
  created_at
FROM items
WHERE stock_status = 'used-new'
UNION ALL
SELECT
  'current_stock' as table_name,
  id,
  name,
  specification,
  stock_status,
  created_at
FROM current_stock
WHERE stock_status = 'used-new'
ORDER BY table_name, created_at DESC;
