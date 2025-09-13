-- 컬럼명만 기존 코드와 호환되도록 수정
-- Supabase SQL 편집기에서 실행하세요

-- ========================================
-- 1단계: users 테이블 컬럼명 수정
-- ========================================

-- 기존 컬럼명 확인
SELECT '현재 users 테이블 컬럼:' as info;
SELECT column_name FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- 컬럼명 변경 (존재하는 컬럼만)
DO $$ 
BEGIN
    -- UserID → id (존재하는 경우만)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'UserID') THEN
        ALTER TABLE users RENAME COLUMN "UserID" TO id;
    END IF;
    
    -- Username → username (존재하는 경우만)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'Username') THEN
        ALTER TABLE users RENAME COLUMN "Username" TO username;
    END IF;
    
    -- Password → password (존재하는 경우만)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'Password') THEN
        ALTER TABLE users RENAME COLUMN "Password" TO password;
    END IF;
    
    -- Name → name (존재하는 경우만)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'Name') THEN
        ALTER TABLE users RENAME COLUMN "Name" TO name;
    END IF;
    
    -- Department → depart (존재하는 경우만)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'Department') THEN
        ALTER TABLE users RENAME COLUMN "Department" TO depart;
    END IF;
    
    -- Position → position (존재하는 경우만)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'Position') THEN
        ALTER TABLE users RENAME COLUMN "Position" TO position;
    END IF;
    
    -- Level → level (존재하는 경우만)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'Level') THEN
        ALTER TABLE users RENAME COLUMN "Level" TO level;
    END IF;
    
    -- IsActive → is_active (존재하는 경우만)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'IsActive') THEN
        ALTER TABLE users RENAME COLUMN "IsActive" TO is_active;
    END IF;
    
    -- CreatedAt → created_at (존재하는 경우만)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'CreatedAt') THEN
        ALTER TABLE users RENAME COLUMN "CreatedAt" TO created_at;
    END IF;
    
    -- UpdatedAt → updated_at (존재하는 경우만)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'UpdatedAt') THEN
        ALTER TABLE users RENAME COLUMN "UpdatedAt" TO updated_at;
    END IF;
END $$;

-- ========================================
-- 2단계: items 테이블 컬럼명 수정
-- ========================================

-- 기존 컬럼명 확인
SELECT '현재 items 테이블 컬럼:' as info;
SELECT column_name FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'items'
ORDER BY ordinal_position;

-- 컬럼명 변경 (존재하는 컬럼만)
DO $$ 
BEGIN
    -- ItemID → id (존재하는 경우만)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' AND table_name = 'items' AND column_name = 'ItemID') THEN
        ALTER TABLE items RENAME COLUMN "ItemID" TO id;
    END IF;
    
    -- Name → product (존재하는 경우만)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' AND table_name = 'items' AND column_name = 'Name') THEN
        ALTER TABLE items RENAME COLUMN "Name" TO product;
    END IF;
    
    -- Spec → spec (존재하는 경우만)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' AND table_name = 'items' AND column_name = 'Spec') THEN
        ALTER TABLE items RENAME COLUMN "Spec" TO spec;
    END IF;
    
    -- Maker → maker (존재하는 경우만)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' AND table_name = 'items' AND column_name = 'Maker') THEN
        ALTER TABLE items RENAME COLUMN "Maker" TO maker;
    END IF;
    
    -- Location → location (존재하는 경우만)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' AND table_name = 'items' AND column_name = 'Location') THEN
        ALTER TABLE items RENAME COLUMN "Location" TO location;
    END IF;
    
    -- UnitPrice → unit_price (존재하는 경우만)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' AND table_name = 'items' AND column_name = 'UnitPrice') THEN
        ALTER TABLE items RENAME COLUMN "UnitPrice" TO unit_price;
    END IF;
    
    -- Status → stock_status (존재하는 경우만)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' AND table_name = 'items' AND column_name = 'Status') THEN
        ALTER TABLE items RENAME COLUMN "Status" TO stock_status;
    END IF;
    
    -- Remark → note (존재하는 경우만)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' AND table_name = 'items' AND column_name = 'Remark') THEN
        ALTER TABLE items RENAME COLUMN "Remark" TO note;
    END IF;
END $$;

-- ========================================
-- 3단계: 필요한 컬럼 추가
-- ========================================

-- users 테이블에 필요한 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- password 값을 password_hash로 복사 (password 컬럼이 있는 경우)
UPDATE users SET password_hash = password WHERE password_hash IS NULL AND password IS NOT NULL;

-- items 테이블에 필요한 컬럼 추가
ALTER TABLE items ADD COLUMN IF NOT EXISTS purpose TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS min_stock INTEGER;
ALTER TABLE items ADD COLUMN IF NOT EXISTS category TEXT;

-- ========================================
-- 4단계: 권한 재설정
-- ========================================

-- 모든 테이블에 대한 권한 부여
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ========================================
-- 5단계: 최종 테이블 구조 확인
-- ========================================

SELECT '✅ 컬럼명 수정 완료!' as result;

-- users 테이블 최종 구조
SELECT 'users 테이블 최종 구조:' as table_info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- items 테이블 최종 구조
SELECT 'items 테이블 최종 구조:' as table_info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'items'
ORDER BY ordinal_position;

SELECT '🎉 컬럼명 수정 및 추가 완료!' as final_result;
