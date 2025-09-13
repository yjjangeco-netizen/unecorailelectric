-- projects 테이블에 누락된 컬럼들 추가
-- Supabase SQL Editor에서 실행하세요

-- 1. 누락된 컬럼들 추가
ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS assembly_date DATE,
  ADD COLUMN IF NOT EXISTS factory_test_date DATE,
  ADD COLUMN IF NOT EXISTS site_test_date DATE,
  ADD COLUMN IF NOT EXISTS remarks TEXT;

-- 2. 기존 데이터 확인
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
ORDER BY id 
LIMIT 5;

-- 3. 테이블 구조 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;
