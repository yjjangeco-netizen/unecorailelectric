-- items 테이블에 closing_quantity 컬럼 추가
-- 마감 처리 시 현재고를 저장하는 컬럼

-- 1. items 테이블에 closing_quantity 컬럼 추가
ALTER TABLE items ADD COLUMN IF NOT EXISTS closing_quantity INTEGER DEFAULT 0;

-- 2. 기존 데이터의 closing_quantity를 current_quantity로 초기화
UPDATE items SET closing_quantity = COALESCE(current_quantity, 0) WHERE closing_quantity IS NULL;

-- 3. closing_quantity 컬럼을 NOT NULL로 설정
ALTER TABLE items ALTER COLUMN closing_quantity SET NOT NULL;

-- 4. closing_quantity 컬럼에 기본값 설정
ALTER TABLE items ALTER COLUMN closing_quantity SET DEFAULT 0;

-- 5. 컬럼 추가 확인
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'items'
  AND column_name = 'closing_quantity';

-- 6. 샘플 데이터 확인
SELECT
  id,
  product,
  current_quantity,
  closing_quantity
FROM items
LIMIT 5;
