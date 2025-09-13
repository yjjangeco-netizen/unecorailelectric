-- ========================================
-- 품목상태 매핑 문제 해결 스크립트
-- "알 수 없음" 상태를 올바른 값으로 변환
-- ========================================

-- 1단계: 기존 데이터 백업
CREATE TABLE IF NOT EXISTS stock_history_backup AS SELECT * FROM stock_history;
CREATE TABLE IF NOT EXISTS items_backup AS SELECT * FROM items;

-- 2단계: stock_history 테이블의 condition_type 수정
-- 'unknown' 값을 'new'로 변경
UPDATE stock_history 
SET condition_type = 'new' 
WHERE condition_type = 'unknown' OR condition_type IS NULL;

-- 3단계: items 테이블의 stock_status 수정
-- 'normal' 값을 'new'로 변경
UPDATE items 
SET stock_status = 'new' 
WHERE stock_status = 'normal' OR stock_status IS NULL;

-- 4단계: 제약조건 확인 및 수정
-- stock_history.condition_type 제약조건 수정
DO $$
BEGIN
  -- 기존 제약조건 삭제
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'stock_history_condition_type_check'
  ) THEN
    ALTER TABLE stock_history DROP CONSTRAINT stock_history_condition_type_check;
  END IF;
  
  -- 새로운 제약조건 추가
  ALTER TABLE stock_history 
  ADD CONSTRAINT stock_history_condition_type_check 
  CHECK (condition_type IN ('new', 'used-new', 'used-used', 'broken'));
END $$;

-- items.stock_status 제약조건 수정
DO $$
BEGIN
  -- 기존 제약조건 삭제
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'items_stock_status_check'
  ) THEN
    ALTER TABLE items DROP CONSTRAINT items_stock_status_check;
  END IF;
  
  -- 새로운 제약조건 추가
  ALTER TABLE items 
  ADD CONSTRAINT items_stock_status_check 
  CHECK (stock_status IN ('new', 'used-new', 'used-used', 'broken'));
END $$;

-- 5단계: 기본값 설정
-- stock_history.condition_type 기본값을 'new'로 설정
ALTER TABLE stock_history ALTER COLUMN condition_type SET DEFAULT 'new';

-- items.stock_status 기본값을 'new'로 설정
ALTER TABLE items ALTER COLUMN stock_status SET DEFAULT 'new';

-- 6단계: 데이터 검증
-- 수정된 데이터 확인
SELECT 
  'stock_history' as table_name,
  condition_type,
  COUNT(*) as count
FROM stock_history 
GROUP BY condition_type
UNION ALL
SELECT 
  'items' as table_name,
  stock_status,
  COUNT(*) as count
FROM items 
GROUP BY stock_status;

-- 7단계: 인덱스 최적화
-- 품목상태 관련 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_stock_history_condition_type ON stock_history(condition_type);
CREATE INDEX IF NOT EXISTS idx_items_stock_status ON items(stock_status);

-- 8단계: 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '품목상태 매핑 수정 완료!';
  RAISE NOTICE '- stock_history.condition_type: unknown -> new';
  RAISE NOTICE '- items.stock_status: normal -> new';
  RAISE NOTICE '- 제약조건 및 기본값 업데이트 완료';
END $$;
