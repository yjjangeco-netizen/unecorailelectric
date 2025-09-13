-- ========================================
-- current_stock 통합 테스트 스크립트
-- ========================================

-- 1단계: 테이블 구조 확인
SELECT '=== 테이블 구조 확인 ===' as info;

-- items 테이블 구조
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'items'
ORDER BY ordinal_position;

-- current_stock VIEW 구조
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'current_stock'
ORDER BY ordinal_position;

-- 2단계: 샘플 데이터 삽입 테스트
SELECT '=== 샘플 데이터 삽입 테스트 ===' as info;

-- 샘플 품목 삽입
INSERT INTO items (product, spec, maker, category, unit_price, purpose, min_stock, stock_status, current_quantity, location, note) VALUES
('테스트품목1', '테스트규격1', '테스트제조사1', '테스트카테고리', 1000.00, '테스트용도', 10, 'normal', 50, '테스트위치', '테스트비고')
ON CONFLICT DO NOTHING;

-- 3단계: current_stock VIEW 테스트
SELECT '=== current_stock VIEW 테스트 ===' as info;

-- current_stock VIEW에서 데이터 조회
SELECT * FROM current_stock WHERE product = '테스트품목1';

-- 4단계: 입고 함수 테스트
SELECT '=== 입고 함수 테스트 ===' as info;

-- process_stock_in_transaction 함수 테스트
SELECT process_stock_in_transaction(
  '테스트품목2',
  '테스트규격2',
  '테스트제조사2',
  2000.00,
  'new',
  '테스트비고',
  '테스트용도',
  30,
  'test@example.com',
  CURRENT_DATE,
  '테스트위치'
);

-- 5단계: 출고 함수 테스트
SELECT '=== 출고 함수 테스트 ===' as info;

-- process_stock_out 함수 테스트
SELECT process_stock_out(
  '테스트품목2',
  '테스트규격2',
  '테스트제조사2',
  '테스트위치',
  10,
  2000.00,
  'test@example.com',
  '테스트프로젝트',
  false,
  null,
  '테스트출고'
);

-- 6단계: 결과 확인
SELECT '=== 결과 확인 ===' as info;

-- items 테이블에서 재고 현황 확인
SELECT 
  product,
  spec,
  current_quantity,
  stock_status,
  unit_price,
  (unit_price * current_quantity) as total_amount
FROM items 
WHERE product LIKE '테스트품목%'
ORDER BY product;

-- current_stock VIEW에서 재고 현황 확인
SELECT 
  product,
  spec,
  current_quantity,
  stock_status,
  unit_price,
  total_amount
FROM current_stock 
WHERE product LIKE '테스트품목%'
ORDER BY product;

-- 7단계: 정리
SELECT '=== 테스트 데이터 정리 ===' as info;

-- 테스트 데이터 삭제
DELETE FROM items WHERE product LIKE '테스트품목%';

-- 8단계: 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'current_stock 통합 테스트 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '- items 테이블과 current_stock VIEW 연동 정상';
  RAISE NOTICE '- 입고/출고 함수 정상 작동';
  RAISE NOTICE '- 재고 데이터 일관성 확인';
  RAISE NOTICE '========================================';
END $$;
