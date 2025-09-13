-- ========================================
-- current_quantity 계산 수정 스크립트
-- ========================================

-- 1단계: 현재 데이터 확인
SELECT '=== 수정 전 데이터 확인 ===' as info;

SELECT 
  id,
  name,
  specification,
  current_quantity,
  stock_in,
  stock_out,
  closing_quantity,
  (closing_quantity + stock_in - stock_out) as calculated_current_quantity
FROM public.items
WHERE name = '4' OR name = '6'
ORDER BY name;

-- 2단계: current_quantity를 올바르게 계산하여 업데이트
SELECT '=== current_quantity 수정 시작 ===' as info;

UPDATE public.items 
SET 
  current_quantity = (closing_quantity + stock_in - stock_out),
  updated_at = NOW()
WHERE current_quantity != (closing_quantity + stock_in - stock_out);

-- 3단계: 수정된 데이터 확인
SELECT '=== 수정 후 데이터 확인 ===' as info;

SELECT 
  id,
  name,
  specification,
  current_quantity,
  stock_in,
  stock_out,
  closing_quantity,
  (closing_quantity + stock_in - stock_out) as calculated_current_quantity
FROM public.items
WHERE name = '4' OR name = '6'
ORDER BY name;

-- 4단계: 모든 항목의 current_quantity 일관성 확인
SELECT '=== 전체 데이터 일관성 확인 ===' as info;

SELECT 
  COUNT(*) as total_items,
  COUNT(CASE WHEN current_quantity = (closing_quantity + stock_in - stock_out) THEN 1 END) as correct_items,
  COUNT(CASE WHEN current_quantity != (closing_quantity + stock_in - stock_out) THEN 1 END) as incorrect_items
FROM public.items;

-- 5단계: 잘못된 항목들 나열
SELECT '=== 잘못된 항목들 ===' as info;

SELECT 
  id,
  name,
  specification,
  current_quantity as db_current_quantity,
  (closing_quantity + stock_in - stock_out) as correct_current_quantity,
  (current_quantity - (closing_quantity + stock_in - stock_out)) as difference
FROM public.items
WHERE current_quantity != (closing_quantity + stock_in - stock_out)
ORDER BY ABS(current_quantity - (closing_quantity + stock_in - stock_out)) DESC;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'current_quantity 계산 수정 완료!';
  RAISE NOTICE '========================================';
END $$;
