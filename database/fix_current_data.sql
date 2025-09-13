-- ========================================
-- 현재 데이터를 새로운 표준으로 변환하는 스크립트
-- ========================================

-- 1단계: 현재 상태 확인
SELECT '=== 현재 items.stock_status 분포 ===' as info;
SELECT 
  stock_status,
  COUNT(*) as count
FROM items 
GROUP BY stock_status
ORDER BY count DESC;

SELECT '=== 현재 stock_history.condition_type 분포 ===' as info;
SELECT 
  condition_type,
  COUNT(*) as count
FROM stock_history 
GROUP BY condition_type
ORDER BY count DESC;

-- 2단계: items.stock_status 변환
UPDATE items 
SET stock_status = CASE 
  WHEN stock_status = 'normal' THEN 'new'
  WHEN stock_status = 'used' THEN 'used-used'
  WHEN stock_status = 'defective' THEN 'broken'
  WHEN stock_status = 'good' THEN 'used-new'
  WHEN stock_status = 'almostnew' THEN 'used-new'
  WHEN stock_status = 'out_of_stock' THEN 'new'
  WHEN stock_status = 'low_stock' THEN 'new'
  WHEN stock_status = 'unknown' THEN 'new'
  WHEN stock_status IS NULL THEN 'new'
  WHEN stock_status NOT IN ('new', 'used-new', 'used-used', 'broken') THEN 'new'
  ELSE stock_status
END;

-- 3단계: stock_history.condition_type 변환
UPDATE stock_history 
SET condition_type = CASE 
  WHEN condition_type = 'normal' THEN 'new'
  WHEN condition_type = 'used' THEN 'used-used'
  WHEN condition_type = 'defective' THEN 'broken'
  WHEN condition_type = 'good' THEN 'used-new'
  WHEN condition_type = 'almostnew' THEN 'used-new'
  WHEN condition_type = 'out_of_stock' THEN 'new'
  WHEN condition_type = 'low_stock' THEN 'new'
  WHEN condition_type = 'unknown' THEN 'new'
  WHEN condition_type IS NULL THEN 'new'
  WHEN condition_type NOT IN ('new', 'used-new', 'used-used', 'broken') THEN 'new'
  ELSE condition_type
END;

-- 4단계: 변환 후 상태 확인
SELECT '=== 변환 후 items.stock_status 분포 ===' as info;
SELECT 
  stock_status,
  COUNT(*) as count
FROM items 
GROUP BY stock_status
ORDER BY count DESC;

SELECT '=== 변환 후 stock_history.condition_type 분포 ===' as info;
SELECT 
  condition_type,
  COUNT(*) as count
FROM stock_history 
GROUP BY condition_type
ORDER BY count DESC;

-- 5단계: 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '데이터 변환 완료!';
  RAISE NOTICE '이제 모든 품목 상태가 new, used-new, used-used, broken 중 하나로 표시됩니다.';
END $$;
