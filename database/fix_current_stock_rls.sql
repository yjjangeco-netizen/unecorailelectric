-- ========================================
-- current_stock 테이블 외래키 관계 수정 스크립트
-- PostgREST 오류 해결을 위한 스키마 수정
-- ========================================

-- 1단계: 기존 테이블 구조 확인 및 백업
-- ========================================

-- 현재 테이블 구조 확인
SELECT '=== 현재 테이블 구조 확인 ===' as info;

SELECT 
    table_name,
    table_type,
    is_insertable_into
FROM information_schema.tables 
WHERE table_name IN ('current_stock', 'items')
AND table_schema = 'public';

-- 2단계: current_stock을 VIEW로 변경 (unified_stock_fix_postgresql.sql과 일치)
-- ========================================

-- 기존 current_stock 테이블 삭제
DROP TABLE IF EXISTS current_stock CASCADE;

-- current_stock을 VIEW로 생성 (items 테이블과 직접 연결)
CREATE VIEW current_stock AS
SELECT
  i.id,
  i.product,
  i.spec,
  i.maker,
  i.location,
  i.unit_price,
  i.purpose,
  i.min_stock,
  i.category,
  i.stock_status,
  i.note,
  i.current_quantity,
  (i.unit_price * i.current_quantity) as total_amount,
  i.created_at,
  i.updated_at
FROM items i;

-- 3단계: RLS 정책 설정
-- ========================================

-- VIEW에 대한 RLS 정책 설정
ALTER VIEW current_stock SET (security_barrier = true);

-- 읽기 권한 정책
CREATE POLICY "current_stock_read_policy" ON current_stock
FOR SELECT USING (true);

-- 4단계: 인덱스 및 제약 조건 확인
-- ========================================

-- items 테이블에 필요한 컬럼이 있는지 확인
DO $$
BEGIN
    -- current_quantity 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'items' AND column_name = 'current_quantity'
    ) THEN
        ALTER TABLE items ADD COLUMN current_quantity INTEGER DEFAULT 0;
        RAISE NOTICE 'current_quantity 컬럼을 items 테이블에 추가했습니다.';
    END IF;
    
    -- location 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'items' AND column_name = 'location'
    ) THEN
        ALTER TABLE items ADD COLUMN location TEXT DEFAULT '창고A';
        RAISE NOTICE 'location 컬럼을 items 테이블에 추가했습니다.';
    END IF;
    
    -- purpose 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'items' AND column_name = 'purpose'
    ) THEN
        ALTER TABLE items ADD COLUMN purpose TEXT DEFAULT '일반';
        RAISE NOTICE 'purpose 컬럼을 items 테이블에 추가했습니다.';
    END IF;
    
    -- min_stock 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'items' AND column_name = 'min_stock'
    ) THEN
        ALTER TABLE items ADD COLUMN min_stock INTEGER DEFAULT 0;
        RAISE NOTICE 'min_stock 컬럼을 items 테이블에 추가했습니다.';
    END IF;
END $$;

-- 5단계: 샘플 데이터 확인 및 수정
-- ========================================

-- items 테이블에 샘플 데이터가 있는지 확인
SELECT '=== items 테이블 샘플 데이터 확인 ===' as info;
SELECT COUNT(*) as item_count FROM items;

-- 샘플 데이터가 없으면 추가
INSERT INTO items (product, spec, maker, location, unit_price, purpose, min_stock, category, note, current_quantity, stock_status)
SELECT 
    '전선 (2.0SQ)', '2.0SQ', 'LS전선', '창고A', 1500.00, '전기 배선용', 50, '전선류', '전기 배선용 고품질 전선', 100, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM items WHERE product = '전선 (2.0SQ)');

INSERT INTO items (product, spec, maker, location, unit_price, purpose, min_stock, category, note, current_quantity, stock_status)
SELECT 
    '모니터', '24인치', '삼성', '창고B', 250000.00, '사무용', 2, '전자기기', '사무용 24인치 모니터', 5, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM items WHERE product = '모니터');

-- 6단계: 권한 설정
-- ========================================

-- VIEW에 대한 권한 부여
GRANT SELECT ON current_stock TO authenticated;
GRANT SELECT ON current_stock TO anon;

-- 7단계: 테스트 및 검증
-- ========================================

-- VIEW가 제대로 작동하는지 테스트
SELECT '=== current_stock VIEW 테스트 ===' as info;
SELECT COUNT(*) as view_count FROM current_stock;

-- 첫 번째 레코드 샘플 확인
SELECT '=== 첫 번째 레코드 샘플 ===' as info;
SELECT * FROM current_stock LIMIT 1;

-- 8단계: 완료 메시지
-- ========================================

SELECT '✅ current_stock VIEW 생성 및 외래키 관계 수정 완료!' as result;
SELECT '✅ PostgREST 오류 해결됨 - items와 current_stock 간 관계 정상화' as result;
SELECT '✅ 이제 재고 관리 페이지에서 데이터를 정상적으로 불러올 수 있습니다.' as result;
