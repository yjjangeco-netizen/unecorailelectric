-- 재고 품목 삭제 함수
-- 이 함수는 current_stock, items, stock_in, stock_out 등 관련된 모든 데이터를 삭제합니다.

CREATE OR REPLACE FUNCTION delete_stock_item(
    p_item_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item_id INTEGER;
BEGIN
    -- UUID를 INTEGER로 변환 (items 테이블의 id는 INTEGER)
    BEGIN
        v_item_id := p_item_id::INTEGER;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION '잘못된 item_id 형식입니다: %', p_item_id;
    END;

    -- 트랜잭션 시작
    BEGIN
        -- 1. stock_out 테이블에서 관련 데이터 삭제
        DELETE FROM stock_out WHERE item_id = v_item_id;
        RAISE NOTICE 'stock_out 데이터 삭제 완료';

        -- 2. stock_in 테이블에서 관련 데이터 삭제
        DELETE FROM stock_in WHERE item_id = v_item_id;
        RAISE NOTICE 'stock_in 데이터 삭제 완료';

        -- 3. current_stock은 VIEW이므로 별도 삭제 불필요
        RAISE NOTICE 'current_stock VIEW는 items 테이블 기반이므로 별도 삭제 불필요';

        -- 4. items 테이블에서 기본 품목 데이터 삭제
        DELETE FROM items WHERE id = v_item_id;
        RAISE NOTICE 'items 데이터 삭제 완료';

        -- 5. stock_history 테이블에서 관련 데이터 삭제 (있는 경우)
        DELETE FROM stock_history WHERE item_id = p_item_id;
        RAISE NOTICE 'stock_history 데이터 삭제 완료';

        -- 6. audit_logs 테이블에서 관련 데이터 삭제 (있는 경우)
        DELETE FROM audit_logs WHERE details->>'item_id' = p_item_id;
        RAISE NOTICE 'audit_logs 데이터 삭제 완료';

        RAISE NOTICE '재고 품목 % 삭제가 완료되었습니다.', p_item_id;

    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION '재고 품목 삭제 중 오류 발생: %', SQLERRM;
    END;

END;
$$;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION delete_stock_item(TEXT) TO authenticated;
