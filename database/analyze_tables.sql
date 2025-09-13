-- 현재 테이블 구조 분석
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name IN ('items', 'current_stock', 'stock_in', 'stock_out')
ORDER BY table_name, ordinal_position;
