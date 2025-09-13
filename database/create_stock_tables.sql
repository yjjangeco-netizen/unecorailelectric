-- 입고/출고 테이블 생성 및 샘플 데이터 삽입

-- 1. 입고 테이블 생성
CREATE TABLE IF NOT EXISTS stock_in (
  id SERIAL PRIMARY KEY,
  item_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 출고 테이블 생성
CREATE TABLE IF NOT EXISTS stock_out (
  id SERIAL PRIMARY KEY,
  item_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  project TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 샘플 입고 데이터 삽입
INSERT INTO stock_in (item_id, quantity, unit_price, notes) VALUES
('41b5461c-f612-48ed-ac74-18431d0bb16c', 50, 150000, '2024년 1분기 입고'),
('1991ca9f-fa1b-4f6f-bf7b-2ce7264bedd9', 30, 80000, '신규 자전거 입고'),
('5b93e959-88d5-40d0-918e-a6859ebfc30a', 200, 5000, '전선 대량 입고');

-- 4. 샘플 출고 데이터 삽입
INSERT INTO stock_out (item_id, quantity, project, notes) VALUES
('41b5461c-f612-48ed-ac74-18431d0bb16c', 15, '사무실 모니터 교체', '2024년 1월 출고'),
('1991ca9f-fa1b-4f6f-bf7b-2ce7264bedd9', 8, '팀원용 자전거', '2024년 2월 출고'),
('5b93e959-88d5-40d0-918e-a6859ebfc30a', 45, '전기공사 현장', '2024년 3월 출고');

-- 5. 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_stock_in_item_id ON stock_in(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_out_item_id ON stock_out(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_in_created_at ON stock_in(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_out_created_at ON stock_out(created_at);

-- 6. 확인용 쿼리
SELECT 
  '입고 데이터' as type,
  COUNT(*) as count
FROM stock_in
UNION ALL
SELECT 
  '출고 데이터' as type,
  COUNT(*) as count
FROM stock_out;
