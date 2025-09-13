-- ========================================
-- 모든 제약 조건 및 제한사항 적용 통합 스크립트
-- ========================================

-- 1단계: 백업 생성 (권장)
-- CREATE TABLE items_backup AS SELECT * FROM items;
-- CREATE TABLE stock_history_backup AS SELECT * FROM stock_history;

-- 2단계: 기존 함수들 삭제
DROP FUNCTION IF EXISTS process_stock_in CASCADE;
DROP FUNCTION IF EXISTS process_stock_out CASCADE;

-- 3단계: normal → new 변환
UPDATE items SET stock_status = 'new' WHERE stock_status = 'normal';
UPDATE stock_history SET condition_type = 'new' WHERE condition_type = 'normal';

-- 4단계: 기존 제약 조건 제거
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_stock_status_check;
ALTER TABLE stock_history DROP CONSTRAINT IF EXISTS stock_history_condition_type_check;

-- 5단계: 새로운 제약 조건 추가
ALTER TABLE items ADD CONSTRAINT items_stock_status_check 
CHECK (stock_status IN ('new', 'used-new', 'used-used', 'broken'));

ALTER TABLE stock_history ADD CONSTRAINT stock_history_condition_type_check 
CHECK (condition_type IN ('new', 'used-new', 'used-used', 'broken'));

-- 6단계: 새로운 함수들 적용 (파일에서 실행)
-- \i database/functions/process_stock_in_fixed.sql
-- \i database/functions/process_stock_out_fixed.sql

-- 7단계: 결과 확인
SELECT '=== 변환 후 stock_status 분포 ===' as info;
SELECT 
  stock_status,
  COUNT(*) as count
FROM items 
GROUP BY stock_status
ORDER BY count DESC;

SELECT '=== 제약 조건 확인 ===' as info;
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid IN ('items'::regclass, 'stock_history'::regclass)
AND contype = 'c'
AND (conname LIKE '%stock_status%' OR conname LIKE '%condition_type%');

-- 8단계: 테스트 - 잘못된 값 입력 시도 (에러 발생해야 함)
-- INSERT INTO items (product, spec, stock_status) VALUES ('테스트', '테스트', 'invalid_status');

-- 9단계: 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '모든 제약 조건 및 제한사항 적용 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '- normal → new 변환 완료';
  RAISE NOTICE '- 4가지 상태값만 허용 제약 조건 추가';
  RAISE NOTICE '- 허용 값: new, used-new, used-used, broken';
  RAISE NOTICE '- 잘못된 값 입력 시 DB 에러 발생';
  RAISE NOTICE '- 프론트엔드 + 서버 측 이중 검증';
  RAISE NOTICE '========================================';
END $$;
