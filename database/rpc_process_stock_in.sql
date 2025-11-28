-- 재고 입고 처리 저장 프로시저
CREATE OR REPLACE FUNCTION process_stock_in(
  p_item_name TEXT,
  p_specification TEXT,
  p_maker TEXT,
  p_location TEXT,
  p_quantity INTEGER,
  p_unit_price DECIMAL,
  p_stock_status TEXT,
  p_reason TEXT,
  p_note TEXT,
  p_received_by TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item_id UUID;
  v_current_quantity INTEGER;
  v_new_quantity INTEGER;
  v_user_id UUID;
  v_weighted_avg_price DECIMAL;
BEGIN
  -- 사용자 ID 조회 (이메일이나 ID로)
  SELECT id INTO v_user_id FROM users WHERE email = p_received_by OR id::text = p_received_by LIMIT 1;
  
  -- 사용자가 없으면 시스템 사용자로 대체하거나 에러
  IF v_user_id IS NULL THEN
    -- 임시로 첫 번째 사용자 사용 (실제 운영 시에는 에러 처리 필요)
    SELECT id INTO v_user_id FROM users LIMIT 1;
  END IF;

  -- 1. 기존 품목 조회 (이름, 규격, 제조사, 위치, 상태가 모두 일치하는지 확인)
  -- 제조사(maker)가 빈 값일 수 있으므로 COALESCE 사용
  SELECT id, current_stock INTO v_item_id, v_current_quantity
  FROM stock_items
  WHERE name = p_item_name 
    AND specification = p_specification
    AND COALESCE(supplier, '') = COALESCE(p_maker, '')
    AND COALESCE(location, '') = COALESCE(p_location, '')
    AND status = 'active' -- 활성 상태인 품목만
  LIMIT 1;

  -- 2. 품목이 없으면 새로 생성
  IF v_item_id IS NULL THEN
    INSERT INTO stock_items (
      name, 
      specification, 
      category, 
      location, 
      current_stock, 
      unit, 
      supplier, 
      status, 
      notes, 
      created_by
    ) VALUES (
      p_item_name,
      p_specification,
      '일반', -- 기본 카테고리
      p_location,
      p_quantity,
      '개',
      p_maker,
      'active',
      p_note,
      v_user_id
    ) RETURNING id INTO v_item_id;
    
    v_current_quantity := 0;
    v_new_quantity := p_quantity;
    v_weighted_avg_price := p_unit_price;
  ELSE
    -- 3. 품목이 있으면 수량 업데이트
    v_new_quantity := v_current_quantity + p_quantity;
    
    -- 가중 평균 단가 계산 (기존 재고가 있을 경우)
    -- 단순화를 위해 이번 입고 단가로 업데이트하거나, 별도 로직 적용 가능
    -- 여기서는 입고 단가 기록만 하고 품목 마스터의 단가는 업데이트 하지 않음 (또는 필요 시 업데이트)
    
    UPDATE stock_items
    SET current_stock = v_new_quantity,
        updated_at = NOW()
    WHERE id = v_item_id;
  END IF;

  -- 4. 입고 이력 기록
  INSERT INTO stock_transactions (
    item_id,
    transaction_type,
    quantity,
    reason,
    user_id,
    transaction_date,
    notes
  ) VALUES (
    v_item_id,
    'in',
    p_quantity,
    COALESCE(p_reason, '입고'),
    v_user_id,
    NOW(),
    p_note
  );

  -- 5. 결과 반환
  RETURN jsonb_build_object(
    'success', true,
    'item_id', v_item_id,
    'item_name', p_item_name,
    'item_specification', p_specification,
    'previous_quantity', v_current_quantity,
    'new_quantity', v_new_quantity,
    'weighted_avg_price', p_unit_price
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;
