-- 마감 처리 관련 테이블 생성

-- 1. 재고 스냅샷 테이블
CREATE TABLE IF NOT EXISTS stock_snapshot (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period_year INTEGER NOT NULL,
  period_quarter INTEGER CHECK (period_quarter BETWEEN 1 AND 4),
  period_month INTEGER CHECK (period_month BETWEEN 1 AND 12),
  item_id UUID NOT NULL REFERENCES items(id),
  item_product TEXT NOT NULL,
  spec TEXT,
  maker TEXT,
  category TEXT,
  opening_quantity INTEGER DEFAULT 0,
  stock_in_quantity INTEGER DEFAULT 0,
  stock_out_quantity INTEGER DEFAULT 0,
  adjustment_quantity INTEGER DEFAULT 0,
  disposal_quantity INTEGER DEFAULT 0,
  closing_quantity INTEGER NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  total_value DECIMAL(18,2) NOT NULL,
  snapshot_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_by TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 마감 실행 이력 테이블
CREATE TABLE IF NOT EXISTS closing_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period_year INTEGER NOT NULL,
  period_quarter INTEGER,
  period_month INTEGER,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly')),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  total_value DECIMAL(18,2) DEFAULT 0,
  error_message TEXT,
  closed_by TEXT NOT NULL,
  approved_by TEXT,
  can_reopen BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 복합 유니크 제약: 같은 기간에 중복 마감 방지
  CONSTRAINT unique_period_closing UNIQUE (period_year, period_quarter, period_month, period_type)
);

-- 3. 마감 승인 워크플로우 테이블
CREATE TABLE IF NOT EXISTS closing_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  closing_run_id UUID NOT NULL REFERENCES closing_runs(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL,
  approved_by TEXT,
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approval_notes TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_stock_snapshot_period ON stock_snapshot(period_year, period_quarter, period_month);
CREATE INDEX IF NOT EXISTS idx_stock_snapshot_item ON stock_snapshot(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_snapshot_date ON stock_snapshot(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_closing_runs_period ON closing_runs(period_year, period_quarter, period_month);
CREATE INDEX IF NOT EXISTS idx_closing_runs_status ON closing_runs(status);
CREATE INDEX IF NOT EXISTS idx_closing_runs_date ON closing_runs(started_at);

-- RLS 정책 설정
ALTER TABLE stock_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE closing_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE closing_approvals ENABLE ROW LEVEL SECURITY;

-- 관리자만 마감 관련 테이블 접근 가능
CREATE POLICY "관리자만 재고 스냅샷 조회 가능" ON stock_snapshot
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "관리자만 마감 실행 관리 가능" ON closing_runs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "관리자만 마감 승인 관리 가능" ON closing_approvals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- 트리거 함수: 마감 완료 시 자동 알림
CREATE OR REPLACE FUNCTION notify_closing_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO notifications (
      id, user_id, title, message, type, created_at
    ) VALUES (
      gen_random_uuid(), NEW.closed_by, '마감 처리 완료',
      format('%s년 %s분기 마감이 완료되었습니다. 총 %s개 품목, 총액 %s원',
             NEW.period_year, 
             COALESCE(NEW.period_quarter::TEXT, NEW.period_month::TEXT),
             NEW.total_items,
             NEW.total_value::TEXT
      ),
      'success', NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_closing_completion
  AFTER UPDATE ON closing_runs
  FOR EACH ROW
  EXECUTE FUNCTION notify_closing_completion();
