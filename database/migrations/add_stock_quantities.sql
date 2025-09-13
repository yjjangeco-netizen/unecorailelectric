-- current_stock 테이블에 입고/출고 수량 컬럼 추가
-- 마이그레이션 파일: add_stock_quantities.sql

-- stock_in_quantity 컬럼 추가 (누적 입고 수량)
ALTER TABLE current_stock 
ADD COLUMN IF NOT EXISTS stock_in_quantity INTEGER DEFAULT 0;

-- stock_out_quantity 컬럼 추가 (누적 출고 수량)
ALTER TABLE current_stock 
ADD COLUMN IF NOT EXISTS stock_out_quantity INTEGER DEFAULT 0;

-- stock_status 컬럼 추가 (품목 상태)
ALTER TABLE current_stock 
ADD COLUMN IF NOT EXISTS stock_status TEXT DEFAULT 'new';

-- 컬럼 설명 추가
COMMENT ON COLUMN current_stock.stock_in_quantity IS '누적 입고 수량';
COMMENT ON COLUMN current_stock.stock_out_quantity IS '누적 출고 수량';
COMMENT ON COLUMN current_stock.stock_status IS '품목 상태 (new, used-new, used-used, broken)';

-- 기본값 설정
UPDATE current_stock 
SET stock_in_quantity = 0, stock_out_quantity = 0, stock_status = 'new' 
WHERE stock_in_quantity IS NULL OR stock_out_quantity IS NULL OR stock_status IS NULL;
