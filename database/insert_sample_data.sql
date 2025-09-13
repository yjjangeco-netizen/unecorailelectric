-- 샘플 데이터 삽입 (새로운 컬럼명 사용)

-- 1. items 테이블에 샘플 데이터
INSERT INTO items (product, spec, maker, unit_price, purpose, min_stock, category, stock_status, note) VALUES
('전선 (2.0SQ)', '2.0SQ', 'LS전선', 1500, '전기 배선용', 50, '전선', 'new', '전기 배선 공사용'),
('차단기 (20A)', '20A', 'LS산전', 25000, '전기 차단용', 15, '차단기', 'new', '전기 차단 보호용'),
('콘센트 (220V)', '220V 15A', 'LS산전', 8000, '전기 콘센트', 30, '콘센트', 'new', '전기 콘센트 설치용'),
('케이블 (3m)', '3m', '유니코', 5000, '설치용', 100, '케이블', 'new', '설치 공사용'),
('모니터 (24인치)', '24인치', 'LG', 300000, '업무용', 5, '전자기기', 'new', '업무용 모니터'),
('노트북 (15인치)', '15인치', '삼성', 800000, '업무용', 3, '전자기기', 'new', '업무용 노트북'),
('스위치 (1P)', '1P', 'LS산전', 15000, '전기 스위치', 20, '스위치', 'new', '전기 스위치용'),
('릴레이 (12V)', '12V', 'LS산전', 8000, '제어용', 25, '릴레이', 'new', '전기 제어용'),
('퓨즈 (10A)', '10A', 'LS산전', 3000, '보호용', 40, '퓨즈', 'new', '전기 보호용'),
('램프 (LED)', 'LED 10W', '오스람', 12000, '조명용', 35, '조명', 'new', 'LED 조명용'),
('배터리 (9V)', '9V', '듀라셀', 5000, '전원용', 60, '배터리', 'new', '9V 배터리');

-- 2. current_stock 테이블에 연결된 데이터
INSERT INTO current_stock (item_id, product, spec, maker, category, current_quantity, unit_price, total_amount, location, stock_status, note)
SELECT 
  i.id, 
  i.product, 
  i.spec, 
  i.maker, 
  i.category, 
  FLOOR(RANDOM() * 100 + 10), -- 10~109 사이의 랜덤 수량
  i.unit_price, 
  i.unit_price * FLOOR(RANDOM() * 100 + 10), -- 단가 * 수량
  CASE 
    WHEN i.category = '전선' THEN 'A-01'
    WHEN i.category = '차단기' THEN 'B-02'
    WHEN i.category = '콘센트' THEN 'C-03'
    WHEN i.category = '케이블' THEN 'A-04'
    WHEN i.category = '전자기기' THEN 'D-01'
    WHEN i.category = '스위치' THEN 'B-03'
    WHEN i.category = '릴레이' THEN 'B-04'
    WHEN i.category = '퓨즈' THEN 'B-05'
    WHEN i.category = '조명' THEN 'E-01'
    WHEN i.category = '배터리' THEN 'F-01'
    ELSE 'G-01'
  END,
  i.stock_status,
  i.note
FROM items i;

-- 3. stock_in 테이블에 샘플 입고 데이터
INSERT INTO stock_in (item_id, quantity, unit_price, total_amount, received_by, reason, stock_status, note)
SELECT 
  i.id,
  FLOOR(RANDOM() * 50 + 10), -- 10~59 사이의 랜덤 수량
  i.unit_price,
  i.unit_price * FLOOR(RANDOM() * 50 + 10),
  CASE FLOOR(RANDOM() * 3)
    WHEN 0 THEN '김철수'
    WHEN 1 THEN '이영희'
    ELSE '박민수'
  END,
  CASE FLOOR(RANDOM() * 3)
    WHEN 0 THEN '신규 구매'
    WHEN 1 THEN '재고 보충'
    ELSE '프로젝트용'
  END,
  i.stock_status,
  '샘플 입고 데이터'
FROM items i
LIMIT 5; -- 상위 5개만

-- 4. stock_out 테이블에 샘플 출고 데이터
INSERT INTO stock_out (item_id, quantity, issued_by, project, note)
SELECT 
  i.id,
  FLOOR(RANDOM() * 20 + 5), -- 5~24 사이의 랜덤 수량
  CASE FLOOR(RANDOM() * 3)
    WHEN 0 THEN '김철수'
    WHEN 1 THEN '이영희'
    ELSE '박민수'
  END,
  CASE FLOOR(RANDOM() * 3)
    WHEN 0 THEN 'A동 공사'
    WHEN 1 THEN 'B동 공사'
    ELSE 'C동 공사'
  END,
  '샘플 출고 데이터'
FROM items i
LIMIT 3; -- 상위 3개만
