-- 입고 처리 저장 프로시저
-- 단일 트랜잭션으로 입고 처리, 재고 업데이트, 감사 로그 생성

CREATE OR REPLACE FUNCTION process_stock_in(
  p_item_name TEXT,
  p_quantity INTEGER,
  p_unit_price DECIMAL(15,2),
  p_condition_type stock_condition DEFAULT 'new',
  p_reason TEXT DEFAULT NULL,
  p_ordered_by TEXT DEFAULT NULL,
  p_received_by TEXT,
  p_notes TEXT DEFAULT NULL
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
  
  -- 1. 품목 조회/생성
  SELECT id, current_quantity, unit_price 
  INTO v_item_id, v_current_quantity, v_weighted_avg_price
  FROM items 
  WHERE name = p_item_name
  FOR UPDATE; -- 행 잠금으로 동시성 보장
  
  IF v_item_id IS NULL THEN
    -- 새 품목 생성
    INSERT INTO items (
      id, name, specification, maker, unit_price, purpose, 
      min_stock, category, description, current_quantity,
      created_at, updated_at
    ) VALUES (
      gen_random_uuid(), p_item_name, p_item_name, '미정', 
      p_unit_price, '재고입고', 0, '일반', 
      COALESCE(p_notes, ''), p_quantity,
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
  INSERT INTO stock_in (
    id, item_id, quantity, unit_price, condition_type,
    reason, ordered_by, received_by, received_at
  ) VALUES (
    gen_random_uuid(), v_item_id, p_quantity, p_unit_price, 
    p_condition_type, p_reason, p_ordered_by, p_received_by, NOW()
  ) RETURNING id INTO v_stock_in_id;
  
  -- 3. 품목 테이블 업데이트
  UPDATE items 
  SET 
    current_quantity = v_new_quantity,
    unit_price = v_weighted_avg_price,
    updated_at = NOW()
  WHERE id = v_item_id;
  
  -- 4. 현재 재고 테이블 UPSERT
  INSERT INTO current_stock (
    id, name, specification, maker, unit_price, 
    current_quantity, total_amount, notes, category,
    stock_status, updated_at
  ) VALUES (
    v_item_id, p_item_name, p_item_name, '미정',
    v_weighted_avg_price, v_new_quantity, 
    v_weighted_avg_price * v_new_quantity,
    COALESCE(p_notes, ''), '일반',
    CASE WHEN v_new_quantity > 0 THEN 'normal' ELSE 'low_stock' END,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    unit_price = EXCLUDED.unit_price,
    current_quantity = EXCLUDED.current_quantity,
    total_amount = EXCLUDED.total_amount,
    stock_status = EXCLUDED.stock_status,
    updated_at = NOW();
  
  -- 5. 감사 로그 생성
  INSERT INTO audit_log (
    id, table_name, record_id, action, new_values,
    changed_by, changed_at, ip_address
  ) VALUES (
    gen_random_uuid(), 'stock_in', v_stock_in_id::TEXT, 'INSERT',
    jsonb_build_object(
      'item_id', v_item_id,
      'item_name', p_item_name,
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
-- SELECT process_stock_in('테스트품목', 100, 5000.00, 'new', '테스트입고', '홍길동', 'user@test.com', '테스트용');
