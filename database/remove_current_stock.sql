-- ========================================
-- current_stock VIEW 완전 삭제
-- ========================================

-- 1단계: current_stock VIEW 삭제
SELECT '=== current_stock VIEW 삭제 ===' as info;

-- VIEW가 존재하는지 확인
SELECT 
  viewname,
  definition
FROM pg_views 
WHERE viewname = 'current_stock';

-- VIEW 삭제 (CASCADE로 의존성 제거)
DROP VIEW IF EXISTS current_stock CASCADE;

-- 2단계: 삭제 확인
SELECT '=== 삭제 확인 ===' as info;

-- current_stock이 더 이상 존재하지 않는지 확인
SELECT 
  viewname
FROM pg_views 
WHERE viewname = 'current_stock';

-- 3단계: items 테이블만 남아있는지 확인
SELECT '=== items 테이블 확인 ===' as info;

SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'items';

-- 4단계: 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'current_stock VIEW 삭제 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '- current_stock VIEW 완전 제거';
  RAISE NOTICE '- items 테이블만 사용';
  RAISE NOTICE '- 프론트엔드에서 items 테이블 직접 조회';
  RAISE NOTICE '========================================';
END $$;
