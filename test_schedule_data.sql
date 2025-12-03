-- 프로젝트에 일정 데이터 추가 (조완, 공시, 현시)
-- 기존 프로젝트에 일정 추가
UPDATE projects 
SET 
  assembly_date = '2025-12-15',
  factory_test_date = '2025-12-20',
  site_test_date = '2025-12-25'
WHERE id IN (
  SELECT id FROM projects LIMIT 1
);

-- 일반 이벤트 추가
INSERT INTO events (
  id,
  category,
  summary,
  description,
  start_date,
  end_date,
  participant_id,
  participant_name,
  created_by_id,
  created_by_name
) VALUES 
(
  gen_random_uuid(),
  '회의',
  '프로젝트 킥오프 미팅',
  '신규 프로젝트 시작 회의',
  '2025-12-10',
  '2025-12-10',
  'test-user-id',
  '테스트 사용자',
  'test-user-id',
  '테스트 사용자'
),
(
  gen_random_uuid(),
  '업무',
  '현장 방문',
  '현장 점검 및 확인',
  '2025-12-18',
  '2025-12-18',
  'test-user-id',
  '테스트 사용자',
  'test-user-id',
  '테스트 사용자'
);

-- 연차/반차 추가
INSERT INTO leave_requests (
  id,
  user_id,
  leave_type,
  start_date,
  end_date,
  total_days,
  reason,
  status
) VALUES 
(
  gen_random_uuid(),
  (SELECT id FROM users LIMIT 1),
  'annual',
  '2025-12-23',
  '2025-12-23',
  1,
  '개인 사유',
  'approved'
),
(
  gen_random_uuid(),
  (SELECT id FROM users LIMIT 1),
  'half_day',
  '2025-12-27',
  '2025-12-27',
  0.5,
  '오후 반차',
  'approved'
);

-- 출장 추가
INSERT INTO business_trips (
  id,
  user_id,
  trip_type,
  title,
  purpose,
  location,
  start_date,
  end_date,
  status
) VALUES 
(
  gen_random_uuid(),
  (SELECT id FROM users LIMIT 1),
  'business_trip',
  '서울 출장',
  '고객사 미팅',
  '서울',
  '2025-12-12',
  '2025-12-13',
  'approved'
);

