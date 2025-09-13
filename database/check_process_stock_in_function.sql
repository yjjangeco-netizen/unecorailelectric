-- ========================================
-- process_stock_in 함수 존재 여부 확인
-- ========================================

-- 1단계: 함수 존재 여부 확인
SELECT '=== process_stock_in 함수 확인 ===' as info;

SELECT 
  routine_name,
  routine_type,
  data_type,
  routine_definition
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

-- 3단계: 함수 테스트
SELECT '=== 함수 테스트 ===' as info;

-- 간단한 테스트 호출
SELECT process_stock_in(
  '테스트품목',
  '테스트규격',
  '테스트제조사',
  '테스트위치',
  1,
  1000.00,
  'new',
  '테스트사유',
  '테스트비고',
  'test@example.com'
);

-- 4단계: 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'process_stock_in 함수 확인 완료!';
  RAISE NOTICE '========================================';
END $$;
