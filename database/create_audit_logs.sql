-- 감사 로그 테이블 생성
-- Supabase SQL 편집기에서 실행하세요

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
CREATE POLICY "사용자 자신 로그 조회" ON public.audit_logs
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        user_id = auth.uid()::TEXT
    );

-- 함수 실행 시 로그 삽입 허용
CREATE POLICY "로그 삽입 허용" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- 권한 설정
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT INSERT ON public.audit_logs TO authenticated;
GRANT USAGE ON SEQUENCE public.audit_logs_id_seq TO authenticated;

-- 테이블 생성 확인
SELECT 
    table_name,
    table_type,
    is_insertable_into,
    is_typed
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'audit_logs';
