-- ========================================
-- 기존 items 데이터 확인 및 디버깅
-- ========================================

-- 1단계: 현재 items 테이블의 모든 데이터 확인
SELECT '=== 현재 items 테이블 데이터 ===' as info;

SELECT 
  id,
  name,
  specification,
  maker,
  location,
  current_quantity,
  stock_in,
  total_qunty,
  stock_status,
  status,
  created_at,
  updated_at
FROM public.items
ORDER BY created_at DESC;

-- 2단계: 특정 품목으로 테스트 (콘솔에서 보인 '4' 품목)
SELECT '=== 품목명 "4" 데이터 확인 ===' as info;

SELECT 
  id,
  name,
  specification,
  maker,
  location,
  current_quantity,
  stock_in,
  total_qunty,
  stock_status,
  status
FROM public.items
WHERE name = '4';

-- 3단계: process_stock_in 함수로 같은 품목 입고 테스트
SELECT '=== 품목명 "4" 입고 테스트 ===' as info;

SELECT process_stock_in(
  '4',
  '4',
  '4',
  '4',
  1,
  100.00,
  'new',
  '테스트입고',
  '디버깅용',
  'debug@test.com'
) as result;

-- 4단계: 입고 후 데이터 확인
SELECT '=== 입고 후 품목명 "4" 데이터 확인 ===' as info;

SELECT 
  id,
  name,
  specification,
  maker,
  location,
  current_quantity,
  stock_in,
  total_qunty,
  stock_status,
  status,
  updated_at
FROM public.items
WHERE name = '4';

-- 5단계: 함수 내부 로직 디버깅을 위한 로그 테이블 생성 (있다면)
SELECT '=== 함수 실행 로그 확인 ===' as info;

-- 로그 테이블이 있는지 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%log%';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '디버깅 완료!';
  RAISE NOTICE '========================================';
END $$;
