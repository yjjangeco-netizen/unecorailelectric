-- 간단한 RLS 정책 수정 스크립트
-- Supabase SQL 편집기에서 실행하세요

-- ========================================
-- 1단계: items 테이블 RLS 정책 수정
-- ========================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "items_select_policy" ON items;
DROP POLICY IF EXISTS "items_insert_policy" ON items;
DROP POLICY IF EXISTS "items_update_policy" ON items;
DROP POLICY IF EXISTS "items_delete_policy" ON items;

-- 새로운 정책 생성
CREATE POLICY "items_select_policy" ON items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "items_insert_policy" ON items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "items_update_policy" ON items
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "items_delete_policy" ON items
    FOR DELETE USING (auth.role() = 'authenticated');

-- 기본 권한만 설정 (시퀀스 오류 방지)
GRANT SELECT, INSERT, UPDATE, DELETE ON items TO authenticated;

-- ========================================
-- 2단계: current_stock 테이블 RLS 정책 수정
-- ========================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "current_stock_select_policy" ON current_stock;
DROP POLICY IF EXISTS "current_stock_insert_policy" ON current_stock;
DROP POLICY IF EXISTS "current_stock_update_policy" ON current_stock;
DROP POLICY IF EXISTS "current_stock_delete_policy" ON current_stock;

-- 새로운 정책 생성
CREATE POLICY "current_stock_select_policy" ON current_stock
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "current_stock_insert_policy" ON current_stock
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "current_stock_update_policy" ON current_stock
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "current_stock_delete_policy" ON current_stock
    FOR DELETE USING (auth.role() = 'authenticated');

-- 기본 권한만 설정
GRANT SELECT, INSERT, UPDATE, DELETE ON current_stock TO authenticated;

-- ========================================
-- 3단계: stock_in 테이블 RLS 정책 수정
-- ========================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "stock_in_select_policy" ON stock_in;
DROP POLICY IF EXISTS "stock_in_insert_policy" ON stock_in;
DROP POLICY IF EXISTS "stock_in_update_policy" ON stock_in;
DROP POLICY IF EXISTS "stock_in_delete_policy" ON stock_in;

-- 새로운 정책 생성
CREATE POLICY "stock_in_select_policy" ON stock_in
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "stock_in_insert_policy" ON stock_in
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "stock_in_update_policy" ON stock_in
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "stock_in_delete_policy" ON stock_in
    FOR DELETE USING (auth.role() = 'authenticated');

-- 기본 권한만 설정
GRANT SELECT, INSERT, UPDATE, DELETE ON stock_in TO authenticated;

-- ========================================
-- 4단계: RLS 활성화 확인
-- ========================================

ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_in ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 5단계: 정책 생성 확인
-- ========================================

SELECT '✅ items 테이블 정책 생성 완료' as result;
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'items';

SELECT '✅ current_stock 테이블 정책 생성 완료' as result;
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'current_stock';

SELECT '✅ stock_in 테이블 정책 생성 완료' as result;
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'stock_in';

SELECT '🎉 모든 RLS 정책 수정 완료!' as final_result;
