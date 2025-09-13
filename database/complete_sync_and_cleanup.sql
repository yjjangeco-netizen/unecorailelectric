-- ========================================
-- items와 current_stock 테이블 완전 동기화 및 정리
-- 한 번에 실행하는 통합 스크립트
-- ========================================

-- 1단계: current_stock 테이블에 (name, specification) 유니크 제약조건 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'current_stock_name_spec_unique' 
    AND table_name = 'current_stock'
  ) THEN
    ALTER TABLE current_stock 
    ADD CONSTRAINT current_stock_name_spec_unique 
    UNIQUE (name, specification);
    RAISE NOTICE '제약조건 추가 완료: current_stock_name_spec_unique';
  ELSE
    RAISE NOTICE '제약조건이 이미 존재합니다: current_stock_name_spec_unique';
  END IF;
END $$;

-- 2단계: 중복 항목 제거 (items 테이블)
-- 중복된 항목 중 가장 최근에 생성된 것만 유지
DELETE FROM items 
WHERE id NOT IN (
  SELECT MAX(id)
  FROM items
  GROUP BY product, spec
);

-- 3단계: 중복 항목 제거 (current_stock 테이블)
-- 중복된 항목 중 가장 최근에 업데이트된 것만 유지
DELETE FROM current_stock 
WHERE id NOT IN (
  SELECT MAX(id)
  FROM current_stock
  GROUP BY name, specification
);

-- 4단계: NULL 또는 빈 문자열 데이터 제거
DELETE FROM items 
WHERE product IS NULL OR TRIM(product) = '';

DELETE FROM current_stock 
WHERE name IS NULL OR TRIM(name) = '';

-- 5단계: items 테이블의 stock_status가 "normal"인 경우 "new"로 수정
UPDATE items 
SET stock_status = 'new'
WHERE stock_status = 'normal';

-- 6단계: current_stock 테이블에 누락된 데이터 추가
INSERT INTO current_stock (
  name, specification, maker, location, stock_status, 
  current_quantity, unit_price, in_data, out_data, total_qunty
)
SELECT 
  product as name,
  spec as specification,
  maker,
  '창고A' as location,
  stock_status,
  COALESCE(current_quantity, 0) as current_quantity,
  unit_price,
  0 as in_data,
  0 as out_data,
  COALESCE(current_quantity, 0) as total_qunty
FROM items
WHERE product NOT IN (
  SELECT name FROM current_stock
);

-- 7단계: current_stock 테이블의 current_quantity를 total_qunty와 동기화
UPDATE current_stock 
SET current_quantity = total_qunty
WHERE current_quantity = 0;

-- 8단계: 자동 동기화 트리거 함수 생성
CREATE OR REPLACE FUNCTION sync_current_stock_on_items_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO current_stock (
    name, specification, maker, location, stock_status, 
    current_quantity, unit_price, in_data, out_data, total_qunty
  ) VALUES (
    NEW.product,
    NEW.spec,
    NEW.maker,
    '창고A',
    NEW.stock_status,
    COALESCE(NEW.current_quantity, 0),
    NEW.unit_price,
    0,
    0,
    COALESCE(NEW.current_quantity, 0)
  )
  ON CONFLICT (name, specification) DO UPDATE SET
    maker = EXCLUDED.maker,
    unit_price = EXCLUDED.unit_price,
    stock_status = EXCLUDED.stock_status,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_current_stock_on_items_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE current_stock 
  SET 
    maker = NEW.maker,
    unit_price = NEW.unit_price,
    stock_status = NEW.stock_status,
    updated_at = NOW()
  WHERE name = NEW.product AND specification = NEW.spec;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9단계: 트리거 생성
DROP TRIGGER IF EXISTS trigger_sync_current_stock_insert ON items;
CREATE TRIGGER trigger_sync_current_stock_insert
  AFTER INSERT ON items
  FOR EACH ROW
  EXECUTE FUNCTION sync_current_stock_on_items_insert();

DROP TRIGGER IF EXISTS trigger_sync_current_stock_update ON items;
CREATE TRIGGER trigger_sync_current_stock_update
  AFTER UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION sync_current_stock_on_items_update();

-- 10단계: 완료 메시지 및 결과 확인
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '완전 동기화 및 정리 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '1. 제약조건 추가 완료';
  RAISE NOTICE '2. 중복 항목 제거 완료';
  RAISE NOTICE '3. NULL 데이터 정리 완료';
  RAISE NOTICE '4. stock_status 정규화 완료';
  RAISE NOTICE '5. 데이터 동기화 완료';
  RAISE NOTICE '6. 자동 동기화 트리거 생성 완료';
  RAISE NOTICE '========================================';
END $$;

-- 11단계: 최종 결과 확인
SELECT '=== 최종 데이터 상태 ===' as info;
SELECT 
  'items 테이블' as table_name,
  COUNT(*) as total_count,
  COUNT(DISTINCT product) as unique_products,
  COUNT(DISTINCT (product, spec)) as unique_product_specs
FROM items
UNION ALL
SELECT 
  'current_stock 테이블' as table_name,
  COUNT(*) as total_count,
  COUNT(DISTINCT name) as unique_names,
  COUNT(DISTINCT (name, specification)) as unique_name_specs
FROM current_stock;

-- 12단계: 트리거 확인
SELECT '=== 생성된 트리거 ===' as info;
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'items'
ORDER BY trigger_name;

-- 13단계: items 테이블의 stock_status 분포 확인
SELECT '=== items.stock_status 분포 ===' as info;
SELECT 
  stock_status,
  COUNT(*) as count
FROM items 
GROUP BY stock_status
ORDER BY count DESC;
