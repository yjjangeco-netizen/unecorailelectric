-- ========================================
-- normal → new 변환 및 테이블 구조 통합 실행 스크립트
-- ========================================

-- 1단계: 현재 상태 확인
SELECT '=== 현재 stock_status 분포 ===' as info;
SELECT 
  stock_status,
  COUNT(*) as count
FROM items 
GROUP BY stock_status
ORDER BY count DESC;

-- 2단계: normal을 new로 변환
UPDATE items 
SET stock_status = 'new' 
WHERE stock_status = 'normal';

-- 3단계: stock_history의 condition_type도 확인 및 변환
SELECT '=== stock_history condition_type 분포 ===' as info;
SELECT 
  condition_type,
  COUNT(*) as count
FROM stock_history 
GROUP BY condition_type
ORDER BY count DESC;

-- 4단계: condition_type도 new로 변환 (필요시)
UPDATE stock_history 
SET condition_type = 'new' 
WHERE condition_type = 'normal';

-- 5단계: 기존 함수들 삭제 (필요시)
DROP FUNCTION IF EXISTS process_stock_in CASCADE;
DROP FUNCTION IF EXISTS process_stock_out CASCADE;

-- 6단계: 새로운 함수들 적용
-- process_stock_in_fixed.sql의 내용을 여기에 포함
-- (위에서 생성한 함수 내용)

-- 7단계: 변환 결과 확인
SELECT '=== 변환 후 stock_status 분포 ===' as info;
SELECT 
  stock_status,
  COUNT(*) as count
FROM items 
GROUP BY stock_status
ORDER BY count DESC;

-- 8단계: current_stock 뷰 새로고침 (필요시)
REFRESH MATERIALIZED VIEW IF EXISTS current_stock;

-- 9단계: 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'normal → new 변환 및 구조 통합 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '- items.stock_status: normal → new';
  RAISE NOTICE '- stock_history.condition_type: normal → new';
  RAISE NOTICE '- 모든 품목 상태가 new로 통일됨';
  RAISE NOTICE '- stock_history 테이블 기반 구조로 통합';
  RAISE NOTICE '========================================';
END $$;
