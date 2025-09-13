-- 입고 처리 저장 프로시저 (수정된 버전)
-- stock_history 테이블을 사용하여 입고 처리
-- 통일된 컬럼명 사용 (name, specification, maker, location, note)

CREATE OR REPLACE FUNCTION process_stock_in(
  p_item_name TEXT,
  p_specification TEXT,
  p_maker TEXT,
  p_location TEXT,
  p_quantity INTEGER,
  p_unit_price DECIMAL(15,2),
  p_stock_status TEXT DEFAULT 'new',
  p_reason TEXT DEFAULT NULL,
  p_note TEXT DEFAULT NULL,
  p_received_by TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item_id UUID;
  v_current_quantity INTEGER := 0;
  v_new_quantity INTEGER;
  v_weighted_avg_price DECIMAL(15,2);
  v_result JSONB;
BEGIN
  -- 트랜잭션 시작 (자동)
  
  -- 1. 품목 조회/생성
  SELECT id, current_quantity, unit_price 
  INTO v_item_id, v_current_quantity, v_weighted_avg_price
  FROM items 
  WHERE product = p_item_name AND spec = p_specification
  FOR UPDATE; -- 행 잠금으로 동시성 보장
  
  IF v_item_id IS NULL THEN
    -- 새 품목 생성
    INSERT INTO items (
      id, product, spec, maker, location, unit_price, purpose, 
      min_stock, category, note, current_quantity, stock_status,
      created_at, updated_at
    ) VALUES (
      gen_random_uuid(), p_item_name, p_specification, p_maker, 
      p_location, p_unit_price, '재고입고', 0, '일반', 
      COALESCE(p_note, ''), p_quantity, p_stock_status,
      NOW(), NOW()
    ) RETURNING id INTO v_item_id;
    
    v_current_quantity := 0;
    v_new_quantity := p_quantity;
    v_weighted_avg_price := p_unit_price;
  ELSE
    -- 기존 품목 업데이트: 가중평균 단가 계산
    v_new_quantity := v_current_quantity + p_quantity;
    
    -- 가중평균 단가 = (기존재고×기존단가 + 입고수량×입고단가) / 총수량
    IF v_new_quantity > 0 THEN
      v_weighted_avg_price := (
        (v_current_quantity * v_weighted_avg_price) + 
        (p_quantity * p_unit_price)
      ) / v_new_quantity;
    ELSE
      v_weighted_avg_price := p_unit_price;
    END IF;
  END IF;
  
  -- 2. stock_history에 입고 기록 생성
  INSERT INTO stock_history (
    id, item_id, event_type, quantity, unit_price, condition_type,
    reason, received_by, notes, event_date
  ) VALUES (
    gen_random_uuid(), v_item_id, 'IN', p_quantity, p_unit_price, p_stock_status,
    p_reason, p_received_by, p_note, NOW()
  );
  
  -- 3. 품목 테이블 업데이트
  UPDATE items 
  SET 
    current_quantity = v_new_quantity,
    unit_price = v_weighted_avg_price,
    stock_status = p_stock_status,
    updated_at = NOW()
  WHERE id = v_item_id;
  
  -- 4. 결과 반환
  v_result := jsonb_build_object(
    'success', true,
    'item_id', v_item_id,
    'item_name', p_item_name,
    'item_specification', p_specification,
    'new_quantity', v_new_quantity,
    'weighted_avg_price', v_weighted_avg_price,
    'message', '입고 처리 완료'
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- 오류 발생 시 롤백
    v_result := jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', '입고 처리 중 오류가 발생했습니다'
    );
    
    RETURN v_result;
END;
$$;

-- 함수 권한 설정
GRANT EXECUTE ON FUNCTION process_stock_in TO authenticated;
GRANT EXECUTE ON FUNCTION process_stock_in TO anon;

-- 테스트용 호출 예시
-- SELECT process_stock_in('테스트품목', '테스트규격', '테스트제조사', '테스트위치', 100, 5000.00, 'new', '테스트입고', '테스트용', 'user@test.com');
