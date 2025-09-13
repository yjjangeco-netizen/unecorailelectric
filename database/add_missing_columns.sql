-- ========================================
-- current_stock 테이블에 누락된 컬럼 추가
-- ========================================

-- 1단계: 현재 테이블 구조 확인
SELECT '=== 현재 테이블 구조 확인 ===' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'current_stock'
ORDER BY ordinal_position;

-- 2단계: 누락된 컬럼 추가
SELECT '=== 누락된 컬럼 추가 ===' as info;

-- spec 컬럼 추가
ALTER TABLE current_stock 
ADD COLUMN IF NOT EXISTS spec TEXT;

-- maker 컬럼 추가  
ALTER TABLE current_stock 
ADD COLUMN IF NOT EXISTS maker TEXT;

-- category 컬럼 추가
ALTER TABLE current_stock 
ADD COLUMN IF NOT EXISTS category TEXT;

-- purpose 컬럼 추가
ALTER TABLE current_stock 
ADD COLUMN IF NOT EXISTS purpose TEXT;

-- min_stock 컬럼 추가
ALTER TABLE current_stock 
ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 0;

-- 3단계: 컬럼 추가 확인
SELECT '=== 컬럼 추가 확인 ===' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'current_stock'
ORDER BY ordinal_position;

-- 4단계: items 테이블과 데이터 동기화
SELECT '=== 데이터 동기화 ===' as info;

-- product 이름을 기준으로 items 테이블의 정보를 current_stock에 업데이트
UPDATE current_stock 
SET 
  spec = i.spec,
  maker = i.maker,
  category = i.category,
  purpose = i.purpose,
  min_stock = i.min_stock
FROM items i
WHERE current_stock.product = i.product;

-- 5단계: 동기화 결과 확인
SELECT '=== 동기화 결과 확인 ===' as info;

-- 업데이트된 데이터 확인
SELECT 
  cs.product,
  cs.spec,
  cs.maker,
  cs.category,
  cs.purpose,
  cs.min_stock
FROM current_stock cs
WHERE cs.spec IS NOT NULL
LIMIT 5;

-- 6단계: 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '컬럼 추가 및 데이터 동기화 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '- spec, maker, category 컬럼 추가';
  RAISE NOTICE '- purpose, min_stock 컬럼 추가';
  RAISE NOTICE '- items 테이블과 데이터 동기화';
  RAISE NOTICE '- JOIN 없이 current_stock에서 모든 정보 조회 가능';
  RAISE NOTICE '========================================';
END $$;
