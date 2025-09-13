-- 현재 데이터베이스 상태 확인 스크립트

-- 1. items 테이블의 stock_status 분포 확인
SELECT '=== items 테이블 stock_status 분포 ===' as info;
SELECT stock_status, COUNT(*) as count
FROM items 
GROUP BY stock_status
ORDER BY stock_status;

-- 2. stock_history 테이블의 condition_type 분포 확인
SELECT '=== stock_history 테이블 condition_type 분포 ===' as info;
SELECT condition_type, COUNT(*) as count
FROM stock_history 
GROUP BY condition_type
ORDER BY condition_type;

-- 3. 최근 생성된 품목들의 상태 확인
SELECT '=== 최근 생성된 품목들 ===' as info;
SELECT id, product, spec, stock_status, created_at
FROM items 
ORDER BY created_at DESC
LIMIT 10;

-- 4. 최근 입고 이력들의 상태 확인
SELECT '=== 최근 입고 이력들 ===' as info;
SELECT id, item_id, condition_type, event_date, created_at
FROM stock_history 
WHERE event_type = 'IN'
ORDER BY created_at DESC
LIMIT 10;
