-- 회원가입을 위한 users 테이블 수정
-- Supabase SQL 편집기에서 실행하세요

-- ========================================
-- 1단계: 현재 테이블 구조 확인
-- ========================================

SELECT '현재 users 테이블 구조:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- ========================================
-- 2단계: 필요한 컬럼 추가
-- ========================================

-- department 컬럼 추가 (부서)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'department'
    ) THEN
        ALTER TABLE users ADD COLUMN department TEXT;
        RAISE NOTICE 'department 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE 'department 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- position 컬럼 추가 (직책)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'position'
    ) THEN
        ALTER TABLE users ADD COLUMN position TEXT;
        RAISE NOTICE 'position 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE 'position 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- email 컬럼 추가 (이메일)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE users ADD COLUMN email TEXT;
        RAISE NOTICE 'email 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE 'email 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- level 컬럼 추가 (권한 레벨)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'level'
    ) THEN
        ALTER TABLE users ADD COLUMN level TEXT DEFAULT 'level1';
        RAISE NOTICE 'level 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE 'level 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- password 컬럼 추가 (비밀번호)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'password'
    ) THEN
        ALTER TABLE users ADD COLUMN password TEXT;
        RAISE NOTICE 'password 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE 'password 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- is_active 컬럼 추가 (활성 상태)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'is_active 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE 'is_active 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- ========================================
-- 3단계: 기존 데이터 업데이트
-- ========================================

-- 기존 사용자들에게 기본값 설정
UPDATE users SET 
    department = COALESCE(department, '전기팀'),
    position = COALESCE(position, '사원'),
    level = COALESCE(level, 'level1'),
    is_active = COALESCE(is_active, true)
WHERE department IS NULL OR position IS NULL OR level IS NULL OR is_active IS NULL;

-- ========================================
-- 4단계: 최종 테이블 구조 확인
-- ========================================

SELECT '✅ users 테이블 수정 완료!' as result;

SELECT '최종 users 테이블 구조:' as table_info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 샘플 데이터 확인
SELECT '현재 users 테이블 데이터:' as data_info;
SELECT 
    id,
    name,
    email,
    department,
    position,
    level,
    is_active
FROM users
LIMIT 10;
