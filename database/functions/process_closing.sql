-- 마감 처리 저장 프로시저
-- 분기/월별 재고 마감, 스냅샷 생성, 원자적 처리

CREATE OR REPLACE FUNCTION process_closing(
  p_year INTEGER,
  p_quarter INTEGER DEFAULT NULL,
  p_month INTEGER DEFAULT NULL,
  p_closed_by TEXT,
  p_force_reclose BOOLEAN DEFAULT false
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_period_type TEXT;
  v_closing_run_id UUID;
  v_period_start DATE;
  v_period_end DATE;
  v_total_items INTEGER := 0;
  v_processed_items INTEGER := 0;
  v_total_value DECIMAL(18,2) := 0;
  v_item_record RECORD;
  v_opening_qty INTEGER;
  v_in_qty INTEGER;
  v_out_qty INTEGER;
  v_adj_qty INTEGER;
  v_disposal_qty INTEGER;
  v_closing_qty INTEGER;
  v_result JSONB;
  v_existing_run_id UUID;
BEGIN
  -- 1. 입력 검증
  IF p_quarter IS NOT NULL AND p_month IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '분기와 월을 동시에 지정할 수 없습니다'
    );
  END IF;
  
  IF p_quarter IS NULL AND p_month IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '분기 또는 월을 지정해야 합니다'
    );
  END IF;
  
  -- 2. 마감 기간 설정
  IF p_quarter IS NOT NULL THEN
    v_period_type := 'quarterly';
    v_period_start := make_date(p_year, (p_quarter - 1) * 3 + 1, 1);
    v_period_end := (v_period_start + interval '3 months' - interval '1 day')::DATE;
  ELSE
    v_period_type := 'monthly';
    v_period_start := make_date(p_year, p_month, 1);
    v_period_end := (v_period_start + interval '1 month' - interval '1 day')::DATE;
  END IF;
  
  -- 3. 기존 마감 확인
  SELECT id INTO v_existing_run_id
  FROM closing_runs
  WHERE period_year = p_year
    AND period_quarter = p_quarter
    AND period_month = p_month
    AND period_type = v_period_type
    AND status = 'completed';
  
  IF v_existing_run_id IS NOT NULL AND NOT p_force_reclose THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '이미 마감된 기간입니다. 재마감을 원하면 force_reclose=true로 설정하세요',
      'existing_run_id', v_existing_run_id
    );
  END IF;
  
  -- 4. 기존 마감 데이터 삭제 (재마감인 경우)
  IF p_force_reclose AND v_existing_run_id IS NOT NULL THEN
    DELETE FROM stock_snapshot 
    WHERE period_year = p_year
      AND period_quarter = p_quarter
      AND period_month = p_month;
      
    DELETE FROM closing_runs WHERE id = v_existing_run_id;
  END IF;
  
  -- 5. 새 마감 실행 생성
  INSERT INTO closing_runs (
    id, period_year, period_quarter, period_month, period_type,
    status, closed_by, started_at
  ) VALUES (
    gen_random_uuid(), p_year, p_quarter, p_month, v_period_type,
    'running', p_closed_by, NOW()
  ) RETURNING id INTO v_closing_run_id;
  
  -- 6. 현재 재고 품목들 순회하며 스냅샷 생성
  FOR v_item_record IN 
    SELECT DISTINCT i.id, i.name, i.specification, i.maker, i.category, i.unit_price
    FROM items i
    WHERE i.created_at <= v_period_end + interval '1 day'
    ORDER BY i.name
  LOOP
    -- 기초 재고 (기간 시작 전 마지막 스냅샷 또는 0)
    SELECT COALESCE(closing_quantity, 0) INTO v_opening_qty
    FROM stock_snapshot
    WHERE item_id = v_item_record.id
      AND snapshot_date < v_period_start
    ORDER BY snapshot_date DESC
    LIMIT 1;
    
    IF v_opening_qty IS NULL THEN
      v_opening_qty := 0;
    END IF;
    
    -- 기간 중 입고량
    SELECT COALESCE(SUM(quantity), 0) INTO v_in_qty
    FROM stock_in
    WHERE item_id = v_item_record.id
      AND received_at >= v_period_start
      AND received_at <= v_period_end + interval '1 day';
    
    -- 기간 중 출고량
    SELECT COALESCE(SUM(quantity), 0) INTO v_out_qty
    FROM stock_out
    WHERE item_id = v_item_record.id
      AND issued_at >= v_period_start
      AND issued_at <= v_period_end + interval '1 day';
    
    -- 기간 중 폐기량
    SELECT COALESCE(SUM(quantity), 0) INTO v_disposal_qty
    FROM disposal
    WHERE item_id = v_item_record.id
      AND disposed_at >= v_period_start
      AND disposed_at <= v_period_end + interval '1 day';
    
    -- 조정량 (감사 로그에서 계산)
    v_adj_qty := 0; -- 현재는 단순화
    
    -- 기말 재고 = 기초 + 입고 - 출고 - 폐기 + 조정
    v_closing_qty := v_opening_qty + v_in_qty - v_out_qty - v_disposal_qty + v_adj_qty;
    
    -- 스냅샷 저장
    INSERT INTO stock_snapshot (
      period_year, period_quarter, period_month,
      item_id, item_name, specification, maker, category,
      opening_quantity, stock_in_quantity, stock_out_quantity,
      adjustment_quantity, disposal_quantity, closing_quantity,
      unit_price, total_value, closed_by
    ) VALUES (
      p_year, p_quarter, p_month,
      v_item_record.id, v_item_record.name, v_item_record.specification,
      v_item_record.maker, v_item_record.category,
      v_opening_qty, v_in_qty, v_out_qty,
      v_adj_qty, v_disposal_qty, v_closing_qty,
      v_item_record.unit_price, 
      v_item_record.unit_price * v_closing_qty,
      p_closed_by
    );
    
    v_processed_items := v_processed_items + 1;
    v_total_value := v_total_value + (v_item_record.unit_price * v_closing_qty);
  END LOOP;
  
  -- 7. 마감 실행 완료 업데이트
  UPDATE closing_runs
  SET 
    status = 'completed',
    finished_at = NOW(),
    total_items = v_processed_items,
    processed_items = v_processed_items,
    total_value = v_total_value
  WHERE id = v_closing_run_id;
  
  -- 8. 감사 로그 생성
  INSERT INTO audit_log (
    id, table_name, record_id, action, new_values,
    changed_by, changed_at
  ) VALUES (
    gen_random_uuid(), 'closing_runs', v_closing_run_id::TEXT, 'CLOSING_COMPLETE',
    jsonb_build_object(
      'period_year', p_year,
      'period_quarter', p_quarter,
      'period_month', p_month,
      'period_type', v_period_type,
      'total_items', v_processed_items,
      'total_value', v_total_value,
      'period_start', v_period_start,
      'period_end', v_period_end
    ),
    p_closed_by, NOW()
  );
  
  -- 9. 결과 반환
  v_result := jsonb_build_object(
    'success', true,
    'closing_run_id', v_closing_run_id,
    'period_year', p_year,
    'period_quarter', p_quarter,
    'period_month', p_month,
    'period_type', v_period_type,
    'period_start', v_period_start,
    'period_end', v_period_end,
    'total_items', v_processed_items,
    'total_value', v_total_value,
    'completed_at', NOW()
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- 실패 시 마감 실행 상태 업데이트
    UPDATE closing_runs
    SET 
      status = 'failed',
      finished_at = NOW(),
      error_message = SQLERRM
    WHERE id = v_closing_run_id;
    
    RETURN jsonb_build_object(
      'success', false,
      'closing_run_id', v_closing_run_id,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- 마감 롤백 함수
CREATE OR REPLACE FUNCTION rollback_closing(
  p_closing_run_id UUID,
  p_rollback_by TEXT,
  p_reason TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_run_record RECORD;
  v_result JSONB;
BEGIN
  -- 마감 실행 정보 조회
  SELECT * INTO v_run_record
  FROM closing_runs
  WHERE id = p_closing_run_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '존재하지 않는 마감 실행입니다'
    );
  END IF;
  
  IF v_run_record.status != 'completed' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '완료된 마감만 롤백할 수 있습니다'
    );
  END IF;
  
  -- 스냅샷 데이터 삭제
  DELETE FROM stock_snapshot
  WHERE period_year = v_run_record.period_year
    AND period_quarter = v_run_record.period_quarter
    AND period_month = v_run_record.period_month;
  
  -- 마감 실행 상태 변경
  UPDATE closing_runs
  SET 
    status = 'cancelled',
    finished_at = NOW(),
    error_message = '관리자에 의해 롤백됨: ' || p_reason
  WHERE id = p_closing_run_id;
  
  -- 감사 로그
  INSERT INTO audit_log (
    id, table_name, record_id, action, new_values,
    changed_by, changed_at
  ) VALUES (
    gen_random_uuid(), 'closing_runs', p_closing_run_id::TEXT, 'ROLLBACK',
    jsonb_build_object(
      'rollback_reason', p_reason,
      'original_total_items', v_run_record.total_items,
      'original_total_value', v_run_record.total_value
    ),
    p_rollback_by, NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'closing_run_id', p_closing_run_id,
    'rollback_reason', p_reason,
    'rollback_by', p_rollback_by,
    'rollback_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- 실행 권한 부여
GRANT EXECUTE ON FUNCTION process_closing TO authenticated;
GRANT EXECUTE ON FUNCTION rollback_closing TO authenticated;

-- 사용 예시:
-- 분기 마감: SELECT process_closing(2024, 1, null, 'admin@test.com', false);
-- 월 마감: SELECT process_closing(2024, null, 3, 'admin@test.com', false);
-- 롤백: SELECT rollback_closing('closing-run-uuid', 'admin@test.com', '데이터 오류로 인한 롤백');
