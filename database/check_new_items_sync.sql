-- ========================================
-- 새로 추가된 품목들의 current_stock 동기화 상태 확인
-- ========================================

-- 1단계: items 테이블의 최근 추가된 품목들 확인
SELECT '=== items 테이블 최근 추가된 품목들 ===' as info;
SELECT
  id,
  product,
  spec,
  maker,
  stock_status,
  created_at,
  updated_at
FROM items
ORDER BY created_at DESC
LIMIT 5;

-- 2단계: current_stock 테이블의 최근 추가된 품목들 확인
SELECT '=== current_stock 테이블 최근 추가된 품목들 ===' as info;
SELECT
  id,
  name,
  specification,
  maker,
  stock_status,
  created_at,
  updated_at
FROM current_stock
ORDER BY created_at DESC
LIMIT 5;

-- 3단계: items에 있지만 current_stock에 없는 품목들 확인
SELECT '=== items에만 있고 current_stock에 없는 품목들 ===' as info;
SELECT
  i.id,
  i.product as name,
  i.spec as specification,
  i.maker,
  i.stock_status,
  i.created_at
FROM items i
LEFT JOIN current_stock cs ON i.product = cs.name AND i.spec = cs.specification
WHERE cs.id IS NULL
ORDER BY i.created_at DESC;

-- 4단계: stock_status가 "used-new"인 품목들 확인
SELECT '=== stock_status가 "used-new"인 품목들 ===' as info;
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
WHERE stock_status = 'used-new';

-- 5단계: 전체 stock_status 분포 확인
SELECT '=== 전체 stock_status 분포 ===' as info;
SELECT
  'items' as table_name,
  stock_status,
  COUNT(*) as count
FROM items
GROUP BY stock_status
UNION ALL
SELECT
  'current_stock' as table_name,
  stock_status,
  COUNT(*) as count
FROM current_stock
GROUP BY stock_status
ORDER BY table_name, count DESC;
