-- ========================================
-- 프로그램과 데이터베이스 통합 수정 스크립트 (PostgreSQL)
-- 재고 시스템 완전 동기화 - 2개 테이블 구조 + 승인자 시스템
-- ========================================

-- 1단계: 기존 테이블 백업 및 삭제
-- ========================================

-- 기존 테이블 백업 (필요시)
-- CREATE TABLE items_backup AS SELECT * FROM items;
-- CREATE TABLE stock_history_backup AS SELECT * FROM stock_history;

-- 기존 테이블 삭제 (PostgreSQL 방식)
DROP TABLE IF EXISTS disposals CASCADE;
DROP TABLE IF EXISTS stock_history CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP VIEW IF EXISTS v_CurrentStock CASCADE;
DROP VIEW IF EXISTS v_ItemLedger CASCADE;

-- 2단계: 프로그램과 일치하는 테이블 구조 생성 (2개 테이블)
-- ========================================

-- 품목 마스터 테이블 (재고 정보 포함)
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product TEXT NOT NULL,                    -- 품목명
  spec TEXT,                                -- 규격
  maker TEXT,                               -- 제조사
  location TEXT,                            -- 보관위치
  unit_price DECIMAL(15,2) NOT NULL CHECK (unit_price >= 0), -- 단가
  purpose TEXT,                             -- 용도
  min_stock INTEGER DEFAULT 0,              -- 최소재고
  category TEXT DEFAULT '일반',              -- 카테고리
  stock_status TEXT DEFAULT 'normal' CHECK (stock_status IN ('normal', 'low_stock', 'out_of_stock')), -- 재고상태
  note TEXT,                                -- 비고
  current_quantity INTEGER DEFAULT 0,       -- 현재재고
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 재고 이력 테이블 (모든 이벤트 통합 + 승인자 시스템)
CREATE TABLE stock_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL,                    -- 품목ID
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
  return_date TIMESTAMP WITH TIME ZONE,     -- 반납예정일
  -- 폐기 관련 필드 추가 (disposals 테이블 대신)
  disposal_reason TEXT,                     -- 폐기사유
  disposal_status TEXT DEFAULT 'pending' CHECK (disposal_status IN ('pending', 'approved', 'rejected', 'cancelled')), -- 폐기승인상태
  requester TEXT,                           -- 폐기 요청자
  approver TEXT,                            -- 승인자
  approval_date TIMESTAMP WITH TIME ZONE,   -- 승인일시
  approval_notes TEXT,                      -- 승인/반려 사유
  evidence_url TEXT,                        -- 증빙URL
  event_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT
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
-- 폐기 승인 관련 인덱스 추가
CREATE INDEX idx_stock_history_disposal_status ON stock_history(disposal_status);
CREATE INDEX idx_stock_history_approver ON stock_history(approver);
CREATE INDEX idx_stock_history_requester ON stock_history(requester);

-- 4단계: 트리거 함수 및 트리거 생성 (재고 자동 업데이트)
-- ========================================

-- 입고 시 재고 증가 트리거 함수
CREATE OR REPLACE FUNCTION trg_stock_in_update()
RETURNS TRIGGER AS $$
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
    updated_at = NOW()
  WHERE id = NEW.item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 출고 시 재고 감소 트리거 함수
CREATE OR REPLACE FUNCTION trg_stock_out_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE items 
  SET 
    current_quantity = current_quantity - NEW.quantity,
    stock_status = CASE 
      WHEN current_quantity - NEW.quantity > min_stock THEN 'normal'
      WHEN current_quantity - NEW.quantity > 0 THEN 'low_stock'
      ELSE 'out_of_stock'
    END,
    updated_at = NOW()
  WHERE id = NEW.item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 재고 조정 시 재고 변경 트리거 함수
CREATE OR REPLACE FUNCTION trg_stock_adjustment_update()
RETURNS TRIGGER AS $$
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
    updated_at = NOW()
  WHERE id = NEW.item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 폐기 시 재고 감소 트리거 함수 (승인된 경우에만)
CREATE OR REPLACE FUNCTION trg_disposal_update()
RETURNS TRIGGER AS $$
BEGIN
  -- 승인된 폐기만 재고 차감
  IF NEW.event_type = 'DISPOSAL' AND NEW.disposal_status = 'approved' THEN
    UPDATE items 
    SET 
      current_quantity = current_quantity - NEW.quantity,
      stock_status = CASE 
        WHEN current_quantity - NEW.quantity > min_stock THEN 'normal'
        WHEN current_quantity - NEW.quantity > 0 THEN 'low_stock'
        ELSE 'out_of_stock'
      END,
      updated_at = NOW()
    WHERE id = NEW.item_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trg_stock_in_update
  AFTER INSERT ON stock_history
  FOR EACH ROW
  WHEN (NEW.event_type = 'IN')
  EXECUTE FUNCTION trg_stock_in_update();

CREATE TRIGGER trg_stock_out_update
  AFTER INSERT ON stock_history
  FOR EACH ROW
  WHEN (NEW.event_type = 'OUT')
  EXECUTE FUNCTION trg_stock_out_update();

CREATE TRIGGER trg_stock_adjustment_update
  AFTER INSERT ON stock_history
  FOR EACH ROW
  WHEN (NEW.event_type IN ('PLUS', 'MINUS', 'ADJUSTMENT'))
  EXECUTE FUNCTION trg_stock_adjustment_update();

CREATE TRIGGER trg_disposal_update
  AFTER INSERT ON stock_history
  FOR EACH ROW
  WHEN (NEW.event_type = 'DISPOSAL')
  EXECUTE FUNCTION trg_disposal_update();

-- 폐기 승인 상태 변경 시 재고 업데이트 트리거
CREATE OR REPLACE FUNCTION trg_disposal_approval_update()
RETURNS TRIGGER AS $$
BEGIN
  -- 승인 상태가 변경된 경우에만 처리
  IF OLD.disposal_status != NEW.disposal_status THEN
    IF NEW.disposal_status = 'approved' THEN
      -- 승인된 경우 재고 차감
      UPDATE items 
      SET 
        current_quantity = current_quantity - NEW.quantity,
        stock_status = CASE 
          WHEN current_quantity - NEW.quantity > min_stock THEN 'normal'
          WHEN current_quantity - NEW.quantity > 0 THEN 'low_stock'
          ELSE 'out_of_stock'
        END,
        updated_at = NOW()
      WHERE id = NEW.item_id;
    ELSIF OLD.disposal_status = 'approved' AND NEW.disposal_status != 'approved' THEN
      -- 승인 취소된 경우 재고 복구
      UPDATE items 
      SET 
        current_quantity = current_quantity + NEW.quantity,
        stock_status = CASE 
          WHEN current_quantity + NEW.quantity > min_stock THEN 'normal'
          WHEN current_quantity + NEW.quantity > 0 THEN 'low_stock'
          ELSE 'out_of_stock'
        END,
        updated_at = NOW()
      WHERE id = NEW.item_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_disposal_approval_update
  AFTER UPDATE ON stock_history
  FOR EACH ROW
  WHEN (OLD.event_type = 'DISPOSAL' AND NEW.event_type = 'DISPOSAL')
  EXECUTE FUNCTION trg_disposal_approval_update();

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

SELECT '✅ 2개 테이블 구조로 통합 수정 완료! (승인자 시스템 포함)' as result;

-- items 테이블 구조 확인
SELECT 'items 테이블 구조:' as table_info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'items'
ORDER BY ordinal_position;

-- stock_history 테이블 구조 확인  
SELECT 'stock_history 테이블 구조:' as table_info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'stock_history'
ORDER BY ordinal_position;

-- 현재 재고 확인
SELECT '현재 재고 현황:' as stock_info;
SELECT * FROM current_stock;

-- 폐기 승인 상태별 통계
SELECT '폐기 승인 상태별 통계:' as disposal_stats;
SELECT 
    disposal_status,
    COUNT(*) as count,
    SUM(quantity) as total_quantity
FROM stock_history 
WHERE event_type = 'DISPOSAL'
GROUP BY disposal_status;

SELECT '🎉 2개 테이블 + 승인자 시스템 완성!' as final_result;
