-- ========================================
-- 프로그램과 데이터베이스 통합 수정 스크립트
-- 재고 시스템 완전 동기화
-- ========================================

-- 1단계: 기존 테이블 백업 및 삭제
-- ========================================

-- 기존 테이블 백업 (필요시)
-- CREATE TABLE items_backup AS SELECT * FROM items;
-- CREATE TABLE stock_history_backup AS SELECT * FROM stock_history;

-- 기존 테이블 삭제
DROP TABLE IF EXISTS disposals;
DROP TABLE IF EXISTS stock_history;
DROP TABLE IF EXISTS items;
DROP VIEW IF EXISTS v_CurrentStock;
DROP VIEW IF EXISTS v_ItemLedger;
DROP TRIGGER IF EXISTS trg_NoNegative;

-- 2단계: 프로그램과 일치하는 테이블 구조 생성
-- ========================================

-- 품목 마스터 테이블
CREATE TABLE items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  product TEXT NOT NULL,                    -- 품목명
  spec TEXT,                                -- 규격
  maker TEXT,                               -- 제조사
  location TEXT,                            -- 보관위치
  unit_price DECIMAL(15,2) NOT NULL CHECK (unit_price >= 0), -- 단가
  purpose TEXT,                             -- 용도
  min_stock INTEGER DEFAULT 0,              -- 최소재고
  category TEXT DEFAULT '일반',              -- 카테고리
  stock_status TEXT DEFAULT 'new' CHECK (stock_status IN ('new', 'low_stock', 'out_of_stock')), -- 재고상태
  note TEXT,                                -- 비고
  current_quantity INTEGER DEFAULT 0,       -- 현재재고
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 재고 이력 테이블
CREATE TABLE stock_history (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  item_id TEXT NOT NULL,                    -- 품목ID
  event_type TEXT NOT NULL CHECK (event_type IN ('IN', 'OUT', 'PLUS', 'MINUS', 'DISPOSAL', 'ADJUSTMENT')), -- 이벤트타입
  quantity INTEGER NOT NULL CHECK (quantity > 0), -- 수량
  unit_price DECIMAL(15,2),                -- 단가
  condition_type TEXT DEFAULT 'new' CHECK (condition_type IN ('new', 'used-new', 'used-used', 'broken')), -- 상태
  reason TEXT,                              -- 사유
  ordered_by TEXT,                          -- 주문자
  received_by TEXT,                         -- 입고자/처리자
  project TEXT,                             -- 프로젝트
  notes TEXT,                               -- 비고
  is_rental BOOLEAN DEFAULT FALSE,          -- 대여여부
  return_date DATETIME,                     -- 반납예정일
  event_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT
);

-- 폐기 테이블
CREATE TABLE disposals (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  history_id TEXT NOT NULL,                 -- 이력ID
  disposal_reason TEXT,                     -- 폐기사유
  approver TEXT,                            -- 승인자
  evidence_url TEXT,                        -- 증빙URL
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (history_id) REFERENCES stock_history(id) ON DELETE CASCADE
);

-- 현재 재고 뷰 (프로그램과 일치)
CREATE VIEW current_stock AS
SELECT
  i.id,
  i.product,
  i.spec,
  i.maker,
  i.location,
  i.unit_price,
  i.purpose,
  i.min_stock,
  i.category,
  i.stock_status,
  i.note,
  i.current_quantity,
  (i.unit_price * i.current_quantity) as total_amount,
  i.created_at,
  i.updated_at
FROM items i;

-- 3단계: 인덱스 생성
-- ========================================

-- 품목 검색 인덱스
CREATE INDEX idx_items_product ON items(product);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_stock_status ON items(stock_status);

-- 재고 이력 검색 인덱스
CREATE INDEX idx_stock_history_item_id ON stock_history(item_id);
CREATE INDEX idx_stock_history_event_type ON stock_history(event_type);
CREATE INDEX idx_stock_history_event_date ON stock_history(event_date);
CREATE INDEX idx_stock_history_received_by ON stock_history(received_by);

-- 4단계: 트리거 생성 (재고 자동 업데이트)
-- ========================================

-- 입고 시 재고 증가
CREATE TRIGGER trg_stock_in_update
AFTER INSERT ON stock_history
WHEN NEW.event_type = 'IN'
BEGIN
  UPDATE items 
  SET 
    current_quantity = current_quantity + NEW.quantity,
    unit_price = CASE 
      WHEN current_quantity + NEW.quantity > 0 
      THEN ((current_quantity * unit_price) + (NEW.quantity * COALESCE(NEW.unit_price, 0))) / (current_quantity + NEW.quantity)
      ELSE COALESCE(NEW.unit_price, 0)
    END,
    stock_status = CASE 
      WHEN current_quantity + NEW.quantity > min_stock THEN 'normal'
      WHEN current_quantity + NEW.quantity > 0 THEN 'low_stock'
      ELSE 'out_of_stock'
    END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.item_id;
END;

-- 출고 시 재고 감소
CREATE TRIGGER trg_stock_out_update
AFTER INSERT ON stock_history
WHEN NEW.event_type = 'OUT'
BEGIN
  UPDATE items 
  SET 
    current_quantity = current_quantity - NEW.quantity,
    stock_status = CASE 
      WHEN current_quantity - NEW.quantity > min_stock THEN 'normal'
      WHEN current_quantity - NEW.quantity > 0 THEN 'low_stock'
      ELSE 'out_of_stock'
    END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.item_id;
END;

-- 재고 조정 시 재고 변경
CREATE TRIGGER trg_stock_adjustment_update
AFTER INSERT ON stock_history
WHEN NEW.event_type IN ('PLUS', 'MINUS', 'ADJUSTMENT')
BEGIN
  UPDATE items 
  SET 
    current_quantity = CASE 
      WHEN NEW.event_type = 'PLUS' THEN current_quantity + NEW.quantity
      WHEN NEW.event_type = 'MINUS' THEN current_quantity - NEW.quantity
      WHEN NEW.event_type = 'ADJUSTMENT' THEN NEW.quantity
      ELSE current_quantity
    END,
    stock_status = CASE 
      WHEN (CASE 
        WHEN NEW.event_type = 'PLUS' THEN current_quantity + NEW.quantity
        WHEN NEW.event_type = 'MINUS' THEN current_quantity - NEW.quantity
        WHEN NEW.event_type = 'ADJUSTMENT' THEN NEW.quantity
        ELSE current_quantity
      END) > min_stock THEN 'normal'
      WHEN (CASE 
        WHEN NEW.event_type = 'PLUS' THEN current_quantity + NEW.quantity
        WHEN NEW.event_type = 'MINUS' THEN current_quantity - NEW.quantity
        WHEN NEW.event_type = 'ADJUSTMENT' THEN NEW.quantity
        ELSE current_quantity
      END) > 0 THEN 'low_stock'
      ELSE 'out_of_stock'
    END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.item_id;
END;

-- 폐기 시 재고 감소
CREATE TRIGGER trg_disposal_update
AFTER INSERT ON stock_history
WHEN NEW.event_type = 'DISPOSAL'
BEGIN
  UPDATE items 
  SET 
    current_quantity = current_quantity - NEW.quantity,
    stock_status = CASE 
      WHEN current_quantity - NEW.quantity > min_stock THEN 'normal'
      WHEN current_quantity - NEW.quantity > 0 THEN 'low_stock'
      ELSE 'out_of_stock'
    END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.item_id;
END;

-- 5단계: 샘플 데이터 삽입
-- ========================================

-- 샘플 품목
INSERT INTO items (product, spec, maker, location, unit_price, purpose, min_stock, category, note) VALUES
('전선 (2.0SQ)', '2.0SQ', 'LS전선', '창고A', 1500.00, '전기 배선용', 50, '전선류', '전기 배선용 고품질 전선'),
('모니터', '24인치', '삼성', '창고B', 250000.00, '사무용', 2, '전자기기', '사무용 24인치 모니터'),
('자전거', '88', '대림', '창고C', 150000.00, '운송용', 1, '운송장비', '업무용 자전거');

-- 샘플 입고 이력
INSERT INTO stock_history (item_id, event_type, quantity, unit_price, condition_type, reason, received_by, notes) VALUES
((SELECT id FROM items WHERE product = '전선 (2.0SQ)'), 'IN', 100, 1500.00, 'new', '초도물량', 'admin', '초도 물량 입고'),
((SELECT id FROM items WHERE product = '모니터'), 'IN', 5, 250000.00, 'new', '초도물량', 'admin', '초도 물량 입고'),
((SELECT id FROM items WHERE product = '자전거'), 'IN', 3, 150000.00, 'new', '초도물량', 'admin', '초도 물량 입고');

-- 6단계: 권한 설정
-- ========================================

-- 모든 테이블에 대한 권한 부여
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 7단계: 테이블 구조 확인
-- ========================================

SELECT '✅ 통합 수정 완료!' as result;

-- items 테이블 구조 확인
SELECT 'items 테이블 구조:' as table_info;
PRAGMA table_info(items);

-- stock_history 테이블 구조 확인  
SELECT 'stock_history 테이블 구조:' as table_info;
PRAGMA table_info(stock_history);

-- 현재 재고 확인
SELECT '현재 재고 현황:' as stock_info;
SELECT * FROM current_stock;

SELECT '🎉 프로그램과 데이터베이스 통합 완료!' as final_result;
