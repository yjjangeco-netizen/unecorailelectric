-- ========================================
-- current_stock 테이블 제약조건 추가
-- ========================================

-- 1단계: (name, specification) 유니크 제약조건 추가
ALTER TABLE current_stock 
ADD CONSTRAINT current_stock_name_spec_unique 
UNIQUE (name, specification);

-- 2단계: 제약조건 확인
SELECT '=== 제약조건 추가 완료 ===' as info;
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'current_stock'
ORDER BY constraint_name;
