-- ========================================
-- 권한 문제 해결 스크립트
-- current_stock VIEW와 items 테이블 권한 설정
-- ========================================

-- 1단계: 현재 권한 상태 확인
-- ========================================

SELECT '=== 현재 권한 상태 확인 ===' as info;

-- current_stock VIEW 권한 확인
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'current_stock'
AND table_schema = 'public';

-- items 테이블 권한 확인
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'items'
AND table_schema = 'public';

-- 2단계: 기존 권한 정책 정리
-- ========================================

-- 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "current_stock_read_policy" ON current_stock;
DROP POLICY IF EXISTS "dev_read_anyone" ON items;
DROP POLICY IF EXISTS "dev_read_anyone" ON current_stock;

-- 3단계: 테이블/VIEW 권한 재설정
-- ========================================

-- items 테이블에 대한 모든 권한 부여
GRANT ALL PRIVILEGES ON TABLE items TO authenticated;
GRANT ALL PRIVILEGES ON TABLE items TO anon;
GRANT ALL PRIVILEGES ON TABLE items TO service_role;

-- current_stock VIEW에 대한 읽기 권한 부여
GRANT SELECT ON current_stock TO authenticated;
GRANT SELECT ON current_stock TO anon;
GRANT SELECT ON current_stock TO service_role;

-- 4단계: RLS 정책 재설정
-- ========================================

-- items 테이블 RLS 활성화
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- items 테이블에 대한 읽기 정책 (모든 사용자)
CREATE POLICY "items_read_policy" ON items
FOR SELECT USING (true);

-- items 테이블에 대한 쓰기 정책 (인증된 사용자)
CREATE POLICY "items_write_policy" ON items
FOR ALL USING (auth.role() = 'authenticated');

-- current_stock VIEW에 대한 읽기 정책 (모든 사용자)
CREATE POLICY "current_stock_read_policy" ON current_stock
FOR SELECT USING (true);

-- 5단계: 시퀀스 권한 설정 (UUID 사용 시)
-- ========================================

-- gen_random_uuid() 함수 권한 확인
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'gen_random_uuid'
AND routine_schema = 'pg_catalog';

-- 6단계: 스키마 권한 설정
-- ========================================

-- public 스키마 사용 권한
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO service_role;

-- 7단계: 테이블 생성 권한
-- ========================================

-- authenticated 사용자가 테이블을 생성할 수 있도록 권한 부여
GRANT CREATE ON SCHEMA public TO authenticated;

-- 8단계: 권한 테스트
-- ========================================

-- 권한 테스트를 위한 간단한 쿼리 실행
SELECT '=== 권한 테스트 시작 ===' as info;

-- current_stock VIEW 조회 테스트
SELECT COUNT(*) as current_stock_count FROM current_stock;

-- items 테이블 조회 테스트
SELECT COUNT(*) as items_count FROM items;

-- 9단계: 최종 권한 상태 확인
-- ========================================

SELECT '=== 최종 권한 상태 ===' as info;

-- current_stock VIEW 최종 권한
SELECT 
    'current_stock' as object_name,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'current_stock'
AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- items 테이블 최종 권한
SELECT 
    'items' as object_name,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'items'
AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- 10단계: 완료 메시지
-- ========================================

SELECT '✅ 권한 문제 해결 완료!' as result;
SELECT '✅ current_stock VIEW와 items 테이블에 대한 모든 권한이 설정되었습니다.' as result;
SELECT '✅ 이제 PostgREST에서 정상적으로 데이터를 조회할 수 있습니다.' as result;
SELECT '✅ 재고 관리 페이지를 새로고침하여 테스트해보세요.' as result;
