-- ========================================
-- 누락된 테이블 생성 스크립트
-- ========================================

-- 1단계: stock_in 테이블 생성
SELECT '=== stock_in 테이블 생성 ===' as info;

CREATE TABLE IF NOT EXISTS stock_in (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES items(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(18,2) DEFAULT 0,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  received_by TEXT NOT NULL,
  reason TEXT,
  stock_status TEXT DEFAULT 'new',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2단계: stock_out 테이블 생성
SELECT '=== stock_out 테이블 생성 ===' as info;

CREATE TABLE IF NOT EXISTS stock_out (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES items(id),
  quantity INTEGER NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  issued_by TEXT NOT NULL,
  project TEXT,
  is_rental BOOLEAN DEFAULT false,
  return_date TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3단계: 인덱스 생성
SELECT '=== 인덱스 생성 ===' as info;

CREATE INDEX IF NOT EXISTS idx_stock_in_item ON stock_in(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_in_date ON stock_in(received_at);
CREATE INDEX IF NOT EXISTS idx_stock_out_item ON stock_out(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_out_date ON stock_out(issued_at);

-- 4단계: RLS 정책 설정
SELECT '=== RLS 정책 설정 ===' as info;

ALTER TABLE stock_in ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_out ENABLE ROW LEVEL SECURITY;

-- 임시 읽기 정책 (개발용)
CREATE POLICY "dev_read_anyone" ON stock_in FOR SELECT USING (true);
CREATE POLICY "dev_read_anyone" ON stock_out FOR SELECT USING (true);

-- 5단계: 테이블 생성 확인
SELECT '=== 테이블 생성 확인 ===' as info;

SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name IN ('stock_in', 'stock_out')
ORDER BY table_name;

-- 6단계: 샘플 데이터 삽입 (테스트용)
SELECT '=== 샘플 데이터 삽입 ===' as info;

-- 첫 번째 item에 대한 샘플 입고 데이터
INSERT INTO stock_in (item_id, quantity, unit_price, received_by, reason, note)
SELECT 
  id,
  100,
  unit_price,
  'system',
  '초기 입고',
  '시스템 초기화'
FROM items 
LIMIT 1;

-- 첫 번째 item에 대한 샘플 출고 데이터
INSERT INTO stock_out (item_id, quantity, issued_by, project, note)
SELECT 
  id,
  10,
  'system',
  '테스트 프로젝트',
  '시스템 테스트'
FROM items 
LIMIT 1;

-- 7단계: 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '누락된 테이블 생성 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '- stock_in 테이블 생성';
  RAISE NOTICE '- stock_out 테이블 생성';
  RAISE NOTICE '- 인덱스 및 RLS 정책 설정';
  RAISE NOTICE '- 샘플 데이터 삽입';
  RAISE NOTICE '========================================';
END $$;
