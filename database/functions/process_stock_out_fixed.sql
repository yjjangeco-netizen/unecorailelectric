-- 출고 처리 저장 프로시저 (완전히 새로 작성)
-- items 테이블을 기준으로 재고 관리

CREATE OR REPLACE FUNCTION process_stock_out(
  p_item_name TEXT,
  p_specification TEXT,
  p_maker TEXT,
  p_location TEXT,
  p_quantity INTEGER,
  p_unit_price DECIMAL(15,2),
  p_issued_by TEXT,
  p_project TEXT DEFAULT NULL,
  p_is_rental BOOLEAN DEFAULT FALSE,
  p_return_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_note TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item_id UUID;
  v_current_quantity INTEGER;
  v_new_quantity INTEGER;
  v_result JSONB;
  v_unit_price DECIMAL(15,2);
BEGIN
  -- 1. items 테이블에서 재고 정보 조회
  SELECT id, current_quantity 
  INTO v_item_id, v_current_quantity
  FROM items 
  WHERE product = p_item_name AND spec = p_specification;
  
  IF v_item_id IS NULL THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', '재고 정보를 찾을 수 없습니다',
      'message', format('품목명: %s, 규격: %s인 재고를 찾을 수 없습니다', p_item_name, p_specification)
    );
    RETURN v_result;
  END IF;
  
  -- 2. 재고 수량 확인
  IF v_current_quantity < p_quantity THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', '재고 부족',
      'message', format('현재 재고: %s, 요청 수량: %s', v_current_quantity, p_quantity)
    );
    RETURN v_result;
  END IF;
  
  -- 3. 출고 수량 계산
  v_new_quantity := v_current_quantity - p_quantity;
  
  -- 4. stock_history에 출고 기록 생성
  INSERT INTO stock_history (
    id, item_id, event_type, quantity, unit_price,
    reason, notes, is_rental, return_date, event_date
  ) VALUES (
    gen_random_uuid(), v_item_id, 'OUT', p_quantity, p_unit_price,
    p_project, p_note, p_is_rental, p_return_date, NOW()
  );
  
  -- 5. items 테이블 업데이트 (핵심!)
  UPDATE items 
  SET 
    current_quantity = v_new_quantity,
    updated_at = NOW()
  WHERE id = v_item_id;
  
  -- 6. 결과 반환
  v_result := jsonb_build_object(
    'success', true,
    'item_name', p_item_name,
    'item_specification', p_specification,
    'old_quantity', v_current_quantity,
    'new_quantity', v_new_quantity,
    'stock_out_increased', p_quantity,
    'message', '출고 처리 완료'
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', '출고 처리 중 오류가 발생했습니다'
    );
    RETURN v_result;
END;
$$;

-- 함수 권한 설정
GRANT EXECUTE ON FUNCTION process_stock_out TO authenticated;
GRANT EXECUTE ON FUNCTION process_stock_out TO anon;

-- 테스트용 호출 예시
-- SELECT process_stock_out('테스트품목', '테스트규격', '테스트제조사', '테스트위치', 10, 5000.00, '테스트프로젝트', false, null, '테스트출고', 'user@test.com');
