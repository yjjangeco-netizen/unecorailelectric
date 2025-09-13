import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export async function POST() {
  try {
    const supabase = createServerSupabaseClient()
    
    console.log('=== 데이터베이스 트리거 적용 시작 ===')
    
    // 1. 기존 트리거 삭제
    const dropTriggersSQL = `
      DROP TRIGGER IF EXISTS trg_stock_in_update ON stock_history;
      DROP TRIGGER IF EXISTS trg_stock_out_update ON stock_history;
      DROP TRIGGER IF EXISTS trg_stock_adjustment_update ON stock_history;
    `
    
    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropTriggersSQL })
    if (dropError) {
      console.warn('기존 트리거 삭제 중 오류 (무시 가능):', dropError.message)
    }
    
    // 2. 통합 트리거 함수 생성
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION update_item_quantities()
      RETURNS TRIGGER AS $$
      DECLARE
        v_item_id TEXT;
        v_event_type TEXT;
        v_quantity INTEGER;
        v_closing_qty INTEGER;
        v_stock_in INTEGER;
        v_stock_out INTEGER;
        v_new_current_qty INTEGER;
      BEGIN
        -- 트리거 컨텍스트에서 값 추출
        IF TG_OP = 'DELETE' THEN
          v_item_id := OLD.item_id;
          v_event_type := OLD.event_type;
          v_quantity := OLD.quantity;
        ELSE
          v_item_id := NEW.item_id;
          v_event_type := NEW.event_type;
          v_quantity := NEW.quantity;
        END IF;

        -- 현재 재고 정보 조회
        SELECT closing_quantity, stock_in, stock_out
        INTO v_closing_qty, v_stock_in, v_stock_out
        FROM items
        WHERE id = v_item_id;

        -- 이벤트 타입에 따른 수량 조정
        IF TG_OP = 'DELETE' THEN
          -- 삭제 시 원래 수량을 빼기
          CASE v_event_type
            WHEN 'IN', 'PLUS', 'ADJUSTMENT' THEN
              v_stock_in := v_stock_in - v_quantity;
            WHEN 'OUT', 'MINUS', 'DISPOSAL' THEN
              v_stock_out := v_stock_out - v_quantity;
          END CASE;
        ELSE
          -- 삽입/업데이트 시 수량 추가
          CASE v_event_type
            WHEN 'IN', 'PLUS', 'ADJUSTMENT' THEN
              v_stock_in := v_stock_in + v_quantity;
            WHEN 'OUT', 'MINUS', 'DISPOSAL' THEN
              v_stock_out := v_stock_out + v_quantity;
          END CASE;
        END IF;

        -- 현재고 계산: 현재고 = 마감수량 + 입고수량 - 출고수량
        v_new_current_qty := COALESCE(v_closing_qty, 0) + COALESCE(v_stock_in, 0) - COALESCE(v_stock_out, 0);

        -- items 테이블 업데이트
        UPDATE items
        SET 
          current_quantity = v_new_current_qty,
          stock_in = COALESCE(v_stock_in, 0),
          stock_out = COALESCE(v_stock_out, 0),
          stock_status = CASE 
            WHEN v_new_current_qty > min_stock THEN 'normal'
            WHEN v_new_current_qty > 0 THEN 'low_stock'
            ELSE 'out_of_stock'
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = v_item_id;

        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `
    
    const { error: functionError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL })
    if (functionError) {
      throw new Error(`트리거 함수 생성 실패: ${functionError.message}`)
    }
    
    // 3. 통합 트리거 생성
    const createTriggerSQL = `
      CREATE TRIGGER trg_stock_history_update
        AFTER INSERT OR UPDATE OR DELETE ON stock_history
        FOR EACH ROW
        EXECUTE FUNCTION update_item_quantities();
    `
    
    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: createTriggerSQL })
    if (triggerError) {
      throw new Error(`트리거 생성 실패: ${triggerError.message}`)
    }
    
    // 4. 기존 데이터 재계산
    const updateSQL = `
      UPDATE items 
      SET 
        current_quantity = COALESCE(closing_quantity, 0) + COALESCE(stock_in, 0) - COALESCE(stock_out, 0),
        updated_at = CURRENT_TIMESTAMP
    `
    
    const { error: updateError } = await supabase.rpc('exec_sql', { sql: updateSQL })
    
    if (updateError) {
      console.warn('기존 데이터 재계산 중 오류:', updateError.message)
    }
    
    console.log('=== 데이터베이스 트리거 적용 완료 ===')
    
    return NextResponse.json({
      success: true,
      message: '데이터베이스 트리거가 성공적으로 적용되었습니다.',
      appliedAt: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('트리거 적용 오류:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}
