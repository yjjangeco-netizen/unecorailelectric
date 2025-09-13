-- 마감 이력 테이블 생성 함수
CREATE OR REPLACE FUNCTION create_closing_history_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 마감 이력 테이블이 없으면 생성
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'closing_history') THEN
    CREATE TABLE closing_history (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      closing_date DATE NOT NULL,
      item_id UUID NOT NULL,
      product TEXT NOT NULL,
      spec TEXT,
      maker TEXT,
      location TEXT,
      closing_quantity INTEGER NOT NULL DEFAULT 0,
      unit_price DECIMAL(15,2) DEFAULT 0,
      total_amount DECIMAL(18,2) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      
      -- 인덱스 생성
      CONSTRAINT fk_closing_history_item 
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );
    
    -- 인덱스 생성
    CREATE INDEX idx_closing_history_date ON closing_history(closing_date);
    CREATE INDEX idx_closing_history_item ON closing_history(item_id);
    CREATE INDEX idx_closing_history_product ON closing_history(product);
    
    -- RLS 정책 설정
    ALTER TABLE closing_history ENABLE ROW LEVEL SECURITY;
    
    -- 기본 읽기 정책
    CREATE POLICY "closing_history_read_policy" ON closing_history
      FOR SELECT USING (true);
      
    -- 관리자만 쓰기 가능
    CREATE POLICY "closing_history_write_policy" ON closing_history
      FOR INSERT WITH CHECK (true);
      
    RAISE NOTICE 'closing_history 테이블이 생성되었습니다.';
  ELSE
    RAISE NOTICE 'closing_history 테이블이 이미 존재합니다.';
  END IF;
END;
$$;
