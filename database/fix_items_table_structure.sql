-- ========================================
-- items 테이블 구조 수정 스크립트
-- current_quantity 컬럼 추가 및 stock_status 제약조건 수정
-- ========================================

-- 1단계: items 테이블에 current_quantity 컬럼 추가
ALTER TABLE items ADD COLUMN IF NOT EXISTS current_quantity INTEGER DEFAULT 0;

-- 2단계: stock_status 제약조건 수정
DO $$
BEGIN
  -- 기존 제약조건 삭제
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'items_stock_status_check'
  ) THEN
    ALTER TABLE items DROP CONSTRAINT items_stock_status_check;
  END IF;
  
  -- 새로운 제약조건 추가 (프로그램과 일치)
  ALTER TABLE items 
  ADD CONSTRAINT items_stock_status_check 
  CHECK (stock_status IN ('new', 'used-new', 'used-used', 'broken'));
END $$;

-- 3단계: stock_status 기본값 설정
ALTER TABLE items ALTER COLUMN stock_status SET DEFAULT 'new';

-- 4단계: current_quantity 자동 계산 함수 생성
CREATE OR REPLACE FUNCTION calculate_current_quantity(p_item_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  qty_in INTEGER;
  qty_out INTEGER;
BEGIN
  -- 입고 수량 계산
  SELECT COALESCE(SUM(quantity), 0) INTO qty_in
  FROM stock_history 
  WHERE item_id = p_item_id 
  AND event_type IN ('IN', 'PLUS', 'ADJUSTMENT');
  
  -- 출고 수량 계산
  SELECT COALESCE(SUM(quantity), 0) INTO qty_out
  FROM stock_history 
  WHERE item_id = p_item_id 
  AND event_type IN ('OUT', 'MINUS', 'DISPOSAL');
  
  RETURN qty_in - qty_out;
END;
$$ LANGUAGE plpgsql;

-- 5단계: current_quantity 업데이트
UPDATE items 
SET current_quantity = calculate_current_quantity(id)
WHERE current_quantity IS NULL OR current_quantity = 0;

-- 6단계: 트리거 생성 (재고 자동 업데이트)
CREATE OR REPLACE FUNCTION update_item_current_quantity()
RETURNS TRIGGER AS $$
BEGIN
  -- 재고 이력 변경 시 items.current_quantity 자동 업데이트
  UPDATE items 
  SET current_quantity = calculate_current_quantity(NEW.item_id),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trg_update_current_quantity ON stock_history;
CREATE TRIGGER trg_update_current_quantity
  AFTER INSERT OR UPDATE OR DELETE ON stock_history
  FOR EACH ROW
  EXECUTE FUNCTION update_item_current_quantity();

-- 7단계: 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'items 테이블 구조 수정 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '- current_quantity 컬럼 추가';
  RAISE NOTICE '- stock_status 제약조건 수정';
  RAISE NOTICE '- 자동 재고 계산 함수 생성';
  RAISE NOTICE '- 트리거 생성 (재고 자동 업데이트)';
  RAISE NOTICE '========================================';
END $$;
