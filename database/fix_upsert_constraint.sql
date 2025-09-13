-- Supabase에서 바로 실행: items 테이블 고유 제약 조건 추가
-- StockInModal의 upsert 기능을 위해 필요

-- 1. 고유 제약 조건 추가
ALTER TABLE items 
ADD CONSTRAINT items_product_spec_unique 
UNIQUE (product, spec);

-- 2. 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS items_product_spec_idx 
ON items (product, spec);

-- 3. 확인 메시지
SELECT '고유 제약 조건이 성공적으로 추가되었습니다!' as result;
