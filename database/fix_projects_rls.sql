-- ========================================
-- 프로젝트 테이블 RLS 정책 수정
-- ========================================

-- 1. 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view projects" ON projects;
DROP POLICY IF EXISTS "Level5 users can manage projects" ON projects;

-- 2. 모든 사용자가 프로젝트 조회 가능
CREATE POLICY "Anyone can view projects" ON projects
    FOR SELECT USING (true);

-- 3. Level5 이상 사용자는 프로젝트 관리 가능 (추가, 수정, 삭제)
CREATE POLICY "Level5 users can manage projects" ON projects
    FOR ALL USING (
        current_setting('app.current_user_level', true)::text IN ('5', 'administrator')
        OR current_setting('app.current_user_level', true)::text IS NULL
    );

-- 4. 임시로 모든 사용자가 프로젝트 관리 가능하도록 설정 (테스트용)
-- 실제 운영에서는 Level5 체크를 활성화해야 함
CREATE POLICY "Temporary: Anyone can manage projects" ON projects
    FOR ALL USING (true);

-- 5. 확인용 쿼리
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'projects';
