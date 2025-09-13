-- ========================================
-- 품목 상태 통일 표준 적용 스크립트
-- 프로그램과 데이터베이스 간 일관성 보장
-- ========================================

-- 1단계: 기존 데이터 백업
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

-- 3단계: stock_history.condition_type을 프로그램 표준으로 통일
-- PostgreSQL의 snake_case를 kebab-case로 변환
UPDATE stock_history 
SET condition_type = CASE 
  WHEN condition_type = 'used-new' THEN 'used-new'
  WHEN condition_type = 'used-used' THEN 'used-used'
  WHEN condition_type = 'unknown' THEN 'new'
  WHEN condition_type NOT IN ('new', 'used-new', 'used-used', 'broken') THEN 'new'
  ELSE condition_type
END;

-- 4단계: items.stock_status를 프로그램 표준으로 통일
UPDATE items 
SET stock_status = CASE 
  WHEN stock_status = 'used-new' THEN 'used-new'
  WHEN stock_status = 'used-used' THEN 'used-used'
  WHEN stock_status = 'unknown' THEN 'new'
  WHEN stock_status NOT IN ('new', 'used-new', 'used-used', 'broken') THEN 'new'
  ELSE stock_status
END;

-- 5단계: 제약조건 완전 재설정 (프로그램 표준)
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
ALTER TABLE stock_history ALTER COLUMN condition_type SET DEFAULT 'new';
ALTER TABLE items ALTER COLUMN stock_status SET DEFAULT 'new';

-- 7단계: 최종 데이터 검증
SELECT '=== 최종 stock_history.condition_type 상태 ===' as info;
SELECT 
  condition_type,
  COUNT(*) as count,
  'stock_history' as table_name
FROM stock_history 
GROUP BY condition_type
ORDER BY condition_type;

SELECT '=== 최종 items.stock_status 상태 ===' as info;
SELECT 
  stock_status,
  COUNT(*) as count,
  'items' as table_name
FROM items 
GROUP BY stock_status
ORDER BY stock_status;

-- 8단계: 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '품목 상태 통일 완료!';
  RAISE NOTICE '프로그램과 데이터베이스 간 일관성 보장됨';
  RAISE NOTICE '사용 가능한 상태값: new, used-new, used-used, broken';
END $$;
