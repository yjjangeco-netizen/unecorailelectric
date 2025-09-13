-- ========================================
-- items와 current_stock 테이블 자동 동기화 트리거
-- ========================================

-- 1단계: items 테이블에 INSERT 시 current_stock 자동 생성
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

-- 2단계: items 테이블에 UPDATE 시 current_stock 자동 업데이트
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

-- 3단계: 트리거 생성
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

-- 4단계: 트리거 확인
SELECT '=== 트리거 생성 완료 ===' as info;
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'items'
ORDER BY trigger_name;
