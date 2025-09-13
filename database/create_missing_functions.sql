-- 누락된 함수와 테이블 생성
-- Supabase SQL Editor에서 실행하세요

-- 1. user_sessions 테이블 생성
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  is_active BOOLEAN DEFAULT true
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- 3. set_session_user 함수 생성
CREATE OR REPLACE FUNCTION set_session_user(
  p_user_id TEXT,
  p_session_token TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
  v_session_token TEXT;
BEGIN
  -- 기존 세션 비활성화
  UPDATE user_sessions 
  SET is_active = false 
  WHERE user_id = p_user_id AND is_active = true;
  
  -- 새 세션 토큰 생성 또는 사용
  IF p_session_token IS NULL THEN
    v_session_token := gen_random_uuid()::TEXT;
  ELSE
    v_session_token := p_session_token;
  END IF;
  
  -- 새 세션 생성
  INSERT INTO user_sessions (user_id, session_token, expires_at)
  VALUES (p_user_id, v_session_token, NOW() + INTERVAL '24 hours')
  ON CONFLICT (session_token) 
  DO UPDATE SET 
    user_id = EXCLUDED.user_id,
    expires_at = EXCLUDED.expires_at,
    is_active = true;
  
  -- 현재 세션 사용자 ID 설정
  PERFORM set_config('app.current_user_id', p_user_id, false);
  
  RETURN v_session_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. get_session_user 함수 생성
CREATE OR REPLACE FUNCTION get_session_user() RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_user_id', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. cleanup_expired_sessions 함수 생성
CREATE OR REPLACE FUNCTION cleanup_expired_sessions() RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions 
  WHERE expires_at < NOW() OR is_active = false;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 권한 부여
GRANT EXECUTE ON FUNCTION set_session_user(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_session_user() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions() TO authenticated;

-- 7. 테이블 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO authenticated;

-- 8. RLS 활성화 (선택사항)
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- 9. RLS 정책 생성
CREATE POLICY "사용자는 자신의 세션만 관리 가능" ON user_sessions
  FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- 10. 테스트용 데이터 삽입 (선택사항)
-- INSERT INTO user_sessions (user_id, session_token) VALUES ('yjjang', 'test-token-123');
