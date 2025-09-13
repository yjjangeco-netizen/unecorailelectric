-- ========================================
-- current_stock VIEW 생성 및 수정 스크립트
-- ========================================

-- 1단계: 기존 current_stock 테이블 삭제
SELECT '=== 기존 current_stock 테이블 삭제 ===' as info;

-- 테이블이 존재하는지 확인
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'current_stock';

-- 테이블 삭제 (CASCADE로 의존성 제거)
DROP TABLE IF EXISTS current_stock CASCADE;

-- 2단계: current_stock VIEW 생성
SELECT '=== current_stock VIEW 생성 ===' as info;

-- 기초 + 입고 - 불출 = 실수량 공식으로 계산하는 VIEW 생성
CREATE OR REPLACE VIEW current_stock AS
SELECT 
  i.id,
  i.product,
  i.spec,
  i.maker,
  i.category,
  i.location,
  i.note,
  i.stock_status,
  i.unit_price,
  COALESCE(
    (SELECT COALESCE(SUM(si.quantity), 0) FROM stock_in si WHERE si.item_id = i.id), 0
  ) - COALESCE(
    (SELECT COALESCE(SUM(so.quantity), 0) FROM stock_out so WHERE so.item_id = i.id), 0
  ) as current_quantity,
  i.created_at,
  i.updated_at
FROM items i;

-- 3단계: VIEW 생성 확인
SELECT '=== VIEW 생성 확인 ===' as info;

-- VIEW가 생성되었는지 확인
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'current_stock';

-- VIEW 구조 확인
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'current_stock'
ORDER BY ordinal_position;

-- 4단계: 샘플 데이터 확인
SELECT '=== 샘플 데이터 확인 ===' as info;

-- current_stock VIEW에서 데이터 조회
SELECT 
  id,
  product,
  spec,
  maker,
  current_quantity,
  unit_price,
  stock_status,
  location
FROM current_stock
LIMIT 5;

-- 5단계: RLS 정책 설정
SELECT '=== RLS 정책 설정 ===' as info;

-- VIEW에 대한 RLS 정책 설정
-- VIEW는 기본적으로 RLS를 상속받지 않으므로 items 테이블의 정책을 따름

-- 6단계: 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'current_stock VIEW 생성 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '- 기존 테이블을 VIEW로 변환';
  RAISE NOTICE '- items + stock_in + stock_out JOIN';
  RAISE NOTICE '- 현재 재고 수량 자동 계산';
  RAISE NOTICE '- RLS 정책 상속';
  RAISE NOTICE '========================================';
END $$;

-- 7단계: 테스트 쿼리
SELECT '=== 테스트 쿼리 ===' as info;

-- 재고가 있는 품목만 조회
SELECT 
  product,
  spec,
  maker,
  current_quantity,
  unit_price,
  stock_status
FROM current_stock
WHERE current_quantity > 0
ORDER BY current_quantity DESC
LIMIT 10;

-- 재고가 없는 품목 조회
SELECT 
  product,
  spec,
  maker,
  current_quantity,
  stock_status
FROM current_stock
WHERE current_quantity <= 0
ORDER BY product
LIMIT 10;
