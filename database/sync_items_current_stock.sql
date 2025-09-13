-- ========================================
-- items와 current_stock 테이블 동기화
-- ========================================

-- 1단계: current_stock 테이블에 누락된 데이터 추가
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

-- 2단계: items 테이블의 stock_status가 "normal"인 경우 "new"로 수정
UPDATE items 
SET stock_status = 'new'
WHERE stock_status = 'normal';

-- 3단계: current_stock 테이블의 current_quantity를 total_qunty와 동기화
UPDATE current_stock 
SET current_quantity = total_qunty
WHERE current_quantity = 0;

-- 4단계: 동기화 결과 확인
SELECT '=== 동기화 완료 ===' as info;

SELECT 'items 테이블' as table_name, COUNT(*) as count FROM items
UNION ALL
SELECT 'current_stock 테이블' as table_name, COUNT(*) as count FROM current_stock;

-- 5단계: items 테이블의 stock_status 분포 확인
SELECT 
  'items.stock_status 분포' as info,
  stock_status,
  COUNT(*) as count
FROM items 
GROUP BY stock_status
ORDER BY count DESC;
