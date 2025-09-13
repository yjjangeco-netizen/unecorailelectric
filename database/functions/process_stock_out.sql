-- 출고 처리 저장 프로시저
-- 재고 부족 체크, 동시성 보장, 원자적 재고 감소

CREATE OR REPLACE FUNCTION process_stock_out(
  p_item_id UUID,
  p_quantity INTEGER,
  p_project TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_is_rental BOOLEAN DEFAULT false,
  p_return_date TIMESTAMPTZ DEFAULT NULL,
  p_issued_by TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item_name TEXT;
  v_current_quantity INTEGER;
  v_unit_price DECIMAL(15,2);
  v_new_quantity INTEGER;
  v_stock_out_id UUID;
  v_result JSONB;
BEGIN
  -- 트랜잭션 시작 (자동)
  
  -- 1. 품목 정보 조회 및 행 잠금
  SELECT product, current_quantity, unit_price
  INTO v_item_name, v_current_quantity, v_unit_price
  FROM items 
  WHERE id = p_item_id
  FOR UPDATE; -- 동시성 보장을 위한 행 잠금
  
  -- 품목 존재 확인
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '존재하지 않는 품목입니다',
      'error_code', 'ITEM_NOT_FOUND'
    );
  END IF;
  
  -- 2. 재고 부족 체크
  IF v_current_quantity < p_quantity THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('재고가 부족합니다. 현재 재고: %s개, 요청 수량: %s개', 
                     v_current_quantity, p_quantity),
      'error_code', 'INSUFFICIENT_STOCK',
      'current_quantity', v_current_quantity,
      'requested_quantity', p_quantity
    );
  END IF;
  
  -- 3. 수량 유효성 체크
  IF p_quantity <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '출고 수량은 0보다 커야 합니다',
      'error_code', 'INVALID_QUANTITY'
    );
  END IF;
  
  -- 4. 새 재고 수량 계산
  v_new_quantity := v_current_quantity - p_quantity;
  
  -- 5. 출고 기록 생성
  INSERT INTO stock_out (
    id, item_id, quantity, project, notes,
    is_rental, return_date, issued_by, issued_at
  ) VALUES (
    gen_random_uuid(), p_item_id, p_quantity, p_project, p_notes,
    p_is_rental, p_return_date, p_issued_by, NOW()
  ) RETURNING id INTO v_stock_out_id;
  
  -- 6. 품목 테이블 재고 감소
  UPDATE items 
  SET 
    current_quantity = v_new_quantity,
    updated_at = NOW()
  WHERE id = p_item_id;
  
  -- 7. items 테이블의 stock_status 업데이트
  UPDATE items 
  SET 
    stock_status = CASE 
      WHEN v_new_quantity <= 0 THEN 'low_stock'
      ELSE 'normal'
    END,
    updated_at = NOW()
  WHERE id = p_item_id;
  
  -- 8. 감사 로그 생성
  INSERT INTO audit_log (
    id, table_name, record_id, action, new_values,
    changed_by, changed_at, ip_address
  ) VALUES (
    gen_random_uuid(), 'stock_out', v_stock_out_id::TEXT, 'INSERT',
    jsonb_build_object(
      'item_id', p_item_id,
      'item_name', v_item_name,
      'quantity', p_quantity,
      'previous_quantity', v_current_quantity,
      'new_quantity', v_new_quantity,
      'unit_price', v_unit_price,
      'total_amount', v_unit_price * p_quantity,
      'is_rental', p_is_rental,
      'project', p_project
    ),
    p_issued_by, NOW(), '127.0.0.1'
  );
  
  -- 9. 재고 알림 체크 (재고 부족 시)
  IF v_new_quantity <= 5 THEN -- 최소 재고 임계값
    INSERT INTO notifications (
      id, user_id, title, message, type, created_at
    ) VALUES (
      gen_random_uuid(), p_issued_by, '재고 부족 알림',
      format('%s 품목의 재고가 %s개로 부족합니다', v_item_name, v_new_quantity),
      'warning', NOW()
    );
  END IF;
  
  -- 10. 결과 반환
  v_result := jsonb_build_object(
    'success', true,
    'item_id', p_item_id,
    'stock_out_id', v_stock_out_id,
    'item_name', v_item_name,
    'quantity_issued', p_quantity,
    'previous_quantity', v_current_quantity,
    'new_quantity', v_new_quantity,
    'unit_price', v_unit_price,
    'total_amount', v_unit_price * p_quantity,
    'low_stock_warning', v_new_quantity <= 5
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- 에러 발생 시 롤백 (자동)
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE,
      'detail', 'Database error during stock out processing'
    );
END;
$$;

-- 실행 권한 부여
GRANT EXECUTE ON FUNCTION process_stock_out TO authenticated;

-- 사용 예시:
-- SELECT process_stock_out('item-uuid', 10, '프로젝트A', '테스트출고', false, null, 'user@test.com');
