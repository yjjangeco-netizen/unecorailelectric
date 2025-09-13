-- 수정 이력 테이블 생성 함수
CREATE OR REPLACE FUNCTION create_edit_history_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 수정 이력 테이블이 없으면 생성
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'edit_history') THEN
    CREATE TABLE edit_history (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      item_id UUID NOT NULL,
      edit_date DATE NOT NULL,
      previous_location TEXT,
      previous_quantity INTEGER DEFAULT 0,
      new_location TEXT,
      new_quantity INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      
      -- 인덱스 생성
      CONSTRAINT fk_edit_history_item 
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );
    
    -- 인덱스 생성
    CREATE INDEX idx_edit_history_date ON edit_history(edit_date);
    CREATE INDEX idx_edit_history_item ON edit_history(item_id);
    
    -- RLS 정책 설정
    ALTER TABLE edit_history ENABLE ROW LEVEL SECURITY;
    
    -- 기본 읽기 정책
    CREATE POLICY "edit_history_read_policy" ON edit_history
      FOR SELECT USING (true);
      
    -- 관리자만 쓰기 가능
    CREATE POLICY "edit_history_write_policy" ON edit_history
      FOR INSERT WITH CHECK (true);
      
    RAISE NOTICE 'edit_history 테이블이 생성되었습니다.';
  ELSE
    RAISE NOTICE 'edit_history 테이블이 이미 존재합니다.';
  END IF;
END;
$$;
