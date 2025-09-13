-- 세션 사용자 ID 설정 함수 생성
-- Supabase SQL 편집기에서 실행하세요

-- 기존 함수가 있다면 삭제
-- DROP FUNCTION IF EXISTS public.set_session_user(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.set_session_user(
    session_id TEXT,
    user_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 세션 변수 설정
    PERFORM set_config('app.current_user_id', user_id, false);
    
    -- 로그 기록
    INSERT INTO public.audit_logs (
        action,
        user_id,
        session_id,
        timestamp,
        details
    ) VALUES (
        'session_set',
        user_id,
        session_id,
        NOW(),
        jsonb_build_object(
            'ip', inet_client_addr(), 
            'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent'
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- 오류 로깅
        RAISE LOG 'set_session_user 오류: %', SQLERRM;
        RAISE EXCEPTION '세션 설정 실패: %', SQLERRM;
END;
$$;

-- 함수 권한 설정
GRANT EXECUTE ON FUNCTION public.set_session_user(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_session_user(TEXT, TEXT) TO anon;

-- 함수 존재 확인
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'set_session_user';

-- 권한 확인
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.routine_privileges 
WHERE routine_name = 'set_session_user';

-- 테스트 실행 (선택사항)
-- SELECT set_session_user('test-session-123', 'test-user-456');
