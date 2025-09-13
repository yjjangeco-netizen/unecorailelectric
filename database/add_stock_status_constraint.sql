-- ========================================
-- stock_status 컬럼에 4가지 값만 허용하는 제약 조건 추가
-- ========================================

-- 1단계: 기존 제약 조건 확인
SELECT '=== 기존 제약 조건 확인 ===' as info;
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'items'::regclass 
AND contype = 'c';

-- 2단계: 기존 stock_status 제약 조건 제거 (있다면)
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_stock_status_check;

-- 3단계: 새로운 stock_status 제약 조건 추가
ALTER TABLE items ADD CONSTRAINT items_stock_status_check 
CHECK (stock_status IN ('new', 'used-new', 'used-used', 'broken'));

-- 4단계: stock_history 테이블의 condition_type에도 동일한 제약 조건 추가
ALTER TABLE stock_history DROP CONSTRAINT IF EXISTS stock_history_condition_type_check;
ALTER TABLE stock_history ADD CONSTRAINT stock_history_condition_type_check 
CHECK (condition_type IN ('new', 'used-new', 'used-used', 'broken'));

-- 5단계: 제약 조건 확인
SELECT '=== 추가된 제약 조건 확인 ===' as info;
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid IN ('items'::regclass, 'stock_history'::regclass)
AND contype = 'c'
AND conname LIKE '%stock_status%' OR conname LIKE '%condition_type%';

-- 6단계: 테스트 - 잘못된 값 입력 시도 (에러 발생해야 함)
-- INSERT INTO items (product, spec, stock_status) VALUES ('테스트', '테스트', 'invalid_status');

-- 7단계: 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'stock_status 제약 조건 추가 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '- items.stock_status: 4가지 값만 허용';
  RAISE NOTICE '- stock_history.condition_type: 4가지 값만 허용';
  RAISE NOTICE '- 허용 값: new, used-new, used-used, broken';
  RAISE NOTICE '- 잘못된 값 입력 시 에러 발생';
  RAISE NOTICE '========================================';
END $$;
