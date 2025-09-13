-- 문제가 되는 특정 품목들의 상태 확인

-- 1. "알 수 없음"으로 표시되는 품목들 확인
SELECT '=== "알 수 없음" 상태인 품목들 ===' as info;
SELECT 
  id,
  product,
  spec,
  stock_status,
  created_at,
  updated_at
FROM items 
WHERE product IN ('0', '00-00-00')
   OR spec IN ('0', 'qqq')
ORDER BY created_at DESC;

-- 2. 모든 품목의 stock_status 분포 확인
SELECT '=== 전체 stock_status 분포 ===' as info;
SELECT 
  stock_status, 
  COUNT(*) as count,
  CASE 
    WHEN stock_status = 'new' THEN '신품'
    WHEN stock_status = 'used-new' THEN '중고신품'
    WHEN stock_status = 'used-used' THEN '중고사용품'
    WHEN stock_status = 'broken' THEN '불량품'
    ELSE '알 수 없음'
  END as display_text
FROM items 
GROUP BY stock_status
ORDER BY count DESC;

-- 3. stock_status가 NULL이거나 빈 값인 경우 확인
SELECT '=== NULL 또는 빈 값인 stock_status ===' as info;
SELECT 
  id,
  product,
  spec,
  stock_status,
  CASE 
    WHEN stock_status IS NULL THEN 'NULL'
    WHEN stock_status = '' THEN '빈 문자열'
    ELSE stock_status
  END as status_type
FROM items 
WHERE stock_status IS NULL OR stock_status = ''
ORDER BY created_at DESC;
