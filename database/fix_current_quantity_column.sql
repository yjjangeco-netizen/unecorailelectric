-- ========================================
-- current_quantity 컬럼 누락 문제 해결
-- ========================================

-- 1. current_stock 테이블에 current_quantity 컬럼 추가
ALTER TABLE current_stock ADD COLUMN IF NOT EXISTS current_quantity INTEGER DEFAULT 0;

-- 2. items 테이블에 current_quantity 컬럼 추가 (VIEW인 경우를 대비)
ALTER TABLE items ADD COLUMN IF NOT EXISTS current_quantity INTEGER DEFAULT 0;

-- 3. 컬럼 추가 확인
SELECT 'current_stock 테이블 컬럼 확인' as info;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'current_stock' AND column_name = 'current_quantity';

SELECT 'items 테이블 컬럼 확인' as info;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'items' AND column_name = 'current_quantity';
