-- ========================================
-- 프로젝트 테이블 스키마 업데이트
-- ========================================

-- 1. 기존 컬럼명 변경 및 새 컬럼 추가
ALTER TABLE projects 
  RENAME COLUMN name TO project_name;

ALTER TABLE projects 
  RENAME COLUMN location TO project_number;

-- 2. 새 컬럼 추가
ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS assembly_date DATE,
  ADD COLUMN IF NOT EXISTS factory_test_date DATE,
  ADD COLUMN IF NOT EXISTS site_test_date DATE,
  ADD COLUMN IF NOT EXISTS remarks TEXT;

-- 3. 기존 데이터 업데이트 (프로젝트번호를 기존 location 값으로 설정)
UPDATE projects SET project_number = project_number WHERE project_number IS NOT NULL;

-- 4. 확인용 쿼리
SELECT 
  id, 
  project_name, 
  project_number, 
  assembly_date, 
  factory_test_date, 
  site_test_date, 
  remarks, 
  is_active, 
  created_at 
FROM projects 
ORDER BY id;
