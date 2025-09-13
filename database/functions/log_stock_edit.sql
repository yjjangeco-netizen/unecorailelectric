-- 수정 로그 저장 함수
CREATE OR REPLACE FUNCTION log_stock_edit(
    p_user_id TEXT,
    p_item_id TEXT,
    p_old_data JSONB,
    p_new_data JSONB,
    p_edit_date TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 수정 로그 저장
    INSERT INTO public.audit_logs (
        action,
        user_id,
        timestamp,
        details
    ) VALUES (
        'STOCK_EDIT',
        p_user_id,
        NOW(),
        jsonb_build_object(
            'item_id', p_item_id,
            'edit_date', p_edit_date,
            'old_data', p_old_data,
            'new_data', p_new_data,
            'changes', p_new_data - p_old_data
        )
    );
    
    RAISE NOTICE '수정 로그가 저장되었습니다: 사용자 %가 품목 %을 수정함', p_user_id, p_item_id;
END;
$$;

-- 함수 권한 설정
GRANT EXECUTE ON FUNCTION log_stock_edit(TEXT, TEXT, JSONB, JSONB, TEXT) TO authenticated;
