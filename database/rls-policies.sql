-- 유네코레일 전기파트 RLS 정책 및 인덱스 설정
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- 1. RLS 활성화
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_in ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_out ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE disposal ENABLE ROW LEVEL SECURITY;

-- 2. 인덱스 생성 (성능 최적화)
-- 품목 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at);
CREATE INDEX IF NOT EXISTS idx_items_updated_at ON items(updated_at);

-- 재고 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_current_stock_name ON current_stock(name);
CREATE INDEX IF NOT EXISTS idx_current_stock_category ON current_stock(category);
CREATE INDEX IF NOT EXISTS idx_current_stock_status ON current_stock(stock_status);
CREATE INDEX IF NOT EXISTS idx_current_stock_updated_at ON current_stock(updated_at);

-- 입고 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_stock_in_item_id ON stock_in(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_in_received_at ON stock_in(received_at);
CREATE INDEX IF NOT EXISTS idx_stock_in_received_by ON stock_in(received_by);

-- 출고 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_stock_out_item_id ON stock_out(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_out_issued_at ON stock_out(issued_at);
CREATE INDEX IF NOT EXISTS idx_stock_out_issued_by ON stock_out(issued_by);

-- 사용자 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- 폐기 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_disposal_item_id ON disposal(item_id);
CREATE INDEX IF NOT EXISTS idx_disposal_disposed_at ON disposal(disposed_at);
CREATE INDEX IF NOT EXISTS idx_disposal_disposed_by ON disposal(disposed_by);

-- 3. RLS 정책 생성

-- 품목 테이블 정책
CREATE POLICY "모든 인증 사용자가 품목을 조회할 수 있음" ON items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "관리자와 전기팀만 품목을 생성/수정할 수 있음" ON items
  FOR ALL USING (
    auth.role() = 'authenticated' AND (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND (users.is_admin = true OR users.department = '전기팀')
      )
    )
  );

-- 현재 재고 테이블 정책
CREATE POLICY "모든 인증 사용자가 재고를 조회할 수 있음" ON current_stock
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "관리자와 전기팀만 재고를 수정할 수 있음" ON current_stock
  FOR ALL USING (
    auth.role() = 'authenticated' AND (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND (users.is_admin = true OR users.department = '전기팀')
      )
    )
  );

-- 입고 테이블 정책
CREATE POLICY "모든 인증 사용자가 입고 이력을 조회할 수 있음" ON stock_in
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "관리자와 전기팀만 입고를 생성할 수 있음" ON stock_in
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND (users.is_admin = true OR users.department = '전기팀')
      )
    )
  );

-- 출고 테이블 정책
CREATE POLICY "모든 인증 사용자가 출고 이력을 조회할 수 있음" ON stock_out
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "관리자와 전기팀만 출고를 생성할 수 있음" ON stock_out
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND (users.is_admin = true OR users.department = '전기팀')
      )
    )
  );

-- 사용자 테이블 정책
CREATE POLICY "자신의 정보만 조회할 수 있음" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "관리자만 사용자를 관리할 수 있음" ON users
  FOR ALL USING (
    auth.role() = 'authenticated' AND (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.is_admin = true
      )
    )
  );

-- 폐기 테이블 정책
CREATE POLICY "모든 인증 사용자가 폐기 이력을 조회할 수 있음" ON disposal
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "관리자만 폐기를 생성할 수 있음" ON disposal
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.is_admin = true
      )
    )
  );

-- 4. 제약 조건 추가

-- 품목 테이블 제약
ALTER TABLE items ADD CONSTRAINT chk_items_unit_price_positive 
  CHECK (unit_price >= 0);

ALTER TABLE items ADD CONSTRAINT chk_items_min_stock_non_negative 
  CHECK (min_stock >= 0);

-- 재고 테이블 제약
ALTER TABLE current_stock ADD CONSTRAINT chk_current_stock_quantity_non_negative 
  CHECK (current_quantity >= 0);

ALTER TABLE current_stock ADD CONSTRAINT chk_current_stock_unit_price_positive 
  CHECK (unit_price >= 0);

-- 입고 테이블 제약
ALTER TABLE stock_in ADD CONSTRAINT chk_stock_in_quantity_positive 
  CHECK (quantity > 0);

ALTER TABLE stock_in ADD CONSTRAINT chk_stock_in_unit_price_non_negative 
  CHECK (unit_price >= 0);

-- 출고 테이블 제약
ALTER TABLE stock_out ADD CONSTRAINT chk_stock_out_quantity_positive 
  CHECK (quantity > 0);

-- 5. 트리거 함수 생성 (재고 자동 업데이트)

-- 입고 시 재고 자동 증가
CREATE OR REPLACE FUNCTION update_stock_on_in()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE current_stock 
  SET 
    current_quantity = current_quantity + NEW.quantity,
    total_amount = (current_quantity + NEW.quantity) * unit_price,
    updated_at = NOW()
  WHERE id = NEW.item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 출고 시 재고 자동 감소
CREATE OR REPLACE FUNCTION update_stock_on_out()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE current_stock 
  SET 
    current_quantity = GREATEST(0, current_quantity - NEW.quantity),
    total_amount = GREATEST(0, current_quantity - NEW.quantity) * unit_price,
    updated_at = NOW()
  WHERE id = NEW.item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 트리거 생성

-- 입고 트리거
DROP TRIGGER IF EXISTS trigger_stock_in ON stock_in;
CREATE TRIGGER trigger_stock_in
  AFTER INSERT ON stock_in
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_in();

-- 출고 트리거
DROP TRIGGER IF EXISTS trigger_stock_out ON stock_out;
CREATE TRIGGER trigger_stock_out
  AFTER INSERT ON stock_out
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_out();

-- 7. 감사 로그 테이블 생성

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- 감사 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id ON audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON audit_log(changed_at);

-- 감사 로그 RLS 정책
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "관리자만 감사 로그를 조회할 수 있음" ON audit_log
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.is_admin = true
      )
    )
  );

-- 8. 성능 최적화 뷰 생성

-- 재고 현황 뷰 (자주 조회되는 데이터)
CREATE OR REPLACE VIEW stock_summary AS
SELECT 
  cs.id,
  cs.name,
  cs.specification,
  cs.category,
  cs.current_quantity,
  cs.unit_price,
  cs.total_amount,
  cs.stock_status,
  cs.updated_at,
  COUNT(si.id) as total_in_count,
  COUNT(so.id) as total_out_count,
  COALESCE(SUM(si.quantity), 0) as total_in_quantity,
  COALESCE(SUM(so.quantity), 0) as total_out_quantity
FROM current_stock cs
LEFT JOIN stock_in si ON cs.id = si.item_id
LEFT JOIN stock_out so ON cs.id = so.item_id
GROUP BY cs.id, cs.name, cs.specification, cs.category, cs.current_quantity, cs.unit_price, cs.total_amount, cs.stock_status, cs.updated_at;

-- 뷰에 대한 RLS 정책
CREATE POLICY "모든 인증 사용자가 재고 요약을 조회할 수 있음" ON stock_summary
  FOR SELECT USING (auth.role() = 'authenticated');

-- 9. 통계 함수 생성

-- 월별 입출고 통계
CREATE OR REPLACE FUNCTION get_monthly_stock_stats(year_param INTEGER, month_param INTEGER)
RETURNS TABLE (
  item_name TEXT,
  in_quantity BIGINT,
  out_quantity BIGINT,
  net_change BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.name,
    COALESCE(SUM(si.quantity), 0) as in_quantity,
    COALESCE(SUM(so.quantity), 0) as out_quantity,
    COALESCE(SUM(si.quantity), 0) - COALESCE(SUM(so.quantity), 0) as net_change
  FROM current_stock cs
  LEFT JOIN stock_in si ON cs.id = si.item_id 
    AND EXTRACT(YEAR FROM si.received_at) = year_param
    AND EXTRACT(MONTH FROM si.received_at) = month_param
  LEFT JOIN stock_out so ON cs.id = so.item_id 
    AND EXTRACT(YEAR FROM so.issued_at) = year_param
    AND EXTRACT(MONTH FROM so.issued_at) = month_param
  GROUP BY cs.id, cs.name
  ORDER BY cs.name;
END;
$$ LANGUAGE plpgsql;

-- 10. 권한 설정

-- 인증된 사용자에게 기본 권한 부여
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 관리자 권한 (필요시 별도 설정)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- 11. 설정 확인 쿼리

-- RLS 활성화 상태 확인
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('items', 'current_stock', 'stock_in', 'stock_out', 'users', 'disposal', 'audit_log');

-- 정책 확인
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
WHERE tablename IN ('items', 'current_stock', 'stock_in', 'stock_out', 'users', 'disposal', 'audit_log');

-- 인덱스 확인
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('items', 'current_stock', 'stock_in', 'stock_out', 'users', 'disposal', 'audit_log')
ORDER BY tablename, indexname;

-- Row Level Security (RLS) 정책 설정
-- 모든 테이블에 RLS 활성화 및 정책 적용

-- 1. 사용자 테이블 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 정보만 조회/수정 가능
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 관리자는 모든 사용자 정보 조회/수정 가능
CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2. 품목 테이블 RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자는 품목 조회 가능
CREATE POLICY "Authenticated users can view items" ON items
  FOR SELECT USING (auth.role() = 'authenticated');

-- 관리자/매니저만 품목 생성/수정/삭제 가능
CREATE POLICY "Managers can manage items" ON items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- 3. 재고 입고 테이블 RLS
ALTER TABLE stock_in ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자는 입고 내역 조회 가능
CREATE POLICY "Authenticated users can view stock in" ON stock_in
  FOR SELECT USING (auth.role() = 'authenticated');

-- 관리자/매니저만 입고 처리 가능
CREATE POLICY "Managers can create stock in" ON stock_in
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- 입고자는 자신이 생성한 입고 내역만 수정 가능
CREATE POLICY "Users can update own stock in" ON stock_in
  FOR UPDATE USING (
    received_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- 4. 재고 출고 테이블 RLS
ALTER TABLE stock_out ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자는 출고 내역 조회 가능
CREATE POLICY "Authenticated users can view stock out" ON stock_out
  FOR SELECT USING (auth.role() = 'authenticated');

-- 관리자/매니저만 출고 처리 가능
CREATE POLICY "Managers can create stock out" ON stock_out
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- 출고자는 자신이 처리한 출고 내역만 수정 가능
CREATE POLICY "Users can update own stock out" ON stock_out
  FOR UPDATE USING (
    issued_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- 5. 현재 재고 테이블 RLS
ALTER TABLE current_stock ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자는 현재 재고 조회 가능
CREATE POLICY "Authenticated users can view current stock" ON current_stock
  FOR SELECT USING (auth.role() = 'authenticated');

-- 관리자/매니저만 재고 조정 가능
CREATE POLICY "Managers can adjust stock" ON current_stock
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- 6. 재고 이력 테이블 RLS
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자는 재고 이력 조회 가능
CREATE POLICY "Authenticated users can view stock history" ON stock_history
  FOR SELECT USING (auth.role() = 'authenticated');

-- 시스템만 이력 생성 가능 (트리거를 통해서만)
CREATE POLICY "System can create stock history" ON stock_history
  FOR INSERT WITH CHECK (false);

-- 7. 폐기 테이블 RLS
ALTER TABLE disposal ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자는 폐기 내역 조회 가능
CREATE POLICY "Authenticated users can view disposal" ON disposal
  FOR SELECT USING (auth.role() = 'authenticated');

-- 관리자만 폐기 처리 가능
CREATE POLICY "Admins can create disposal" ON disposal
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 8. 대여 테이블 RLS
ALTER TABLE rental ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자는 대여 내역 조회 가능
CREATE POLICY "Authenticated users can view rental" ON rental
  FOR SELECT USING (auth.role() = 'authenticated');

-- 관리자/매니저만 대여 처리 가능
CREATE POLICY "Managers can manage rental" ON rental
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- 9. 감사 로그 테이블 RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 감사 로그 조회 가능
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 시스템만 감사 로그 생성 가능
CREATE POLICY "System can create audit logs" ON audit_logs
  FOR INSERT WITH CHECK (false);

-- 10. 분기 마감 스냅샷 테이블 RLS
ALTER TABLE closing_snapshot ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자는 마감 스냅샷 조회 가능
CREATE POLICY "Authenticated users can view closing snapshot" ON closing_snapshot
  FOR SELECT USING (auth.role() = 'authenticated');

-- 관리자만 마감 스냅샷 생성 가능
CREATE POLICY "Admins can create closing snapshot" ON closing_snapshot
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 11. 사용자 그룹 테이블 RLS
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자는 그룹 정보 조회 가능
CREATE POLICY "Authenticated users can view user groups" ON user_groups
  FOR SELECT USING (auth.role() = 'authenticated');

-- 관리자만 그룹 관리 가능
CREATE POLICY "Admins can manage user groups" ON user_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 12. 사용자 그룹 멤버 테이블 RLS
ALTER TABLE user_group_members ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자는 그룹 멤버 정보 조회 가능
CREATE POLICY "Authenticated users can view group members" ON user_group_members
  FOR SELECT USING (auth.role() = 'authenticated');

-- 관리자만 그룹 멤버 관리 가능
CREATE POLICY "Admins can manage group members" ON user_group_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 13. 시스템 설정 테이블 RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자는 시스템 설정 조회 가능
CREATE POLICY "Authenticated users can view system settings" ON system_settings
  FOR SELECT USING (auth.role() = 'authenticated');

-- 관리자만 시스템 설정 수정 가능
CREATE POLICY "Admins can modify system settings" ON system_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 14. 알림 테이블 RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 알림만 조회/수정 가능
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- 시스템만 알림 생성 가능
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (false);

-- 15. 파일 첨부 테이블 RLS
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자는 파일 첨부 조회 가능
CREATE POLICY "Authenticated users can view file attachments" ON file_attachments
  FOR SELECT USING (auth.role() = 'authenticated');

-- 파일 업로더와 관리자만 파일 관리 가능
CREATE POLICY "Users can manage own files" ON file_attachments
  FOR ALL USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 16. 작업 일지 테이블 RLS
ALTER TABLE work_diary ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 작업 일지만 조회/수정 가능
CREATE POLICY "Users can view own work diary" ON work_diary
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own work diary" ON work_diary
  FOR ALL USING (user_id = auth.uid());

-- 관리자는 모든 작업 일지 조회 가능
CREATE POLICY "Admins can view all work diary" ON work_diary
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 17. 프로젝트 테이블 RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자는 프로젝트 정보 조회 가능
CREATE POLICY "Authenticated users can view projects" ON projects
  FOR SELECT USING (auth.role() = 'authenticated');

-- 관리자/매니저만 프로젝트 관리 가능
CREATE POLICY "Managers can manage projects" ON projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- 18. 공급업체 테이블 RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자는 공급업체 정보 조회 가능
CREATE POLICY "Authenticated users can view suppliers" ON suppliers
  FOR SELECT USING (auth.role() = 'authenticated');

-- 관리자/매니저만 공급업체 관리 가능
CREATE POLICY "Managers can manage suppliers" ON suppliers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- 19. 카테고리 테이블 RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자는 카테고리 정보 조회 가능
CREATE POLICY "Authenticated users can view categories" ON categories
  FOR SELECT USING (auth.role() = 'authenticated');

-- 관리자만 카테고리 관리 가능
CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 20. 시스템 로그 테이블 RLS
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 시스템 로그 조회 가능
CREATE POLICY "Admins can view system logs" ON system_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 시스템만 시스템 로그 생성 가능
CREATE POLICY "System can create system logs" ON system_logs
  FOR INSERT WITH CHECK (false);

-- RLS 정책 확인을 위한 뷰 생성
CREATE OR REPLACE VIEW rls_policy_status AS
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
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- RLS 활성화 상태 확인을 위한 뷰 생성
CREATE OR REPLACE VIEW rls_enabled_tables AS
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true
ORDER BY tablename;
