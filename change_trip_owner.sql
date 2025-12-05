-- 12월 2일 시작하는 출장의 담당자를 admin에서 yjjang(장영재)으로 변경하는 SQL입니다.
-- Supabase SQL Editor에서 실행해주세요.

UPDATE business_trips
SET 
  user_id = (SELECT id FROM users WHERE id = 'yjjang' OR username = 'yjjang' LIMIT 1),
  user_name = (SELECT name FROM users WHERE id = 'yjjang' OR username = 'yjjang' LIMIT 1)
WHERE 
  start_date = '2025-12-02' 
  AND (user_id = 'admin' OR user_id = 'administrator' OR user_name = '관리자');

-- 변경 확인용 조회 쿼리
SELECT * FROM business_trips WHERE start_date = '2025-12-02';
