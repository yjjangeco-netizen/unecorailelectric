-- 입고 트랜잭션 처리 함수 (단일 품목) - stock_status 문제 해결
-- 에러 발생 시 완전 롤백 보장
CREATE OR REPLACE FUNCTION process_stock_in_transaction(
  p_product TEXT, 
  p_spec TEXT, 
  p_maker TEXT, 
  p_unit_price DECIMAL, 
  p_stock_status TEXT,
  p_note TEXT, 
  p_purpose TEXT, 
  p_quantity INTEGER, 
  p_received_by TEXT, 
  p_event_date DATE,
  p_location TEXT DEFAULT '창고A'
) RETURNS TABLE(item_id UUID) AS $$
DECLARE 
  v_item_id UUID;
BEGIN
  -- 입력값 검증
  IF p_product IS NULL OR p_product = '' THEN
    RAISE EXCEPTION '품목명은 필수입니다';
  END IF;
  
  IF p_spec IS NULL OR p_spec = '' THEN
    RAISE EXCEPTION '규격은 필수입니다';
  END IF;
  
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION '수량은 0보다 커야 합니다';
  END IF;
  
  -- 품목상태 매핑 및 검증
  IF p_stock_status NOT IN ('new', 'used-new', 'used-used', 'broken') THEN
    RAISE EXCEPTION '유효하지 않은 품목상태: % (허용값: new, used-new, used-used, broken)', p_stock_status;
  END IF;
  
  -- 디버깅용 로그
  RAISE NOTICE '입고 처리 시작 - 품목: %, 규격: %, 상태: %, 수량: %', p_product, p_spec, p_stock_status, p_quantity;
  
  -- 1단계: items 테이블에 품목 정보 삽입 (stock_status 명시적 지정)
  INSERT INTO items (
    product, spec, maker, unit_price, purpose, note, stock_status, created_at, updated_at
  ) VALUES (
    p_product, p_spec, p_maker, p_unit_price, p_purpose, p_note, p_stock_status, NOW(), NOW()
  ) RETURNING id INTO v_item_id;
  
  -- 2단계: stock_history 테이블에 입고 이력 삽입 (동일한 값 사용)
  INSERT INTO stock_history (
    item_id, event_type, quantity, unit_price, condition_type, reason, received_by, notes, event_date, created_at
  ) VALUES (
    v_item_id, 'IN', p_quantity, p_unit_price, 
    p_stock_status, -- 동일한 값 사용 (new, used-new, used-used, broken)
    p_purpose, p_received_by, p_note, p_event_date, NOW()
  );
  
  -- 3단계: items 테이블의 재고 정보 업데이트 (stock_status 명시적 지정)
  UPDATE items 
  SET 
    current_quantity = current_quantity + p_quantity,
    stock_status = p_stock_status, -- stock_status도 업데이트
    updated_at = NOW()
  WHERE id = v_item_id;
  
  -- 성공 로그
  RAISE NOTICE '입고 처리 완료 - 품목 ID: %, 상태: %', v_item_id, p_stock_status;
  
  -- 결과 반환
  RETURN QUERY SELECT v_item_id;
  
EXCEPTION 
  WHEN OTHERS THEN
    -- 모든 에러를 로그하고 롤백
    RAISE NOTICE '입고 처리 중 오류 발생: %', SQLERRM;
    RAISE EXCEPTION '입고 처리 중 오류: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;
