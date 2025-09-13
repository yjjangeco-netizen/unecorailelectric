-- 인덱스 생성 및 RLS 정책 설정

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_items_product ON items(product);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_current_stock_item ON current_stock(item_id);
CREATE INDEX IF NOT EXISTS idx_current_stock_product ON current_stock(product);
CREATE INDEX IF NOT EXISTS idx_stock_in_item ON stock_in(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_in_date ON stock_in(received_at);
CREATE INDEX IF NOT EXISTS idx_stock_out_item ON stock_out(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_out_date ON stock_out(issued_at);

-- RLS 정책 설정 (임시로 읽기 허용)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_in ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_out ENABLE ROW LEVEL SECURITY;

-- 임시 읽기 정책 (개발용 - 운영 전 철회 필수)
CREATE POLICY "dev_read_anyone" ON items FOR SELECT USING (true);
CREATE POLICY "dev_read_anyone" ON current_stock FOR SELECT USING (true);
CREATE POLICY "dev_read_anyone" ON stock_in FOR SELECT USING (true);
CREATE POLICY "dev_read_anyone" ON stock_out FOR SELECT USING (true);
