-- ========================================
-- items 테이블의 "normal" 상태를 "new"로 수정
-- ========================================

-- 1단계: 현재 상태 확인
SELECT '=== 현재 items.stock_status 분포 ===' as info;
SELECT 
  stock_status,
  COUNT(*) as count
FROM items 
GROUP BY stock_status
ORDER BY count DESC;

-- 2단계: "normal" 상태를 "new"로 수정
UPDATE items 
SET stock_status = 'new'
WHERE stock_status = 'normal';

-- 3단계: 수정 후 상태 확인
SELECT '=== 수정 후 items.stock_status 분포 ===' as info;
SELECT 
  stock_status,
  COUNT(*) as count
FROM items 
GROUP BY stock_status
ORDER BY count DESC;

-- 4단계: 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'items 테이블 상태 수정 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '- "normal" → "new" 변환 완료';
  RAISE NOTICE '- 이제 "알 수 없음" 대신 "신품" 표시';
  RAISE NOTICE '========================================';
END $$;
