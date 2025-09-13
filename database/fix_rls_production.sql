-- 장기적 해결책: 권한 기반 RLS 정책 구현 (disposal 포함)
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- 1. 기존 RLS 정책 정리
DROP POLICY IF EXISTS "모든 인증 사용자가 품목을 조회할 수 있음" ON items;
DROP POLICY IF EXISTS "관리자와 전기팀만 품목을 생성/수정할 수 있음" ON items;
DROP POLICY IF EXISTS "모든 인증 사용자가 재고를 조회할 수 있음" ON current_stock;
DROP POLICY IF EXISTS "관리자와 전기팀만 재고를 수정할 수 있음" ON current_stock;
DROP POLICY IF EXISTS "모든 인증 사용자가 입고 이력을 조회할 수 있음" ON stock_in;
DROP POLICY IF EXISTS "관리자와 전기팀만 입고를 생성할 수 있음" ON stock_in;
DROP POLICY IF EXISTS "모든 인증 사용자가 출고 이력을 조회할 수 있음" ON stock_out;
DROP POLICY IF EXISTS "관리자와 전기팀만 출고를 생성할 수 있음" ON stock_out;
DROP POLICY IF EXISTS "자신의 정보만 조회할 수 있음" ON users;
DROP POLICY IF EXISTS "관리자만 사용자를 관리할 수 있음" ON users;
DROP POLICY IF EXISTS "모든 인증 사용자가 폐기 이력을 조회할 수 있음" ON disposal;
DROP POLICY IF EXISTS "관리자만 폐기를 생성할 수 있음" ON disposal;

-- 2. disposal 테이블이 없는 경우 생성
CREATE TABLE IF NOT EXISTS disposal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  disposed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  disposed_by TEXT NOT NULL,
  reason TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. disposal 테이블에 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_disposal_item_id ON disposal(item_id);
CREATE INDEX IF NOT EXISTS idx_disposal_disposed_at ON disposal(disposed_at);
CREATE INDEX IF NOT EXISTS idx_disposal_disposed_by ON disposal(disposed_by);

-- 4. 권한 확인을 위한 핵심 함수들 생성

-- 사용자 권한 확인 함수 (기본)
CREATE OR REPLACE FUNCTION check_user_permission(
  user_id TEXT,
  required_permission TEXT DEFAULT 'level1'
) RETURNS BOOLEAN AS $$
BEGIN
  -- 사용자 권한 확인
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = user_id 
    AND (
      users.permissions @> ARRAY[required_permission]::TEXT[] 
      OR users.permissions @> ARRAY['administrator']::TEXT[]
      OR users.department = '전기팀'
    )
    AND users.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 부서별 접근 권한 확인 함수
CREATE OR REPLACE FUNCTION check_department_access(
  user_id TEXT,
  required_department TEXT DEFAULT '전기팀'
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = user_id 
    AND (
      users.department = required_department
      OR users.permissions @> ARRAY['administrator']::TEXT[]
    )
    AND users.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자 본인 확인 함수
CREATE OR REPLACE FUNCTION check_self_access(
  user_id TEXT,
  target_user_id TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_id = target_user_id OR 
         EXISTS (
           SELECT 1 FROM users 
           WHERE users.id = user_id 
           AND users.permissions @> ARRAY['administrator']::TEXT[]
         );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 새로운 권한 기반 RLS 정책 생성

-- 품목 테이블 정책
CREATE POLICY "품목_조회_권한" ON items
  FOR SELECT USING (
    check_user_permission(
      current_setting('app.current_user_id', true),
      'level1'
    )
  );

CREATE POLICY "품목_생성수정_권한" ON items
  FOR ALL USING (
    check_user_permission(
      current_setting('app.current_user_id', true),
      'level2'
    )
  );

-- 현재 재고 테이블 정책
CREATE POLICY "재고_조회_권한" ON current_stock
  FOR SELECT USING (
    check_user_permission(
      current_setting('app.current_user_id', true),
      'level1'
    )
  );

CREATE POLICY "재고_수정_권한" ON current_stock
  FOR ALL USING (
    check_user_permission(
      current_setting('app.current_user_id', true),
      'level2'
    )
  );

-- 입고 테이블 정책
CREATE POLICY "입고_조회_권한" ON stock_in
  FOR SELECT USING (
    check_user_permission(
      current_setting('app.current_user_id', true),
      'level1'
    )
  );

CREATE POLICY "입고_생성_권한" ON stock_in
  FOR INSERT WITH CHECK (
    check_user_permission(
      current_setting('app.current_user_id', true),
      'level2'
    )
  );

-- 출고 테이블 정책
CREATE POLICY "출고_조회_권한" ON stock_out
  FOR SELECT USING (
    check_user_permission(
      current_setting('app.current_user_id', true),
      'level1'
    )
  );

CREATE POLICY "출고_생성_권한" ON stock_out
  FOR INSERT WITH CHECK (
    check_user_permission(
      current_setting('app.current_user_id', true),
      'level2'
    )
  );

-- 사용자 테이블 정책
CREATE POLICY "사용자_본인조회_권한" ON users
  FOR SELECT USING (
    check_self_access(
      current_setting('app.current_user_id', true),
      id
    )
  );

CREATE POLICY "사용자_관리_권한" ON users
  FOR ALL USING (
    check_user_permission(
      current_setting('app.current_user_id', true),
      'administrator'
    )
  );

-- 폐기 테이블 정책
CREATE POLICY "폐기_조회_권한" ON disposal
  FOR SELECT USING (
    check_user_permission(
      current_setting('app.current_user_id', true),
      'level1'
    )
  );

CREATE POLICY "폐기_생성_권한" ON disposal
  FOR INSERT WITH CHECK (
    check_user_permission(
      current_setting('app.current_user_id', true),
      'level3'
    )
  );

-- 6. 애플리케이션에서 사용자 ID 설정을 위한 함수
CREATE OR REPLACE FUNCTION set_current_user_id(user_id TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 세션별 사용자 ID 저장을 위한 임시 테이블
CREATE TEMP TABLE IF NOT EXISTS session_users (
  session_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 세션 사용자 ID 설정 함수
CREATE OR REPLACE FUNCTION set_session_user(
  session_id TEXT,
  user_id TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO session_users (session_id, user_id)
  VALUES (session_id, user_id)
  ON CONFLICT (session_id) 
  DO UPDATE SET user_id = EXCLUDED.user_id, created_at = NOW();
  
  PERFORM set_config('app.current_user_id', user_id, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 세션 사용자 ID 조회 함수
CREATE OR REPLACE FUNCTION get_session_user(session_id TEXT)
RETURNS TEXT AS $$
DECLARE
  user_id TEXT;
BEGIN
  SELECT su.user_id INTO user_id
  FROM session_users su
  WHERE su.session_id = session_id
  AND su.created_at > NOW() - INTERVAL '24 hours';
  
  IF user_id IS NOT NULL THEN
    PERFORM set_config('app.current_user_id', user_id, false);
  END IF;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 세션 정리 함수 (24시간 이상 된 세션 삭제)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM session_users 
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. RLS 활성화 확인 (모든 테이블)
DO $$
BEGIN
  -- RLS가 활성화되어 있는지 확인하고 활성화
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'items' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE items ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'current_stock' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE current_stock ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'stock_in' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE stock_in ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'stock_out' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE stock_out ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'users' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'disposal' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE disposal ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 12. 성공 메시지
SELECT '권한 기반 RLS 정책이 성공적으로 적용되었습니다! (disposal 포함)' as result;
