-- 테이블명을 기존 코드와 호환되도록 수정
-- Supabase SQL 편집기에서 실행하세요

-- ========================================
-- 1단계: 테이블명 변경
-- ========================================

-- Users → users로 변경
ALTER TABLE "Users" RENAME TO users;

-- Items → items로 변경  
ALTER TABLE "Items" RENAME TO items;

-- StockHistory → stock_history로 변경
ALTER TABLE "StockHistory" RENAME TO stock_history;

-- Disposals → disposals로 변경
ALTER TABLE "Disposals" RENAME TO disposals;

-- AuditLogs → audit_logs로 변경
ALTER TABLE "AuditLogs" RENAME TO audit_logs;

-- ========================================
-- 2단계: 컬럼명도 기존과 호환되도록 수정
-- ========================================

-- users 테이블 컬럼명 수정
ALTER TABLE users RENAME COLUMN "UserID" TO id;
ALTER TABLE users RENAME COLUMN "Username" TO username;
ALTER TABLE users RENAME COLUMN "Password" TO password;
ALTER TABLE users RENAME COLUMN "Name" TO name;
ALTER TABLE users RENAME COLUMN "Department" TO depart;
ALTER TABLE users RENAME COLUMN "Position" TO position;
ALTER TABLE users RENAME COLUMN "Level" TO level;
ALTER TABLE users RENAME COLUMN "IsActive" TO is_active;
ALTER TABLE users RENAME COLUMN "CreatedAt" TO created_at;
ALTER TABLE users RENAME COLUMN "UpdatedAt" TO updated_at;

-- items 테이블 컬럼명 수정
ALTER TABLE items RENAME COLUMN "ItemID" TO id;
ALTER TABLE items RENAME COLUMN "Name" TO product;
ALTER TABLE items RENAME COLUMN "Spec" TO spec;
ALTER TABLE items RENAME COLUMN "Maker" TO maker;
ALTER TABLE items RENAME COLUMN "Location" TO location;
ALTER TABLE items RENAME COLUMN "UnitPrice" TO unit_price;
ALTER TABLE items RENAME COLUMN "Status" TO stock_status;
ALTER TABLE items RENAME COLUMN "Remark" TO note;

-- stock_history 테이블 컬럼명 수정
ALTER TABLE stock_history RENAME COLUMN "HistoryID" TO id;
ALTER TABLE stock_history RENAME COLUMN "ItemID" TO item_id;
ALTER TABLE stock_history RENAME COLUMN "EventType" TO event_type;
ALTER TABLE stock_history RENAME COLUMN "Quantity" TO quantity;
ALTER TABLE stock_history RENAME COLUMN "EventDate" TO event_date;
ALTER TABLE stock_history RENAME COLUMN "Note" TO note;
ALTER TABLE stock_history RENAME COLUMN "CreatedAt" TO created_at;

-- ========================================
-- 3단계: 기존 users 테이블 구조와 완전히 동일하게 만들기
-- ========================================

-- email 컬럼 추가 (기존 코드에서 필요)
ALTER TABLE users ADD COLUMN email TEXT DEFAULT '';

-- password_hash 컬럼 추가 (기존 코드에서 필요)
ALTER TABLE users ADD COLUMN password_hash TEXT;

-- 기존 password 값을 password_hash로 복사
UPDATE users SET password_hash = password;

-- ========================================
-- 4단계: 기존 items 테이블 구조와 완전히 동일하게 만들기
-- ========================================

-- purpose 컬럼 추가
ALTER TABLE items ADD COLUMN purpose TEXT;

-- min_stock 컬럼 추가
ALTER TABLE items ADD COLUMN min_stock INTEGER;

-- category 컬럼 추가
ALTER TABLE items ADD COLUMN category TEXT;

-- ========================================
-- 5단계: 권한 재설정
-- ========================================

-- 모든 테이블에 대한 권한 부여
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ========================================
-- 6단계: 테이블 구조 확인
-- ========================================

SELECT '✅ 테이블명 및 컬럼명 수정 완료' as result;

-- users 테이블 구조 확인
SELECT 'users 테이블 구조:' as table_info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- items 테이블 구조 확인
SELECT 'items 테이블 구조:' as table_info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'items'
ORDER BY ordinal_position;

SELECT '🎉 테이블명 및 컬럼명 수정 완료!' as final_result;
