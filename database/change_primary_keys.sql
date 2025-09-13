-- ========================================
-- 기본키를 UUID에서 순차 증가 정수로 변경
-- ========================================

-- 1단계: items 테이블 기본키 변경
-- 기존 id 컬럼을 백업하고 새로운 id 컬럼 생성
ALTER TABLE items 
ADD COLUMN new_id SERIAL;

-- 기존 데이터를 새로운 id로 복사 (순서대로)
UPDATE items 
SET new_id = DEFAULT;

-- 기존 id 컬럼을 제거하고 새로운 id를 기본키로 설정
ALTER TABLE items 
DROP CONSTRAINT IF EXISTS items_pkey;

ALTER TABLE items 
DROP COLUMN id;

ALTER TABLE items 
RENAME COLUMN new_id TO id;

ALTER TABLE items 
ADD PRIMARY KEY (id);

-- 2단계: current_stock 테이블 기본키 변경
-- 기존 id 컬럼을 백업하고 새로운 id 컬럼 생성
ALTER TABLE current_stock 
ADD COLUMN new_id SERIAL;

-- 기존 데이터를 새로운 id로 복사 (순서대로)
UPDATE current_stock 
SET new_id = DEFAULT;

-- 기존 id 컬럼을 제거하고 새로운 id를 기본키로 설정
ALTER TABLE current_stock 
DROP CONSTRAINT IF EXISTS current_stock_pkey;

ALTER TABLE current_stock 
DROP COLUMN id;

ALTER TABLE current_stock 
RENAME COLUMN new_id TO id;

ALTER TABLE current_stock 
ADD PRIMARY KEY (id);

-- 3단계: 변경 결과 확인
SELECT '=== 기본키 변경 완료 ===' as info;

-- items 테이블 구조 확인
SELECT 
  'items 테이블' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'items' AND column_name = 'id'
ORDER BY ordinal_position;

-- current_stock 테이블 구조 확인
SELECT 
  'current_stock 테이블' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'current_stock' AND column_name = 'id'
ORDER BY ordinal_position;

-- 4단계: 데이터 개수 확인
SELECT '=== 데이터 개수 확인 ===' as info;
SELECT 
  'items' as table_name,
  COUNT(*) as count
FROM items
UNION ALL
SELECT 
  'current_stock' as table_name,
  COUNT(*) as count
FROM current_stock;
