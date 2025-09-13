-- users 테이블 구조 확인
-- Supabase SQL 편집기에서 실행하세요

-- ========================================
-- 1단계: 테이블 존재 여부 확인
-- ========================================

SELECT '테이블 존재 여부:' as info;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'users';

-- ========================================
-- 2단계: users 테이블 컬럼 구조 확인
-- ========================================

SELECT 'users 테이블 컬럼 구조:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- ========================================
-- 3단계: 현재 데이터 샘플 확인
-- ========================================

SELECT '현재 users 테이블 데이터 샘플:' as info;
SELECT * FROM users LIMIT 5;

-- ========================================
-- 4단계: 테이블 제약조건 확인
-- ========================================

SELECT '테이블 제약조건:' as info;
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
AND table_name = 'users';

-- ========================================
-- 5단계: 컬럼별 제약조건 확인
-- ========================================

SELECT '컬럼별 제약조건:' as info;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    tc.is_deferrable,
    tc.initially_deferred
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.table_name = 'users';
