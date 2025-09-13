-- ========================================
-- 현재 테이블 구조 확인
-- ========================================

-- 1단계: 테이블 존재 여부 확인
SELECT '=== 테이블 존재 여부 ===' as info;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('items', 'current_stock', 'unified_items')
ORDER BY table_name;

-- 2단계: items 테이블 구조 확인
SELECT '=== items 테이블 구조 ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'items'
ORDER BY ordinal_position;

-- 3단계: current_stock 테이블 구조 확인
SELECT '=== current_stock 테이블 구조 ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'current_stock'
ORDER BY ordinal_position;

-- 4단계: 각 테이블의 데이터 샘플 확인
SELECT '=== items 테이블 데이터 샘플 ===' as info;
SELECT * FROM items LIMIT 3;

SELECT '=== current_stock 테이블 데이터 샘플 ===' as info;
SELECT * FROM current_stock LIMIT 3;
