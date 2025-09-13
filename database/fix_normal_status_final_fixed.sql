-- ========================================
-- "normal" 상태 최종 수정 스크립트 (수정됨)
-- ========================================

-- 1단계: 현재 "normal" 상태인 품목 확인
SELECT '=== "normal" 상태인 품목들 ===' as info;
SELECT 
  id,
  product,
  spec,
  stock_status
FROM items 
WHERE stock_status = 'normal';

-- 2단계: "normal" 상태를 "new"로 변경
UPDATE items 
SET stock_status = 'new'
WHERE stock_status = 'normal';

-- 3단계: 변경 결과 확인
SELECT '=== 수정 후 상태 확인 ===' as info;
SELECT 
  id,
  product,
  spec,
  stock_status
FROM items 
WHERE stock_status IN ('new', 'used-new', 'used-used', 'broken')
ORDER BY stock_status;

-- 4단계: stock_history의 condition_type도 확인 및 수정
SELECT '=== stock_history condition_type 확인 ===' as info;
SELECT DISTINCT condition_type 
FROM stock_history 
ORDER BY condition_type;

-- 5단계: stock_history의 "normal" 상태도 "new"로 변경
UPDATE stock_history 
SET condition_type = 'new'
WHERE condition_type = 'normal';

-- 6단계: 최종 상태 통계
SELECT '=== 최종 상태 통계 ===' as info;
SELECT 
  'items.stock_status' as table_column,
  stock_status,
  COUNT(*) as count
FROM items 
GROUP BY stock_status
UNION ALL
SELECT 
  'stock_history.condition_type' as table_column,
  condition_type,
  COUNT(*) as count
FROM stock_history 
GROUP BY condition_type
ORDER BY table_column, stock_status;

-- 7단계: current_stock 뷰 새로고침 (수정됨)
SELECT '=== current_stock 뷰 새로고침 ===' as info;
-- 뷰는 자동으로 새로고침되므로 별도 작업 불필요
-- 필요시 뷰를 재생성할 수 있음

-- 8단계: 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '"normal" 상태 최종 수정 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '- 모든 "normal" 상태를 "new"로 변경';
  RAISE NOTICE '- items와 stock_history 테이블 동기화';
  RAISE NOTICE '- current_stock 뷰는 자동 새로고침';
  RAISE NOTICE '========================================';
END $$;
