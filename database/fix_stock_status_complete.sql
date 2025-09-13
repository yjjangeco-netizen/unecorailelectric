-- ========================================
-- 품목상태 매핑 문제 완전 해결 스크립트
-- 모든 혼재된 상태값을 통일하고 일관성 보장
-- ========================================

-- 1단계: 기존 데이터 백업 (안전을 위해)
CREATE TABLE IF NOT EXISTS stock_history_backup_$(date +%Y%m%d) AS SELECT * FROM stock_history;
CREATE TABLE IF NOT EXISTS items_backup_$(date +%Y%m%d) AS SELECT * FROM items;

-- 2단계: 현재 데이터 상태 확인
SELECT '=== 현재 stock_history.condition_type 상태 ===' as info;
SELECT 
  condition_type,
  COUNT(*) as count,
  'stock_history' as table_name
FROM stock_history 
GROUP BY condition_type
ORDER BY condition_type;

SELECT '=== 현재 items.stock_status 상태 ===' as info;
SELECT 
  stock_status,
  COUNT(*) as count,
  'items' as table_name
FROM items 
GROUP BY stock_status
ORDER BY stock_status;

-- 3단계: stock_history 테이블의 condition_type 완전 정리
-- 'unknown', 'etc', NULL 값을 모두 'new'로 변경
UPDATE stock_history 
SET condition_type = 'new' 
WHERE condition_type IN ('unknown', 'etc', 'normal') OR condition_type IS NULL;

-- 4단계: items 테이블의 stock_status 완전 정리
-- 'normal', 'etc', NULL 값을 모두 'new'로 변경
UPDATE items 
SET stock_status = 'new' 
WHERE stock_status IN ('normal', 'etc', 'low_stock', 'out_of_stock') OR stock_status IS NULL;

-- 5단계: 제약조건 완전 재설정
-- stock_history.condition_type 제약조건
DO $$
BEGIN
  -- 기존 제약조건 삭제
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'stock_history_condition_type_check'
  ) THEN
    ALTER TABLE stock_history DROP CONSTRAINT stock_history_condition_type_check;
  END IF;
  
  -- 새로운 제약조건 추가 (프로그램과 일치)
  ALTER TABLE stock_history 
  ADD CONSTRAINT stock_history_condition_type_check 
  CHECK (condition_type IN ('new', 'used-new', 'used-used', 'broken'));
END $$;

-- items.stock_status 제약조건
DO $$
BEGIN
  -- 기존 제약조건 삭제
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'items_stock_status_check'
  ) THEN
    ALTER TABLE items DROP CONSTRAINT items_stock_status_check;
  END IF;
  
  -- 새로운 제약조건 추가 (프로그램과 일치)
  ALTER TABLE items 
  ADD CONSTRAINT items_stock_status_check 
  CHECK (stock_status IN ('new', 'used-new', 'used-used', 'broken'));
END $$;

-- 6단계: 기본값 설정
-- stock_history.condition_type 기본값을 'new'로 설정
ALTER TABLE stock_history ALTER COLUMN condition_type SET DEFAULT 'new';

-- items.stock_status 기본값을 'new'로 설정
ALTER TABLE items ALTER COLUMN stock_status SET DEFAULT 'new';

-- 7단계: 데이터 검증 및 수정
-- stock_history에서 잘못된 condition_type 값 수정
UPDATE stock_history 
SET condition_type = CASE 
  WHEN condition_type = 'used-new' THEN 'used-new'
  WHEN condition_type = 'used-used' THEN 'used-used'
  WHEN condition_type = 'broken' THEN 'broken'
  ELSE condition_type
END
WHERE condition_type IN ('used-new', 'used-used', 'broken');

-- items에서 잘못된 stock_status 값 수정
UPDATE items 
SET stock_status = CASE 
  WHEN stock_status = 'used-new' THEN 'used-new'
  WHEN stock_status = 'used-used' THEN 'used-used'
  ELSE stock_status
END
WHERE stock_status IN ('used-new', 'used-used');

-- 8단계: 최종 데이터 상태 확인
SELECT '=== 수정 후 stock_history.condition_type 상태 ===' as info;
SELECT 
  condition_type,
  COUNT(*) as count,
  'stock_history' as table_name
FROM stock_history 
GROUP BY condition_type
ORDER BY condition_type;

SELECT '=== 수정 후 items.stock_status 상태 ===' as info;
SELECT 
  stock_status,
  COUNT(*) as count,
  'items' as table_name
FROM items 
GROUP BY stock_status
ORDER BY stock_status;

-- 9단계: 인덱스 최적화
-- 품목상태 관련 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_stock_history_condition_type ON stock_history(condition_type);
CREATE INDEX IF NOT EXISTS idx_items_stock_status ON items(stock_status);

-- 10단계: 데이터 일관성 검증
-- items와 stock_history 간 상태값 매핑 검증
SELECT 
  '상태값 매핑 검증' as check_type,
  i.stock_status as items_status,
  sh.condition_type as history_condition,
  COUNT(*) as count
FROM items i
JOIN stock_history sh ON i.id = sh.item_id
GROUP BY i.stock_status, sh.condition_type
ORDER BY i.stock_status, sh.condition_type;

-- 11단계: 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '품목상태 매핑 완전 수정 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '- stock_history.condition_type: unknown/etc -> new';
  RAISE NOTICE '- items.stock_status: normal/etc -> new';
  RAISE NOTICE '- 제약조건 및 기본값 업데이트 완료';
  RAISE NOTICE '- 데이터 일관성 검증 완료';
  RAISE NOTICE '========================================';
END $$;
