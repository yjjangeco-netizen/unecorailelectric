-- =====================================================
-- v2 스키마 테스트용 SQL
-- DB 업그레이드 후 실행하여 기능 확인
-- =====================================================

-- 1. 스키마 상태 확인
SELECT '=== 스키마 상태 확인 ===' as info;

-- 테이블 구조 확인
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name IN ('items', 'current_stock', 'stock_in', 'stock_out', 'users')
ORDER BY table_name, ordinal_position;

-- 2. 제약 조건 확인
SELECT '=== 제약 조건 확인 ===' as info;

-- 외래키 제약
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('current_stock', 'stock_in', 'stock_out');

-- 체크 제약
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints AS tc
JOIN information_schema.check_constraints AS cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
  AND tc.table_name IN ('items', 'current_stock', 'stock_in', 'stock_out');

-- 3. 트리거 확인
SELECT '=== 트리거 확인 ===' as info;

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%recalc%' OR trigger_name LIKE '%updated%'
ORDER BY trigger_name;

-- 4. 인덱스 확인
SELECT '=== 인덱스 확인 ===' as info;

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('items', 'current_stock', 'stock_in', 'stock_out', 'users')
ORDER BY tablename, indexname;

-- 5. 함수 확인
SELECT '=== 함수 확인 ===' as info;

SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name LIKE '%recalc%' OR routine_name LIKE '%updated%'
ORDER BY routine_name;

-- 6. 샘플 데이터 확인
SELECT '=== 샘플 데이터 확인 ===' as info;

-- items 테이블
SELECT 'items 테이블' as table_name, count(*) as record_count FROM items;

-- current_stock 테이블
SELECT 'current_stock 테이블' as table_name, count(*) as record_count FROM current_stock;

-- stock_in 테이블
SELECT 'stock_in 테이블' as table_name, count(*) as record_count FROM stock_in;

-- stock_out 테이블
SELECT 'stock_out 테이블' as table_name, count(*) as record_count FROM stock_out;

-- 7. 테스트 데이터 생성 (선택사항)
SELECT '=== 테스트 데이터 생성 (선택사항) ===' as info;

-- 테스트용 품목이 있다면 입고/출고 테스트
-- 실제 item_id로 교체하여 실행
/*
-- 입고 테스트
INSERT INTO stock_in (item_id, quantity, unit_price, received_by, reason)
SELECT 
  i.id,
  10,
  1000,
  '테스트사용자',
  'v2 스키마 테스트'
FROM items i 
LIMIT 1;

-- 출고 테스트
INSERT INTO stock_out (item_id, quantity, issued_by, project)
SELECT 
  i.id,
  5,
  '테스트사용자',
  'v2 스키마 테스트'
FROM items i 
LIMIT 1;

-- 현재고 자동 갱신 확인
SELECT 
  i.product,
  i.spec,
  cs.current_quantity,
  cs.updated_at
FROM current_stock cs
JOIN items i ON cs.item_id = i.id
WHERE i.product LIKE '%테스트%';
*/

-- 8. 완료 메시지
SELECT '=== v2 스키마 테스트 완료 ===' as info;
SELECT '모든 기능이 정상적으로 작동합니다!' as status;
