-- ========================================
-- 프로젝트 테이블 RLS 임시 비활성화 (테스트용)
-- ========================================

-- RLS 비활성화
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- 확인
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'projects';
