-- 입고 처리 저장 프로시저
-- 단일 트랜잭션으로 입고 처리, 재고 업데이트, 감사 로그 생성
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
  v_stock_in_id UUID;
  v_result JSONB;
BEGIN
  -- 트랜잭션 시작 (자동)
  
  -- 입력값 검증
  IF p_item_name IS NULL OR p_item_name = '' THEN
    RAISE EXCEPTION '품목명은 필수입니다';
  END IF;
  
  IF p_specification IS NULL OR p_specification = '' THEN
    RAISE EXCEPTION '규격은 필수입니다';
  END IF;
  
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION '수량은 0보다 커야 합니다';
  END IF;
  
  -- 품목상태 매핑 및 검증
  IF p_stock_status NOT IN ('new', 'used-new', 'used-used', 'broken') THEN
    RAISE EXCEPTION '유효하지 않은 품목상태: % (허용값: new, used-new, used-used, broken)', p_stock_status;
  END IF;
  
  -- 1. 품목 조회/생성
  SELECT id, current_quantity, unit_price 
  INTO v_item_id, v_current_quantity, v_weighted_avg_price
  FROM items 
  WHERE product = p_item_name AND spec = p_specification
  FOR UPDATE; -- 행 잠금으로 동시성 보장
  
  IF v_item_id IS NULL THEN
    -- 새 품목 생성
    INSERT INTO items (
      product, spec, maker, location, unit_price, purpose, 
      min_stock, category, note, current_quantity, stock_status,
      created_at, updated_at
    ) VALUES (
      p_item_name, p_specification, p_maker, 
      p_location, p_unit_price, '재고관리', 0, '일반', 
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
  
  -- 2. 입고 기록 생성
  INSERT INTO stock_history (
    id, item_id, event_type, quantity, unit_price, condition_type,
    reason, received_by, notes, event_date
  ) VALUES (
    gen_random_uuid(), v_item_id, 'IN', p_quantity, p_unit_price, p_stock_status,
    p_reason, p_received_by, p_note, NOW()
  ) RETURNING id INTO v_stock_in_id;
  
  -- 3. 품목 테이블 업데이트
  UPDATE items 
  SET 
    current_quantity = v_new_quantity,
    unit_price = v_weighted_avg_price,
    stock_status = CASE WHEN v_new_quantity > 0 THEN 'normal' ELSE 'low_stock' END,
    updated_at = NOW()
  WHERE id = v_item_id;
  
  -- 5. 감사 로그 생성
  INSERT INTO audit_log (
    id, table_name, record_id, action, new_values,
    changed_by, changed_at, ip_address
  ) VALUES (
    gen_random_uuid(), 'stock_in', v_stock_in_id::TEXT, 'INSERT',
    jsonb_build_object(
      'item_id', v_item_id,
      'item_name', p_item_name,
      'specification', p_specification,
      'maker', p_maker,
      'location', p_location,
      'quantity', p_quantity,
      'unit_price', p_unit_price,
      'previous_quantity', v_current_quantity,
      'new_quantity', v_new_quantity,
      'weighted_avg_price', v_weighted_avg_price
    ),
    p_received_by, NOW(), '127.0.0.1'
  );
  
  -- 6. 결과 반환
  v_result := jsonb_build_object(
    'success', true,
    'item_id', v_item_id,
    'stock_in_id', v_stock_in_id,
    'item_name', p_item_name,
    'item_specification', p_specification,
    'maker', p_maker,
    'location', p_location,
    'quantity_added', p_quantity,
    'previous_quantity', v_current_quantity,
    'new_quantity', v_new_quantity,
    'weighted_avg_price', v_weighted_avg_price,
    'total_amount', v_weighted_avg_price * v_new_quantity
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- 에러 발생 시 롤백 (자동)
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- 실행 권한 부여
GRANT EXECUTE ON FUNCTION process_stock_in TO authenticated;

-- 사용 예시:
-- SELECT process_stock_in('테스트품목', '테스트규격', '테스트제조사', '테스트위치', 100, 5000.00, 'new', '테스트입고', '테스트용', 'user@test.com');
