-- 테이블 구조를 올바르게 정리 (정규화)

-- 1. items 테이블만 품목 기본 정보 보관
DROP TABLE IF EXISTS items CASCADE;
CREATE TABLE items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product TEXT NOT NULL,           -- 품명
  spec TEXT,                       -- 규격
  maker TEXT,                      -- 제조사
  unit_price DECIMAL(15,2) DEFAULT 0,  -- 단가
  purpose TEXT,                    -- 용도
  min_stock INTEGER DEFAULT 0,     -- 최소재고
  category TEXT,                   -- 분류
  note TEXT,                       -- 비고
  stock_status TEXT DEFAULT 'new', -- 재고현황: new/almostnew/used/breakdown
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. current_stock은 items와 연결된 현재 재고만 보관
DROP TABLE IF EXISTS current_stock CASCADE;
CREATE TABLE current_stock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  current_quantity INTEGER DEFAULT 0,  -- 현재수량
  location TEXT,                   -- 재고위치
  note TEXT,                       -- 비고
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. stock_in은 items와 연결된 입고 이력만 보관
DROP TABLE IF EXISTS stock_in CASCADE;
CREATE TABLE stock_in (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,       -- 수량
  unit_price DECIMAL(15,2) DEFAULT 0,  -- 입고 단가
  total_amount DECIMAL(18,2) DEFAULT 0, -- 합계
  received_at TIMESTAMPTZ DEFAULT NOW(), -- 입고일
  received_by TEXT NOT NULL,       -- 입고자
  reason TEXT,                     -- 입고사유
  stock_status TEXT DEFAULT 'new', -- 재고현황
  note TEXT,                       -- 비고
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. stock_out은 items와 연결된 출고 이력만 보관
DROP TABLE IF EXISTS stock_out CASCADE;
CREATE TABLE stock_out (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,       -- 수량
  issued_at TIMESTAMPTZ DEFAULT NOW(), -- 출고일
  issued_by TEXT NOT NULL,         -- 출고자
  project TEXT,                    -- 프로젝트
  is_rental BOOLEAN DEFAULT false, -- 대여여부
  return_date TIMESTAMPTZ,         -- 반납일
  note TEXT,                       -- 비고
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_items_product ON items(product);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_current_stock_item ON current_stock(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_in_item ON stock_in(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_in_date ON stock_in(received_at);
CREATE INDEX IF NOT EXISTS idx_stock_out_item ON stock_out(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_out_date ON stock_out(issued_at);

-- 6. RLS 정책 설정 (임시로 읽기 허용)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_in ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_out ENABLE ROW LEVEL SECURITY;

-- 임시 읽기 정책 (개발용 - 운영 전 철회 필수)
CREATE POLICY "dev_read_anyone" ON items FOR SELECT USING (true);
CREATE POLICY "dev_read_anyone" ON current_stock FOR SELECT USING (true);
CREATE POLICY "dev_read_anyone" ON stock_in FOR SELECT USING (true);
CREATE POLICY "dev_read_anyone" ON stock_out FOR SELECT USING (true);

-- 7. 샘플 데이터 삽입
INSERT INTO items (product, spec, maker, unit_price, purpose, min_stock, category, stock_status, note) VALUES
('전선 (2.0SQ)', '2.0SQ', 'LS전선', 1500, '전기 배선용', 50, '전선', 'new', '전기 배선 공사용'),
('차단기 (20A)', '20A', 'LS산전', 25000, '전기 차단용', 15, '차단기', 'new', '전기 차단 보호용'),
('콘센트 (220V)', '220V 15A', 'LS산전', 8000, '전기 콘센트', 30, '콘센트', 'new', '전기 콘센트 설치용'),
('케이블 (3m)', '3m', '유니코', 5000, '설치용', 100, '케이블', 'new', '설치 공사용'),
('모니터 (24인치)', '24인치', 'LG', 300000, '업무용', 5, '전자기기', 'new', '업무용 모니터');

-- 8. current_stock에 연결된 데이터 (items의 기본 정보는 JOIN으로 가져옴)
INSERT INTO current_stock (item_id, current_quantity, location, note)
SELECT 
  i.id, 
  FLOOR(RANDOM() * 100 + 10), -- 10~109 사이의 랜덤 수량
  CASE 
    WHEN i.category = '전선' THEN 'A-01'
    WHEN i.category = '차단기' THEN 'B-02'
    WHEN i.category = '콘센트' THEN 'C-03'
    WHEN i.category = '케이블' THEN 'A-04'
    WHEN i.category = '전자기기' THEN 'D-01'
    ELSE 'G-01'
  END,
  i.note
FROM items i;

-- 9. stock_in에 샘플 입고 데이터
INSERT INTO stock_in (item_id, quantity, unit_price, total_amount, received_by, reason, stock_status, note)
SELECT 
  i.id,
  FLOOR(RANDOM() * 50 + 10), -- 10~59 사이의 랜덤 수량
  i.unit_price,
  i.unit_price * FLOOR(RANDOM() * 50 + 10),
  CASE FLOOR(RANDOM() * 3)
    WHEN 0 THEN '김철수'
    WHEN 1 THEN '이영희'
    ELSE '박민수'
  END,
  CASE FLOOR(RANDOM() * 3)
    WHEN 0 THEN '신규 구매'
    WHEN 1 THEN '재고 보충'
    ELSE '프로젝트용'
  END,
  i.stock_status,
  '샘플 입고 데이터'
FROM items i
LIMIT 3;

-- 10. stock_out에 샘플 출고 데이터
INSERT INTO stock_out (item_id, quantity, issued_by, project, note)
SELECT 
  i.id,
  FLOOR(RANDOM() * 20 + 5), -- 5~24 사이의 랜덤 수량
  CASE FLOOR(RANDOM() * 3)
    WHEN 0 THEN '김철수'
    WHEN 1 THEN '이영희'
    ELSE '박민수'
  END,
  CASE FLOOR(RANDOM() * 3)
    WHEN 0 THEN 'A동 공사'
    WHEN 1 THEN 'B동 공사'
    ELSE 'C동 공사'
  END,
  '샘플 출고 데이터'
FROM items i
LIMIT 2;

-- 11. 결과 확인 (JOIN으로 연결된 데이터 확인)
SELECT 
  'items' as table_name, 
  COUNT(*) as record_count 
FROM items
UNION ALL
SELECT 'current_stock', COUNT(*) FROM current_stock
UNION ALL
SELECT 'stock_in', COUNT(*) FROM stock_in
UNION ALL
SELECT 'stock_out', COUNT(*) FROM stock_out;

-- 12. JOIN으로 연결된 재고 현황 확인
SELECT 
  i.product,
  i.spec,
  i.maker,
  i.category,
  cs.current_quantity,
  cs.location,
  i.unit_price,
  (i.unit_price * cs.current_quantity) as total_amount
FROM items i
JOIN current_stock cs ON i.id = cs.item_id
ORDER BY i.product;
