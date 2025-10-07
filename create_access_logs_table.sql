-- 접속 로그 테이블 생성
CREATE TABLE IF NOT EXISTS access_logs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  user_level VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'login', 'logout', 'page_view', 'button_click', 'form_submit', 'file_download', 'file_upload'
  page VARCHAR(255) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_action ON access_logs(action);
CREATE INDEX IF NOT EXISTS idx_access_logs_page ON access_logs(page);

-- 접속 로그 테이블 생성 함수
CREATE OR REPLACE FUNCTION create_access_logs_table_if_not_exists()
RETURNS void AS $$
BEGIN
  -- 테이블이 이미 존재하는지 확인
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'access_logs') THEN
    -- 테이블 생성
    CREATE TABLE access_logs (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      username VARCHAR(255) NOT NULL,
      user_level VARCHAR(50) NOT NULL,
      action VARCHAR(50) NOT NULL,
      page VARCHAR(255) NOT NULL,
      details TEXT,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 인덱스 생성
    CREATE INDEX idx_access_logs_user_id ON access_logs(user_id);
    CREATE INDEX idx_access_logs_created_at ON access_logs(created_at);
    CREATE INDEX idx_access_logs_action ON access_logs(action);
    CREATE INDEX idx_access_logs_page ON access_logs(page);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- RLS 정책 설정
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 접속 로그 조회 가능
CREATE POLICY "관리자만 접속 로그 조회" ON access_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = access_logs.user_id 
      AND (users.level = '5' OR users.level = 'administrator')
    )
  );

-- 모든 사용자가 자신의 로그는 조회 가능
CREATE POLICY "사용자 자신의 로그 조회" ON access_logs
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 모든 사용자가 로그 작성 가능
CREATE POLICY "로그 작성 허용" ON access_logs
  FOR INSERT WITH CHECK (true);
