-- ========================================
-- items와 current_stock 테이블의 stock_status 동기화
-- 입고시 중고신품이 신품으로 표시되는 문제 해결
-- ========================================

-- 1단계: 현재 데이터 상태 확인
SELECT '=== 현재 데이터 상태 확인 ===' as info;

-- items 테이블의 stock_status 분포
SELECT 'items.stock_status 분포' as table_info, stock_status, COUNT(*) as count
FROM items 
GROUP BY stock_status
ORDER BY count DESC;

-- current_stock 테이블의 stock_status 분포
SELECT 'current_stock.stock_status 분포' as table_info, stock_status, COUNT(*) as count
FROM current_stock 
GROUP BY stock_status
ORDER BY count DESC;

-- 2단계: items와 current_stock의 stock_status 불일치 확인
SELECT '=== stock_status 불일치 확인 ===' as info;
SELECT 
  i.id,
  i.product,
  i.spec,
  i.stock_status as items_stock_status,
  cs.stock_status as current_stock_stock_status,
  CASE 
    WHEN i.stock_status = cs.stock_status THEN '일치'
    ELSE '불일치'
  END as status_match
FROM items i
LEFT JOIN current_stock cs ON i.id = cs.item_id
WHERE i.stock_status != cs.stock_status OR cs.stock_status IS NULL
ORDER BY i.created_at DESC;

-- 3단계: current_stock 테이블의 stock_status를 items 테이블과 동기화
UPDATE current_stock 
SET stock_status = i.stock_status
FROM items i
WHERE current_stock.item_id = i.id 
  AND (current_stock.stock_status != i.stock_status OR current_stock.stock_status IS NULL);

-- 4단계: 동기화 결과 확인
SELECT '=== 동기화 결과 확인 ===' as info;

-- 동기화 후 불일치 확인
SELECT 
  '동기화 후 불일치' as info,
  COUNT(*) as mismatch_count
FROM items i
LEFT JOIN current_stock cs ON i.id = cs.item_id
WHERE i.stock_status != cs.stock_status OR cs.stock_status IS NULL;

-- 5단계: 최종 상태 확인
SELECT '=== 최종 상태 확인 ===' as info;

-- items 테이블 최종 상태
SELECT 'items 테이블' as table_name, stock_status, COUNT(*) as count
FROM items 
GROUP BY stock_status
ORDER BY count DESC;

-- current_stock 테이블 최종 상태
SELECT 'current_stock 테이블' as table_name, stock_status, COUNT(*) as count
FROM current_stock 
GROUP BY stock_status
ORDER BY count DESC;

-- 6단계: 샘플 데이터 확인
SELECT '=== 샘플 데이터 확인 ===' as info;
SELECT 
  i.id,
  i.product,
  i.spec,
  i.stock_status as items_status,
  cs.stock_status as current_stock_status,
  CASE 
    WHEN i.stock_status = 'new' THEN '신품'
    WHEN i.stock_status = 'used-new' THEN '중고신품'
    WHEN i.stock_status = 'used-used' THEN '중고사용품'
    WHEN i.stock_status = 'broken' THEN '불량품'
    ELSE '알 수 없음'
  END as display_text
FROM items i
LEFT JOIN current_stock cs ON i.id = cs.item_id
ORDER BY i.created_at DESC
LIMIT 10;
