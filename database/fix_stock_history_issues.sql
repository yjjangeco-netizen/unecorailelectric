-- ========================================
-- stock_history 테이블 문제 수정
-- ========================================

-- 1단계: event_type 대소문자 통일
-- 'in'을 'IN'으로, 'out'을 'OUT'으로 통일
UPDATE stock_history
SET event_type = UPPER(event_type)
WHERE event_type IN ('in', 'out');

-- 2단계: event_type 값 검증 및 수정
-- 유효하지 않은 event_type 값들을 'IN'으로 수정
UPDATE stock_history
SET event_type = 'IN'
WHERE event_type NOT IN ('IN', 'OUT', 'PLUS', 'MINUS', 'DISPOSAL');

-- 3단계: event_type 분포 확인
SELECT '=== event_type 분포 확인 ===' as info;
SELECT
  event_type,
  COUNT(*) as count
FROM stock_history
GROUP BY event_type
ORDER BY count DESC;

-- 4단계: 이상한 unit_price 값 확인
SELECT '=== 이상한 unit_price 값 확인 ===' as info;
SELECT
  id,
  item_id,
  event_type,
  quantity,
  unit_price,
  created_at
FROM stock_history
WHERE unit_price > 100000
ORDER BY unit_price DESC;

-- 5단계: unit_price 정규화 (너무 높은 값 조정)
-- 150,000원 이상인 경우 15,000원으로 조정
UPDATE stock_history
SET unit_price = 15000
WHERE unit_price > 100000;

-- 6단계: 동일 item_id에 대한 중복/이상 기록 확인
SELECT '=== 동일 item_id 중복/이상 기록 확인 ===' as info;
SELECT
  item_id,
  COUNT(*) as record_count,
  COUNT(DISTINCT event_type) as event_types,
  COUNT(DISTINCT DATE(event_date)) as dates,
  MIN(created_at) as first_record,
  MAX(created_at) as last_record
FROM stock_history
GROUP BY item_id
HAVING COUNT(*) > 1
ORDER BY record_count DESC;

-- 7단계: stock_history와 items 연결 확인
SELECT '=== stock_history와 items 연결 상태 ===' as info;
SELECT
  'stock_history 총 레코드' as info,
  COUNT(*) as count
FROM stock_history
UNION ALL
SELECT
  'items와 연결된 레코드' as info,
  COUNT(*) as count
FROM stock_history sh
INNER JOIN items i ON sh.item_id = i.id
UNION ALL
SELECT
  '연결되지 않은 레코드' as info,
  COUNT(*) as count
FROM stock_history sh
LEFT JOIN items i ON sh.item_id = i.id
WHERE i.id IS NULL;

-- 8단계: 연결되지 않은 레코드 제거
DELETE FROM stock_history
WHERE NOT EXISTS (
  SELECT 1 FROM items i WHERE i.id = stock_history.item_id
);

-- 9단계: 최종 정리 결과 확인
SELECT '=== 최종 정리 결과 ===' as info;

-- event_type 최종 분포
SELECT
  'event_type 최종 분포' as info;
SELECT
  event_type,
  COUNT(*) as count
FROM stock_history
GROUP BY event_type
ORDER BY count DESC;

-- unit_price 범위 확인
SELECT
  'unit_price 범위 확인' as info;
SELECT
  MIN(unit_price) as min_price,
  MAX(unit_price) as max_price,
  AVG(unit_price) as avg_price
FROM stock_history;

-- 10단계: date_index 생성 (아직 없다면)
UPDATE stock_history
SET date_index = subquery.date_index
FROM (
  SELECT
    id,
    TO_CHAR(created_at, 'YYYYMMDD') || '_' ||
    LPAD(ROW_NUMBER() OVER (PARTITION BY DATE(created_at) ORDER BY created_at)::TEXT, 3, '0') as date_index
  FROM stock_history
) subquery
WHERE stock_history.id = subquery.id;

-- 11단계: 최종 상태 확인
SELECT '=== stock_history 최종 상태 ===' as info;
SELECT
  COUNT(*) as total_records,
  COUNT(DISTINCT item_id) as unique_items,
  COUNT(DISTINCT event_type) as event_types,
  MIN(date_index) as min_date_index,
  MAX(date_index) as max_date_index
FROM stock_history;
