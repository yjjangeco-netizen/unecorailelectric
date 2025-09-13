-- 완전한 세션 설정 스크립트
-- Supabase SQL 편집기에서 실행하세요
-- 순서: 1. 테이블 생성 → 2. 함수 생성 → 3. 검증

-- ========================================
-- 1단계: 감사 로그 테이블 생성
-- ========================================

-- 기존 테이블이 있다면 삭제 (주의: 데이터 손실)
-- DROP TABLE IF EXISTS public.audit_logs CASCADE;

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    action TEXT NOT NULL,
    user_id TEXT,
    session_id TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    details JSONB,
    ip_address INET,
    user_agent TEXT
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- RLS 정책 설정
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 모든 로그 조회 가능
DROP POLICY IF EXISTS "관리자 로그 조회" ON public.audit_logs;
CREATE POLICY "관리자 로그 조회" ON public.audit_logs
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::TEXT 
            AND users.position IN ('관리자', '팀장')
        )
    );

-- 인증된 사용자는 자신의 로그만 조회 가능
DROP POLICY IF EXISTS "사용자 자신 로그 조회" ON public.audit_logs;
CREATE POLICY "사용자 자신 로그 조회" ON public.audit_logs
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        user_id = auth.uid()::TEXT
    );

-- 함수 실행 시 로그 삽입 허용
DROP POLICY IF EXISTS "로그 삽입 허용" ON public.audit_logs;
CREATE POLICY "로그 삽입 허용" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- 권한 설정
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT INSERT ON public.audit_logs TO authenticated;
GRANT USAGE ON SEQUENCE public.audit_logs_id_seq TO authenticated;

-- ========================================
-- 2단계: 세션 사용자 설정 함수 생성
-- ========================================

-- 기존 함수가 있다면 삭제
DROP FUNCTION IF EXISTS public.set_session_user(TEXT, TEXT);

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

-- ========================================
-- 3단계: 검증 및 확인
-- ========================================

-- 테이블 생성 확인
SELECT '테이블 생성 확인' as step;
SELECT 
    table_name,
    table_type,
    is_insertable_into
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'audit_logs';

-- 함수 존재 확인
SELECT '함수 존재 확인' as step;
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'set_session_user';

-- 권한 확인
SELECT '권한 확인' as step;
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.routine_privileges 
WHERE routine_name = 'set_session_user';

-- RLS 정책 확인
SELECT 'RLS 정책 확인' as step;
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
WHERE tablename = 'audit_logs';

-- 테스트 실행 (선택사항)
-- SELECT '테스트 실행' as step;
-- SELECT set_session_user('test-session-123', 'test-user-456');

SELECT '✅ 세션 설정 완료!' as result;
