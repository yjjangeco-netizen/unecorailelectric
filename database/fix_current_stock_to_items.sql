-- ========================================
-- current_stock 테이블을 items 테이블로 통합하는 스크립트
-- ========================================

-- 1단계: 기존 current_stock 테이블 삭제 (VIEW가 아닌 경우)
SELECT '=== current_stock 테이블 삭제 ===' as info;

-- 테이블인지 VIEW인지 확인
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'current_stock';

-- 테이블인 경우 삭제
DROP TABLE IF EXISTS current_stock CASCADE;

-- 2단계: current_stock VIEW 생성 (items 테이블 기반)
SELECT '=== current_stock VIEW 생성 ===' as info;

CREATE VIEW current_stock AS
SELECT
  i.id,
  i.product,
  i.spec,
  i.maker,
  i.category,
  i.unit_price,
  i.purpose,
  i.min_stock,
  i.note,
  i.stock_status,
  i.current_quantity,
  i.location,
  (i.unit_price * i.current_quantity) as total_amount,
  i.created_at,
  i.updated_at
FROM items i;

-- 3단계: RLS 정책 설정
SELECT '=== RLS 정책 설정 ===' as info;

-- current_stock VIEW에 대한 RLS 정책
ALTER VIEW current_stock SET (security_invoker = true);

-- 4단계: 권한 설정
SELECT '=== 권한 설정 ===' as info;

-- current_stock VIEW에 대한 권한 부여
GRANT SELECT ON current_stock TO authenticated;
GRANT SELECT ON current_stock TO anon;

-- 5단계: 테스트 데이터 확인
SELECT '=== 테스트 데이터 확인 ===' as info;

-- items 테이블 데이터 확인
SELECT COUNT(*) as items_count FROM items;

-- current_stock VIEW 데이터 확인
SELECT COUNT(*) as current_stock_count FROM current_stock;

-- 6단계: 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'current_stock 테이블을 items 테이블로 통합 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '- current_stock은 이제 items 테이블 기반 VIEW';
  RAISE NOTICE '- 모든 재고 데이터는 items 테이블에서 관리';
  RAISE NOTICE '- current_stock VIEW는 자동으로 items 변경사항 반영';
  RAISE NOTICE '========================================';
END $$;
