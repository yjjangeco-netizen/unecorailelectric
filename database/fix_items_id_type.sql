-- items 테이블의 id 컬럼을 UUID에서 INTEGER로 변경
-- UUID 타입 오류 해결

-- 1. 기존 테이블 백업 (선택사항)
-- CREATE TABLE items_backup AS SELECT * FROM items;

-- 2. 기존 제약조건 및 인덱스 삭제
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_pkey CASCADE;
ALTER TABLE current_stock DROP CONSTRAINT IF EXISTS current_stock_item_id_fkey CASCADE;
ALTER TABLE stock_in DROP CONSTRAINT IF EXISTS stock_in_item_id_fkey CASCADE;
ALTER TABLE stock_out DROP CONSTRAINT IF EXISTS stock_out_item_id_fkey CASCADE;

-- 3. id 컬럼 타입을 INTEGER로 변경
ALTER TABLE items ALTER COLUMN id TYPE INTEGER USING 
  CASE 
    WHEN id ~ '^[0-9]+$' THEN id::INTEGER 
    ELSE 1 
  END;

-- 4. 기본키 제약조건 재생성
ALTER TABLE items ADD CONSTRAINT items_pkey PRIMARY KEY (id);

-- 5. 시퀀스 생성 (자동 증가용)
CREATE SEQUENCE IF NOT EXISTS items_id_seq START 1;
ALTER TABLE items ALTER COLUMN id SET DEFAULT nextval('items_id_seq');

-- 6. 외래키 제약조건 재생성
ALTER TABLE current_stock ADD CONSTRAINT current_stock_item_id_fkey 
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;

ALTER TABLE stock_in ADD CONSTRAINT stock_in_item_id_fkey 
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;

ALTER TABLE stock_out ADD CONSTRAINT stock_out_item_id_fkey 
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;

-- 7. 권한 설정
GRANT ALL PRIVILEGES ON TABLE items TO authenticated;
GRANT ALL PRIVILEGES ON TABLE items TO anon;
GRANT ALL PRIVILEGES ON TABLE items TO service_role;

GRANT USAGE ON SEQUENCE items_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE items_id_seq TO anon;
GRANT USAGE ON SEQUENCE items_id_seq TO service_role;

-- 8. RLS 정책 재설정
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "items_read_policy" ON items;
DROP POLICY IF EXISTS "items_write_policy" ON items;

CREATE POLICY "items_read_policy" ON items FOR SELECT USING (true);
CREATE POLICY "items_write_policy" ON items FOR ALL USING (auth.role() = 'authenticated');

-- 9. 확인
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'items' AND column_name = 'id';
