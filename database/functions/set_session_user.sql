-- 세션 사용자 ID 설정 함수
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
    
    -- 로그 기록 (선택사항)
    INSERT INTO audit_logs (
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
        jsonb_build_object('ip', inet_client_addr(), 'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent')
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

-- 함수 존재 확인을 위한 주석
COMMENT ON FUNCTION public.set_session_user(TEXT, TEXT) IS '사용자 세션 ID를 설정하고 감사 로그를 기록합니다.';
