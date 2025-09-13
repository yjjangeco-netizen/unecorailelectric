-- ========================================
-- 품목 상태 제약조건 설정 스크립트 (데이터베이스 기준)
-- PostgreSQL의 kebab-case 형태로 통일 (new, used-new, used-used, broken)
-- ========================================

-- 1단계: 현재 데이터 상태 확인
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

-- 2단계: 제약조건 설정 (데이터베이스 표준)
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
  
  -- 새로운 제약조건 추가 (데이터베이스와 일치)
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
  
  -- 새로운 제약조건 추가 (데이터베이스와 일치)
  ALTER TABLE items 
  ADD CONSTRAINT items_stock_status_check 
  CHECK (stock_status IN ('new', 'used-new', 'used-used', 'broken'));
END $$;

-- 3단계: 기본값 설정
ALTER TABLE stock_history ALTER COLUMN condition_type SET DEFAULT 'new';
ALTER TABLE items ALTER COLUMN stock_status SET DEFAULT 'new';

-- 4단계: 최종 데이터 검증
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

-- 5단계: 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '품목 상태 제약조건 설정 완료! (데이터베이스 기준)';
  RAISE NOTICE '프로그램과 데이터베이스 간 일관성 보장됨';
  RAISE NOTICE '사용 가능한 상태값: new, used-new, used-used, broken';
END $$;
