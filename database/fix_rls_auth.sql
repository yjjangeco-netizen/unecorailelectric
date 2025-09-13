-- RLS 정책을 커스텀 인증 시스템에 맞게 수정
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- 1. 기존 RLS 정책 삭제
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

-- 2. 새로운 RLS 정책 생성 (커스텀 인증 시스템용)

-- 품목 테이블 정책 - 모든 사용자 접근 허용 (임시)
CREATE POLICY "모든 사용자가 품목에 접근할 수 있음" ON items
  FOR ALL USING (true);

-- 현재 재고 테이블 정책 - 모든 사용자 접근 허용 (임시)
CREATE POLICY "모든 사용자가 재고에 접근할 수 있음" ON current_stock
  FOR ALL USING (true);

-- 입고 테이블 정책 - 모든 사용자 접근 허용 (임시)
CREATE POLICY "모든 사용자가 입고에 접근할 수 있음" ON stock_in
  FOR ALL USING (true);

-- 출고 테이블 정책 - 모든 사용자 접근 허용 (임시)
CREATE POLICY "모든 사용자가 출고에 접근할 수 있음" ON stock_out
  FOR ALL USING (true);

-- 사용자 테이블 정책 - 모든 사용자 접근 허용 (임시)
CREATE POLICY "모든 사용자가 사용자 정보에 접근할 수 있음" ON users
  FOR ALL USING (true);

-- 폐기 테이블 정책 - 모든 사용자 접근 허용 (임시)
CREATE POLICY "모든 사용자가 폐기에 접근할 수 있음" ON disposal
  FOR ALL USING (true);

-- 3. RLS 비활성화 (개발 단계에서만)
-- ALTER TABLE items DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE current_stock DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE stock_in DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE stock_out DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE disposal DISABLE ROW LEVEL SECURITY;

-- 4. 권한 확인을 위한 함수 생성
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
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 권한 기반 RLS 정책 (향후 사용)
-- CREATE POLICY "권한 기반 품목 접근" ON items
--   FOR ALL USING (
--     check_user_permission(
--       current_setting('app.current_user_id', true),
--       'level2'
--     )
--   );
