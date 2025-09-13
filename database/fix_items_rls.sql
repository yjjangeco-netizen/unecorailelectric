-- items 테이블 RLS 정책 수정
-- Supabase SQL 편집기에서 실행하세요

-- 1. 현재 RLS 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'items';

-- 2. 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "items_select_policy" ON items;
DROP POLICY IF EXISTS "items_insert_policy" ON items;
DROP POLICY IF EXISTS "items_update_policy" ON items;
DROP POLICY IF EXISTS "items_delete_policy" ON items;

-- 3. 새로운 RLS 정책 생성

-- SELECT 정책: 인증된 사용자는 모든 품목 조회 가능
CREATE POLICY "items_select_policy" ON items
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

-- INSERT 정책: 인증된 사용자는 새 품목 추가 가능
CREATE POLICY "items_insert_policy" ON items
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );

-- UPDATE 정책: 인증된 사용자는 품목 수정 가능
CREATE POLICY "items_update_policy" ON items
    FOR UPDATE USING (
        auth.role() = 'authenticated'
    );

-- DELETE 정책: 인증된 사용자는 품목 삭제 가능
CREATE POLICY "items_delete_policy" ON items
    FOR DELETE USING (
        auth.role() = 'authenticated'
    );

-- 4. RLS 활성화 확인
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- 5. 권한 설정
GRANT ALL ON items TO authenticated;
GRANT USAGE ON SEQUENCE items_id_seq TO authenticated;

-- 6. 정책 생성 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'items';

-- 7. 테스트: 품목 추가 시뮬레이션
-- INSERT INTO items (product, spec, maker, unit_price, purpose, min_stock, category, note, stock_status)
-- VALUES ('테스트품목', '테스트규격', '테스트제조사', 1000, '테스트용도', 10, '테스트분류', '테스트비고', 'new');
