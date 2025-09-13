-- 제품 관련 모든 테이블을 통일된 컬럼명으로 재생성

-- 1. items 테이블 재생성
DROP TABLE IF EXISTS items CASCADE;
CREATE TABLE items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product TEXT NOT NULL,           -- 품명 (기존: name)
  spec TEXT,                       -- 규격 (기존: specification)
  maker TEXT,                      -- 제조사
  unit_price DECIMAL(15,2) DEFAULT 0,  -- 단가
  purpose TEXT,                    -- 용도
  min_stock INTEGER DEFAULT 0,     -- 최소재고
  category TEXT,                   -- 분류
  note TEXT,                       -- 비고 (기존: notes)
  stock_status TEXT DEFAULT 'new', -- 재고현황: new/almostnew/used/breakdown
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. current_stock 테이블 재생성
DROP TABLE IF EXISTS current_stock CASCADE;
CREATE TABLE current_stock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES items(id),
  product TEXT NOT NULL,           -- 품명 (기존: name)
  spec TEXT,                       -- 규격 (기존: specification)
  maker TEXT,                      -- 제조사
  category TEXT,                   -- 분류
  current_quantity INTEGER DEFAULT 0,  -- 현재수량
  unit_price DECIMAL(15,2) DEFAULT 0,  -- 단가
  total_amount DECIMAL(18,2) DEFAULT 0, -- 합계
  location TEXT,                   -- 재고위치
  note TEXT,                       -- 비고 (기존: notes)
  stock_status TEXT DEFAULT 'new', -- 재고현황: new/almostnew/used/breakdown
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. stock_in 테이블 재생성
DROP TABLE IF EXISTS stock_in CASCADE;
CREATE TABLE stock_in (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES items(id),
  quantity INTEGER NOT NULL,       -- 수량
  unit_price DECIMAL(15,2) DEFAULT 0,  -- 단가
  total_amount DECIMAL(18,2) DEFAULT 0, -- 합계
  received_at TIMESTAMPTZ DEFAULT NOW(), -- 입고일
  received_by TEXT NOT NULL,       -- 입고자
  reason TEXT,                     -- 입고사유
  stock_status TEXT DEFAULT 'new', -- 재고현황: new/almostnew/used/breakdown
  note TEXT,                       -- 비고 (기존: notes)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. stock_out 테이블 재생성
DROP TABLE IF EXISTS stock_out CASCADE;
CREATE TABLE stock_out (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES items(id),
  quantity INTEGER NOT NULL,       -- 수량
  issued_at TIMESTAMPTZ DEFAULT NOW(), -- 출고일
  issued_by TEXT NOT NULL,         -- 출고자
  project TEXT,                    -- 프로젝트
  is_rental BOOLEAN DEFAULT false, -- 대여여부
  return_date TIMESTAMPTZ,         -- 반납일
  note TEXT,                       -- 비고 (기존: notes)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
