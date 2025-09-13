-- normal 값을 new로 변환하는 마이그레이션 스크립트
-- 실행 전 반드시 백업을 수행하세요!

-- 1. items 테이블의 stock_status 컬럼에서 normal을 new로 변환
UPDATE items 
SET stock_status = 'new' 
WHERE stock_status = 'normal';

-- 2. stock_history 테이블의 condition_type 컬럼에서 normal을 new로 변환
UPDATE stock_history 
SET condition_type = 'new' 
WHERE condition_type = 'normal';

-- 3. 변환 결과 확인
SELECT 'items 테이블' as table_name, stock_status, COUNT(*) as count
FROM items 
GROUP BY stock_status
UNION ALL
SELECT 'stock_history 테이블' as table_name, condition_type, COUNT(*) as count
FROM stock_history 
GROUP BY condition_type
ORDER BY table_name, stock_status;

-- 4. CHECK 제약 조건 재적용 (이미 설정되어 있다면 무시됨)
ALTER TABLE items 
DROP CONSTRAINT IF EXISTS items_stock_status_check;

ALTER TABLE items 
ADD CONSTRAINT items_stock_status_check 
CHECK (stock_status IN ('new', 'used-new', 'used-used', 'broken'));

ALTER TABLE stock_history 
DROP CONSTRAINT IF EXISTS stock_history_condition_type_check;

ALTER TABLE stock_history 
ADD CONSTRAINT stock_history_condition_type_check 
CHECK (condition_type IN ('new', 'used-new', 'used-used', 'broken'));

-- 5. 최종 확인
SELECT '변환 완료 후 최종 상태:' as status;
SELECT 'items 테이블' as table_name, stock_status, COUNT(*) as count
FROM items 
GROUP BY stock_status
UNION ALL
SELECT 'stock_history 테이블' as table_name, condition_type, COUNT(*) as count
FROM stock_history 
GROUP BY condition_type
ORDER BY table_name, stock_status;
