-- ========================================
-- 기존 잘못된 stock_status 수정 스크립트
-- "normal" 값을 올바른 값으로 변경
-- ========================================

-- 1단계: 현재 상태 확인
SELECT '=== 현재 상태 확인 ===' as info;

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

-- stock_history 테이블의 condition_type 분포
SELECT 'stock_history.condition_type 분포' as table_info, condition_type, COUNT(*) as count
FROM stock_history 
GROUP BY condition_type
ORDER BY count DESC;

-- 2단계: stock_history의 condition_type을 기준으로 items 테이블 수정
UPDATE items 
SET stock_status = (
  SELECT sh.condition_type 
  FROM stock_history sh 
  WHERE sh.item_id = items.id 
    AND sh.event_type = 'IN'
  ORDER BY sh.created_at DESC 
  LIMIT 1
)
WHERE stock_status = 'normal' 
  AND EXISTS (
    SELECT 1 FROM stock_history sh 
    WHERE sh.item_id = items.id 
      AND sh.event_type = 'IN'
      AND sh.condition_type IN ('new', 'used-new', 'used-used', 'broken')
  );

-- 3단계: current_stock 테이블도 동일하게 수정
UPDATE current_stock 
SET stock_status = (
  SELECT sh.condition_type 
  FROM stock_history sh 
  WHERE sh.item_id = current_stock.item_id 
    AND sh.event_type = 'IN'
  ORDER BY sh.created_at DESC 
  LIMIT 1
)
WHERE stock_status = 'normal' 
  AND EXISTS (
    SELECT 1 FROM stock_history sh 
    WHERE sh.item_id = current_stock.item_id 
      AND sh.event_type = 'IN'
      AND sh.condition_type IN ('new', 'used-new', 'used-used', 'broken')
  );

-- 4단계: 수정 결과 확인
SELECT '=== 수정 결과 확인 ===' as info;

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

-- 5단계: 샘플 데이터 확인
SELECT '=== 샘플 데이터 확인 ===' as info;
SELECT 
  i.id,
  i.product,
  i.spec,
  i.stock_status as items_status,
  cs.stock_status as current_stock_status,
  sh.condition_type as history_condition,
  CASE 
    WHEN i.stock_status = 'new' THEN '신품'
    WHEN i.stock_status = 'used-new' THEN '중고신품'
    WHEN i.stock_status = 'used-used' THEN '중고사용품'
    WHEN i.stock_status = 'broken' THEN '불량품'
    ELSE '알 수 없음'
  END as display_text
FROM items i
LEFT JOIN current_stock cs ON i.id = cs.item_id
LEFT JOIN stock_history sh ON i.id = sh.item_id AND sh.event_type = 'IN'
ORDER BY i.created_at DESC
LIMIT 10;
