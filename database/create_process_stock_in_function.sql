-- ========================================
-- process_stock_in 함수 생성 (실제 items 테이블 구조 기반)
-- ========================================

-- 기존 함수가 있다면 삭제
DROP FUNCTION IF EXISTS public.process_stock_in(
  TEXT, TEXT, TEXT, TEXT, INTEGER, DECIMAL, TEXT, TEXT, TEXT, TEXT
);

-- process_stock_in 함수 생성
CREATE OR REPLACE FUNCTION public.process_stock_in(
  p_item_name TEXT,
  p_specification TEXT,
  p_maker TEXT,
  p_location TEXT,
  p_quantity INTEGER,
  p_unit_price DECIMAL(15,2),
  p_stock_status TEXT DEFAULT 'new',
  p_reason TEXT DEFAULT NULL,
  p_note TEXT DEFAULT NULL,
  p_received_by TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item_id UUID;
  v_existing_item RECORD;
  v_result JSONB;
  v_date_index VARCHAR(20);
BEGIN
  -- 입력값 검증
  IF p_item_name IS NULL OR TRIM(p_item_name) = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '품목명은 필수입니다.',
      'item_id', NULL
    );
  END IF;

  IF p_specification IS NULL OR TRIM(p_specification) = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '규격은 필수입니다.',
      'item_id', NULL
    );
  END IF;

  IF p_location IS NULL OR TRIM(p_location) = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '위치는 필수입니다.',
      'item_id', NULL
    );
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '수량은 0보다 큰 값이어야 합니다.',
      'item_id', NULL
    );
  END IF;

  IF p_unit_price IS NULL OR p_unit_price < 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '단가는 0 이상이어야 합니다.',
      'item_id', NULL
    );
  END IF;

  -- 날짜 인덱스 생성 (YYYYMMDD 형식)
  v_date_index := TO_CHAR(NOW(), 'YYYYMMDD');

  -- 기존 품목 확인 (name, specification, location으로 - maker는 선택사항)
  SELECT id, current_quantity, stock_status
  INTO v_existing_item
  FROM public.items
  WHERE name = p_item_name
    AND specification = p_specification
    AND location = p_location
    AND status = 'active'
    AND (
      (maker IS NULL AND p_maker IS NULL) OR 
      (maker = p_maker)
    )
  LIMIT 1;

  IF v_existing_item.id IS NOT NULL THEN
    -- 기존 품목이 있는 경우 수량 추가
    v_item_id := v_existing_item.id;
    
    UPDATE public.items
    SET 
      current_quantity = current_quantity + p_quantity,
      stock_in = stock_in + p_quantity,
      total_qunty = total_qunty + p_quantity,
      stock_status = p_stock_status,
      unit_price = p_unit_price,
      note = COALESCE(p_note, note),
      updated_at = NOW()
    WHERE id = v_item_id;

    v_result := jsonb_build_object(
      'success', true,
      'message', '기존 품목에 수량이 추가되었습니다.',
      'item_id', v_item_id,
      'previous_quantity', v_existing_item.current_quantity,
      'added_quantity', p_quantity,
      'new_quantity', v_existing_item.current_quantity + p_quantity
    );
  ELSE
    -- 새 품목 생성
    INSERT INTO public.items (
      name,
      specification,
      maker,
      location,
      current_quantity,
      unit_price,
      purpose,
      category,
      note,
      stock_status,
      date_index,
      status,
      stock_in,
      total_qunty,
      created_at,
      updated_at
    ) VALUES (
      p_item_name,
      p_specification,
      p_maker,
      p_location,
      p_quantity,
      p_unit_price,
      '재고관리',
      '일반',
      p_note,
      p_stock_status,
      v_date_index,
      'active',
      p_quantity,
      p_quantity,
      NOW(),
      NOW()
    ) RETURNING id INTO v_item_id;

    v_result := jsonb_build_object(
      'success', true,
      'message', '새 품목이 생성되었습니다.',
      'item_id', v_item_id,
      'quantity', p_quantity
    );
  END IF;

  -- 입고 이력 기록 (stock_history 테이블이 있다면)
  -- 주석: stock_history 테이블이 실제로 존재하는지 확인 필요
  /*
  INSERT INTO public.stock_history (
    item_id,
    transaction_type,
    quantity,
    unit_price,
    reason,
    note,
    created_by,
    created_at
  ) VALUES (
    v_item_id,
    'in',
    p_quantity,
    p_unit_price,
    p_reason,
    p_note,
    p_received_by,
    NOW()
  );
  */

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '입고 처리 중 오류가 발생했습니다: ' || SQLERRM,
      'item_id', NULL
    );
END;
$$;

-- 함수 권한 설정
GRANT EXECUTE ON FUNCTION public.process_stock_in(
  TEXT, TEXT, TEXT, TEXT, INTEGER, DECIMAL, TEXT, TEXT, TEXT, TEXT
) TO authenticated;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'process_stock_in 함수가 성공적으로 생성되었습니다!';
  RAISE NOTICE '========================================';
END $$;
