-- 간단한 재고 관리 시스템 - 1개 DB 통합 구조
-- 각 테이블이 독립적으로 작동, 복잡한 관계 없음
-- 통일된 컬럼명 사용 (name, specification, maker, location, note)

-- 1. 현재 재고 테이블 (메인)
CREATE TABLE IF NOT EXISTS Current_Stock (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,                    -- 품목명 (통일: name)
  specification TEXT,                     -- 규격 (통일: specification)
  maker TEXT,                            -- 제조사
  location TEXT,                          -- 위치
  note TEXT,                              -- 비고 (통일: note)
  status TEXT DEFAULT 'active',           -- 상태
  in_data INTEGER DEFAULT 0,              -- 입고수량
  out_data INTEGER DEFAULT 0,             -- 출고수량
  plus_data INTEGER DEFAULT 0,            -- 증가수량
  minus_data INTEGER DEFAULT 0,           -- 감소수량
  disposal_qunty INTEGER DEFAULT 0,       -- 폐기수량
  total_qunty INTEGER DEFAULT 0,          -- 총수량
  unit_price DECIMAL(15,2) DEFAULT 0,     -- 단가
  stock_status TEXT DEFAULT 'new',        -- 재고상태
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 입고 테이블
CREATE TABLE IF NOT EXISTS Stock_In (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,                     -- 품목명 (통일: name)
  specification TEXT,                      -- 규격 (통일: specification)
  maker TEXT,                             -- 제조사
  location TEXT,                           -- 위치
  note TEXT,                               -- 비고 (통일: note)
  status TEXT DEFAULT 'active',            -- 상태
  quantity INTEGER NOT NULL,               -- 수량 (통일: quantity)
  unit_price DECIMAL(15,2) DEFAULT 0,      -- 단가 (통일: unit_price)
  stock_status TEXT DEFAULT 'new',         -- 재고상태
  reason TEXT,                             -- 입고사유
  received_at TIMESTAMPTZ DEFAULT NOW(),   -- 입고일
  received_by TEXT DEFAULT 'system',       -- 입고자
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 출고 테이블
CREATE TABLE IF NOT EXISTS Stock_Out (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,                      -- 품목명 (통일: name)
  specification TEXT,                       -- 규격 (통일: specification)
  maker TEXT,                              -- 제조사
  location TEXT,                            -- 위치
  note TEXT,                                -- 비고 (통일: note)
  status TEXT DEFAULT 'active',             -- 상태
  quantity INTEGER NOT NULL,                -- 수량 (통일: quantity)
  unit_price DECIMAL(15,2) DEFAULT 0,       -- 단가 (통일: unit_price)
  stock_status TEXT DEFAULT 'new',          -- 재고상태
  project TEXT,                             -- 프로젝트
  is_rental BOOLEAN DEFAULT FALSE,          -- 대여여부
  return_date TIMESTAMPTZ,                  -- 반납일
  issued_at TIMESTAMPTZ DEFAULT NOW(),      -- 출고일
  issued_by TEXT DEFAULT 'system',          -- 출고자
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 폐기 테이블
CREATE TABLE IF NOT EXISTS Disposal (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,                       -- 품목명 (통일: name)
  specification TEXT,                        -- 규격 (통일: specification)
  maker TEXT,                               -- 제조사
  location TEXT,                             -- 위치
  note TEXT,                                 -- 비고 (통일: note)
  status TEXT DEFAULT 'active',              -- 상태
  quantity INTEGER NOT NULL,                 -- 폐기수량 (통일: quantity)
  disposal_reason TEXT,                      -- 폐기사유
  disposal_date TIMESTAMPTZ DEFAULT NOW(),   -- 폐기일
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_current_stock_name ON Current_Stock(name);
CREATE INDEX IF NOT EXISTS idx_current_stock_specification ON Current_Stock(specification);
CREATE INDEX IF NOT EXISTS idx_stock_in_name ON Stock_In(name);
CREATE INDEX IF NOT EXISTS idx_stock_in_date ON Stock_In(received_at);
CREATE INDEX IF NOT EXISTS idx_stock_out_name ON Stock_Out(name);
CREATE INDEX IF NOT EXISTS idx_stock_out_date ON Stock_Out(issued_at);
CREATE INDEX IF NOT EXISTS idx_disposal_name ON Disposal(name);
CREATE INDEX IF NOT EXISTS idx_disposal_date ON Disposal(disposal_date);

-- 샘플 데이터 삽입
INSERT INTO Current_Stock (name, specification, maker, location, note, status, in_data, total_qunty, unit_price) VALUES
('전선 (2.0SQ)', '2.0SQ', 'LS전선', '창고A', '전기 배선용', 'active', 100, 100, 1500),
('모니터', '24인치', '삼성', '창고B', '사무용', 'active', 5, 5, 250000),
('자전거', '88', '대림', '창고C', '운송용', 'active', 3, 3, 150000);

-- RLS 정책 설정 (간단하게)
ALTER TABLE Current_Stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE Stock_In ENABLE ROW LEVEL SECURITY;
ALTER TABLE Stock_Out ENABLE ROW LEVEL SECURITY;
ALTER TABLE Disposal ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능 (개발용)
CREATE POLICY "dev_read_anyone" ON Current_Stock FOR SELECT USING (true);
CREATE POLICY "dev_read_anyone" ON Stock_In FOR SELECT USING (true);
CREATE POLICY "dev_read_anyone" ON Stock_Out FOR SELECT USING (true);
CREATE POLICY "dev_read_anyone" ON Disposal FOR SELECT USING (true);

-- 모든 사용자가 쓰기 가능 (개발용)
CREATE POLICY "dev_write_anyone" ON Current_Stock FOR ALL USING (true);
CREATE POLICY "dev_write_anyone" ON Stock_In FOR ALL USING (true);
CREATE POLICY "dev_write_anyone" ON Stock_Out FOR ALL USING (true);
CREATE POLICY "dev_write_anyone" ON Disposal FOR ALL USING (true);
