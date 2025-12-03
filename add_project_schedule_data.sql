-- 프로젝트 관리에 조립완료, 공장시운전, 현장시운전 일정 추가
-- 기존 프로젝트에 일정 업데이트

-- 1. 첫 번째 프로젝트에 일정 추가
UPDATE projects 
SET 
  assembly_date = '2025-12-10',
  factory_test_date = '2025-12-15',
  site_test_date = '2025-12-20',
  completion_date = '2025-12-25'
WHERE id = (SELECT id FROM projects ORDER BY created_at DESC LIMIT 1 OFFSET 0);

-- 2. 두 번째 프로젝트에 일정 추가
UPDATE projects 
SET 
  assembly_date = '2025-12-12',
  factory_test_date = '2025-12-18',
  site_test_date = '2025-12-23'
WHERE id = (SELECT id FROM projects ORDER BY created_at DESC LIMIT 1 OFFSET 1);

-- 3. 세 번째 프로젝트에 일정 추가
UPDATE projects 
SET 
  assembly_date = '2025-12-08',
  factory_test_date = '2025-12-13',
  site_test_date = '2025-12-19'
WHERE id = (SELECT id FROM projects ORDER BY created_at DESC LIMIT 1 OFFSET 2);

-- 현재 등록된 프로젝트 확인
SELECT 
  id,
  project_name,
  assembly_date,
  factory_test_date,
  site_test_date,
  completion_date,
  created_at
FROM projects
WHERE assembly_date IS NOT NULL 
   OR factory_test_date IS NOT NULL 
   OR site_test_date IS NOT NULL
ORDER BY created_at DESC;

