-- items 테이블에 고유 제약 조건 추가
-- 이 파일은 StockInModal의 upsert 기능을 위해 필요합니다

-- 1. 기존 중복 데이터 확인 (선택사항)
SELECT product, spec, COUNT(*) as count
FROM items 
GROUP BY product, spec 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. product,spec 조합의 고유 제약 조건 추가
ALTER TABLE items 
ADD CONSTRAINT items_product_spec_unique 
UNIQUE (product, spec);

-- 3. 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS items_product_spec_idx 
ON items (product, spec);

-- 4. 제약 조건 확인
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'items' 
AND constraint_type = 'UNIQUE';

-- 5. 인덱스 확인
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename = 'items';
