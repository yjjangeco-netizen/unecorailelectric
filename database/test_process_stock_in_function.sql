-- ========================================
-- process_stock_in 함수 테스트
-- ========================================

-- 1단계: 함수 존재 여부 확인
SELECT '=== process_stock_in 함수 확인 ===' as info;

SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'process_stock_in';

-- 2단계: 함수 매개변수 확인
SELECT '=== 함수 매개변수 확인 ===' as info;

SELECT 
  parameter_name,
  parameter_mode,
  data_type,
  ordinal_position
FROM information_schema.parameters 
WHERE specific_schema = 'public' 
AND specific_name = (
  SELECT specific_name 
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
  AND routine_name = 'process_stock_in'
)
ORDER BY ordinal_position;

-- 3단계: 새 품목 입고 테스트
SELECT '=== 새 품목 입고 테스트 ===' as info;

SELECT process_stock_in(
  '테스트품목1',
  '테스트규격1',
  '테스트제조사1',
  '테스트위치1',
  10,
  1000.00,
  'new',
  '테스트사유',
  '테스트비고',
  'test@example.com'
) as result;

-- 4단계: 기존 품목 입고 테스트
SELECT '=== 기존 품목 입고 테스트 ===' as info;

SELECT process_stock_in(
  '테스트품목1',
  '테스트규격1',
  '테스트제조사1',
  '테스트위치1',
  5,
  1200.00,
  'used-new',
  '추가입고',
  '추가비고',
  'test@example.com'
) as result;

-- 5단계: items 테이블 확인
SELECT '=== items 테이블 확인 ===' as info;

SELECT 
  id,
  name,
  specification,
  maker,
  location,
  current_quantity,
  unit_price,
  stock_status,
  stock_in,
  total_qunty,
  created_at,
  updated_at
FROM public.items
WHERE name LIKE '테스트품목%'
ORDER BY created_at DESC;

-- 6단계: 에러 케이스 테스트
SELECT '=== 에러 케이스 테스트 ===' as info;

-- 품목명이 없는 경우
SELECT process_stock_in(
  NULL,
  '테스트규격',
  '테스트제조사',
  '테스트위치',
  1,
  1000.00,
  'new',
  '테스트사유',
  '테스트비고',
  'test@example.com'
) as result;

-- 수량이 0인 경우
SELECT process_stock_in(
  '테스트품목2',
  '테스트규격2',
  '테스트제조사2',
  '테스트위치2',
  0,
  1000.00,
  'new',
  '테스트사유',
  '테스트비고',
  'test@example.com'
) as result;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'process_stock_in 함수 테스트 완료!';
  RAISE NOTICE '========================================';
END $$;
