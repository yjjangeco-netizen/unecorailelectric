-- 세션 관련 함수 실행 스크립트
-- 이 파일을 Supabase SQL 편집기에서 실행하세요

-- 1. 감사 로그 테이블 생성
\i tables/audit_logs.sql

-- 2. 세션 사용자 설정 함수 생성
\i functions/set_session_user.sql

-- 3. 함수 존재 확인
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'set_session_user';

-- 4. 권한 확인
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.routine_privileges 
WHERE routine_name = 'set_session_user';

-- 5. 테스트 실행 (선택사항)
-- SELECT set_session_user('test-session-123', 'test-user-456');
