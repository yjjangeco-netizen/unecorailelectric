-- 대량 작업 처리 저장 프로시저
-- 배치 입고/출고 처리, 트랜잭션 보장

CREATE OR REPLACE FUNCTION process_bulk_operations(
  p_operations JSONB,
  p_operation_type TEXT,
  p_processed_by TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_operation JSONB;
  v_results JSONB[] := '{}';
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_total_count INTEGER;
  v_batch_id UUID;
  v_result JSONB;
  v_single_result JSONB;
BEGIN
  -- 배치 ID 생성
  v_batch_id := gen_random_uuid();
  v_total_count := jsonb_array_length(p_operations);
  
  -- 배치 로그 시작
  INSERT INTO audit_log (
    id, table_name, record_id, action, new_values,
    changed_by, changed_at
  ) VALUES (
    gen_random_uuid(), 'bulk_operations', v_batch_id::TEXT, 'START',
    jsonb_build_object(
      'operation_type', p_operation_type,
      'total_operations', v_total_count,
      'batch_id', v_batch_id
    ),
    p_processed_by, NOW()
  );
  
  -- 각 작업 처리
  FOR i IN 0..(v_total_count - 1) LOOP
    v_operation := p_operations -> i;
    
    BEGIN
      -- 작업 타입별 처리
      CASE p_operation_type
        WHEN 'stock_in' THEN
          SELECT process_stock_in(
            (v_operation ->> 'itemName')::TEXT,
            (v_operation ->> 'quantity')::INTEGER,
            (v_operation ->> 'unitPrice')::DECIMAL,
            COALESCE((v_operation ->> 'conditionType')::stock_condition, 'new'),
            (v_operation ->> 'reason')::TEXT,
            (v_operation ->> 'orderedBy')::TEXT,
            p_processed_by,
            (v_operation ->> 'notes')::TEXT
          ) INTO v_single_result;
          
        WHEN 'stock_out' THEN
          SELECT process_stock_out(
            (v_operation ->> 'itemId')::UUID,
            (v_operation ->> 'quantity')::INTEGER,
            (v_operation ->> 'project')::TEXT,
            (v_operation ->> 'notes')::TEXT,
            COALESCE((v_operation ->> 'isRental')::BOOLEAN, false),
            CASE 
              WHEN v_operation ? 'returnDate' THEN (v_operation ->> 'returnDate')::TIMESTAMPTZ
              ELSE NULL
            END,
            p_processed_by
          ) INTO v_single_result;
          
        WHEN 'stock_adjustment' THEN
          -- 재고 조정 로직 (간단 버전)
          UPDATE current_stock 
          SET 
            current_quantity = (v_operation ->> 'adjustedQuantity')::INTEGER,
            total_amount = unit_price * (v_operation ->> 'adjustedQuantity')::INTEGER,
            updated_at = NOW()
          WHERE id = (v_operation ->> 'itemId')::UUID;
          
          v_single_result := jsonb_build_object(
            'success', true,
            'item_id', v_operation ->> 'itemId',
            'adjusted_quantity', v_operation ->> 'adjustedQuantity'
          );
          
        ELSE
          v_single_result := jsonb_build_object(
            'success', false,
            'error', '지원하지 않는 작업 타입: ' || p_operation_type
          );
      END CASE;
      
      -- 결과 누적
      v_results := v_results || v_single_result;
      
      IF (v_single_result ->> 'success')::BOOLEAN THEN
        v_success_count := v_success_count + 1;
      ELSE
        v_error_count := v_error_count + 1;
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        v_single_result := jsonb_build_object(
          'success', false,
          'error', SQLERRM,
          'error_code', SQLSTATE,
          'operation_index', i
        );
        v_results := v_results || v_single_result;
        v_error_count := v_error_count + 1;
    END;
  END LOOP;
  
  -- 배치 완료 로그
  INSERT INTO audit_log (
    id, table_name, record_id, action, new_values,
    changed_by, changed_at
  ) VALUES (
    gen_random_uuid(), 'bulk_operations', v_batch_id::TEXT, 'COMPLETE',
    jsonb_build_object(
      'operation_type', p_operation_type,
      'total_operations', v_total_count,
      'success_count', v_success_count,
      'error_count', v_error_count,
      'batch_id', v_batch_id
    ),
    p_processed_by, NOW()
  );
  
  -- 최종 결과 반환
  v_result := jsonb_build_object(
    'success', v_error_count = 0,
    'batch_id', v_batch_id,
    'total_operations', v_total_count,
    'success_count', v_success_count,
    'error_count', v_error_count,
    'success_rate', 
      CASE 
        WHEN v_total_count > 0 THEN 
          ROUND((v_success_count::DECIMAL / v_total_count::DECIMAL) * 100, 2)
        ELSE 0 
      END,
    'results', array_to_json(v_results)::JSONB,
    'processed_at', NOW()
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- 전체 배치 실패
    INSERT INTO audit_log (
      id, table_name, record_id, action, new_values,
      changed_by, changed_at
    ) VALUES (
      gen_random_uuid(), 'bulk_operations', v_batch_id::TEXT, 'ERROR',
      jsonb_build_object(
        'operation_type', p_operation_type,
        'error', SQLERRM,
        'error_code', SQLSTATE,
        'batch_id', v_batch_id
      ),
      p_processed_by, NOW()
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'batch_id', v_batch_id,
      'error', 'Batch operation failed: ' || SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- 실행 권한 부여
GRANT EXECUTE ON FUNCTION process_bulk_operations TO authenticated;

-- 사용 예시:
/*
SELECT process_bulk_operations(
  '[
    {"itemName": "품목1", "quantity": 100, "unitPrice": 1000, "conditionType": "new"},
    {"itemName": "품목2", "quantity": 50, "unitPrice": 2000, "conditionType": "used_good"}
  ]'::jsonb,
  'stock_in',
  'admin@test.com'
);
*/
