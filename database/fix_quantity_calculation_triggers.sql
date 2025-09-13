-- ========================================
-- 수량 계산 트리거 수정 스크립트
-- PostgreSQL용 통합 트리거
-- ========================================

-- 1단계: 기존 트리거 삭제
DROP TRIGGER IF EXISTS trg_stock_in_update ON stock_history;
DROP TRIGGER IF EXISTS trg_stock_out_update ON stock_history;
DROP TRIGGER IF EXISTS trg_stock_adjustment_update ON stock_history;

-- 2단계: 통합 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_item_quantities()
RETURNS TRIGGER AS $$
DECLARE
  v_item_id TEXT;
  v_event_type TEXT;
  v_quantity INTEGER;
  v_closing_qty INTEGER;
  v_stock_in INTEGER;
  v_stock_out INTEGER;
  v_new_current_qty INTEGER;
BEGIN
  -- 트리거 컨텍스트에서 값 추출
  IF TG_OP = 'DELETE' THEN
    v_item_id := OLD.item_id;
    v_event_type := OLD.event_type;
    v_quantity := OLD.quantity;
  ELSE
    v_item_id := NEW.item_id;
    v_event_type := NEW.event_type;
    v_quantity := NEW.quantity;
  END IF;

  -- 현재 재고 정보 조회
  SELECT closing_quantity, stock_in, stock_out
  INTO v_closing_qty, v_stock_in, v_stock_out
  FROM items
  WHERE id = v_item_id;

  -- 이벤트 타입에 따른 수량 조정
  IF TG_OP = 'DELETE' THEN
    -- 삭제 시 원래 수량을 빼기
    CASE v_event_type
      WHEN 'IN', 'PLUS', 'ADJUSTMENT' THEN
        v_stock_in := v_stock_in - v_quantity;
      WHEN 'OUT', 'MINUS', 'DISPOSAL' THEN
        v_stock_out := v_stock_out - v_quantity;
    END CASE;
  ELSE
    -- 삽입/업데이트 시 수량 추가
    CASE v_event_type
      WHEN 'IN', 'PLUS', 'ADJUSTMENT' THEN
        v_stock_in := v_stock_in + v_quantity;
      WHEN 'OUT', 'MINUS', 'DISPOSAL' THEN
        v_stock_out := v_stock_out + v_quantity;
    END CASE;
  END IF;

  -- 현재고 계산: 현재고 = 마감수량 + 입고수량 - 출고수량
  v_new_current_qty := COALESCE(v_closing_qty, 0) + COALESCE(v_stock_in, 0) - COALESCE(v_stock_out, 0);

  -- items 테이블 업데이트
  UPDATE items
  SET 
    current_quantity = v_new_current_qty,
    stock_in = COALESCE(v_stock_in, 0),
    stock_out = COALESCE(v_stock_out, 0),
    stock_status = CASE 
      WHEN v_new_current_qty > min_stock THEN 'normal'
      WHEN v_new_current_qty > 0 THEN 'low_stock'
      ELSE 'out_of_stock'
    END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = v_item_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3단계: 통합 트리거 생성
CREATE TRIGGER trg_stock_history_update
  AFTER INSERT OR UPDATE OR DELETE ON stock_history
  FOR EACH ROW
  EXECUTE FUNCTION update_item_quantities();

-- 4단계: 기존 데이터 정리 및 재계산
UPDATE items
SET 
  current_quantity = COALESCE(closing_quantity, 0) + COALESCE(stock_in, 0) - COALESCE(stock_out, 0),
  updated_at = CURRENT_TIMESTAMP;

-- 5단계: 수정된 데이터 확인
SELECT 
  '=== 수정 후 데이터 확인 ===' as info,
  COUNT(*) as total_items,
  COUNT(CASE WHEN current_quantity = (COALESCE(closing_quantity, 0) + COALESCE(stock_in, 0) - COALESCE(stock_out, 0)) THEN 1 END) as correct_items,
  COUNT(CASE WHEN current_quantity != (COALESCE(closing_quantity, 0) + COALESCE(stock_in, 0) - COALESCE(stock_out, 0)) THEN 1 END) as incorrect_items
FROM items;

-- 6단계: 샘플 데이터 확인
SELECT 
  id,
  name,
  closing_quantity,
  stock_in,
  stock_out,
  current_quantity,
  (COALESCE(closing_quantity, 0) + COALESCE(stock_in, 0) - COALESCE(stock_out, 0)) as calculated_current_quantity
FROM items
ORDER BY name
LIMIT 10;
