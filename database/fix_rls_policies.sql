-- items 테이블 RLS 정책 수정
-- StockInModal에서 품목 저장을 위해 필요

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

-- 2. 기존 RLS 정책 삭제 (필요시)
-- DROP POLICY IF EXISTS items_policy ON items;

-- 3. 새로운 RLS 정책 생성 (인증된 사용자 허용)
CREATE POLICY items_insert_policy ON items
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

CREATE POLICY items_select_policy ON items
    FOR SELECT 
    TO authenticated
    USING (true);

CREATE POLICY items_update_policy ON items
    FOR UPDATE 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 4. RLS 활성화 확인
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- 5. 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'items';
