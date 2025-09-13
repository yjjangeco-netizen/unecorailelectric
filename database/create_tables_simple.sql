-- 간단한 테이블 생성 SQL
-- Supabase SQL Editor에서 실행하세요

-- 1. 프로젝트 테이블 생성
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    project_name VARCHAR(100) NOT NULL,
    project_number VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    assembly_date DATE,
    factory_test_date DATE,
    site_test_date DATE,
    remarks TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 업무일지 테이블 생성
CREATE TABLE IF NOT EXISTS work_diary (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    work_date DATE NOT NULL,
    project_id INTEGER REFERENCES projects(id),
    work_content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS 정책 설정 (개발용 - 모든 사용자 허용)
ALTER TABLE work_diary ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view projects" ON projects;
DROP POLICY IF EXISTS "Users can manage projects" ON projects;
DROP POLICY IF EXISTS "Users can view work diary" ON work_diary;
DROP POLICY IF EXISTS "Users can manage work diary" ON work_diary;
DROP POLICY IF EXISTS "Anyone can view projects" ON projects;
DROP POLICY IF EXISTS "Anyone can manage projects" ON projects;
DROP POLICY IF EXISTS "Anyone can view work diary" ON work_diary;
DROP POLICY IF EXISTS "Anyone can manage work diary" ON work_diary;

-- 모든 사용자가 프로젝트 조회/관리 가능 (개발용)
CREATE POLICY "Anyone can view projects" ON projects
    FOR SELECT USING (true);

CREATE POLICY "Anyone can manage projects" ON projects
    FOR ALL USING (true);

-- 모든 사용자가 업무일지 조회/관리 가능 (개발용)
CREATE POLICY "Anyone can view work diary" ON work_diary
    FOR SELECT USING (true);

CREATE POLICY "Anyone can manage work diary" ON work_diary
    FOR ALL USING (true);

-- 4. 샘플 프로젝트 데이터 삽입
INSERT INTO projects (project_name, project_number, is_active, created_at, updated_at) VALUES
('브라질 CSP', 'CNCWL-1204', true, NOW(), NOW()),
('제천', 'CNCWL-1501', true, NOW(), NOW()),
('도봉', 'CNCWL-1601', true, NOW(), NOW()),
('군자', 'CNCWL-1701', true, NOW(), NOW()),
('덕하', 'CNCWL-1702', true, NOW(), NOW()),
('고덕', 'CNCWL-1801', true, NOW(), NOW()),
('대단', 'CNCWL-1901', true, NOW(), NOW()),
('대전시설장비', 'CNCWL-2101', true, NOW(), NOW()),
('시흥', 'CNCWL-2102', true, NOW(), NOW()),
('대단', 'CNCWL-2201', true, NOW(), NOW()),
('GTX A', 'CNCWL-2202', true, NOW(), NOW()),
('호포', 'CNCWL-2301', true, NOW(), NOW()),
('귤현', 'CNCWL-2302', true, NOW(), NOW()),
('인도네시아 PT.ABHIPRAYA', 'CNCWL-2304', true, NOW(), NOW()),
('월배', 'CNCWL-2401', true, NOW(), NOW()),
('시흥2호기', 'CNCWL-2402', true, NOW(), NOW())
ON CONFLICT (project_number) DO NOTHING;

-- 5. 확인용 쿼리
SELECT '프로젝트 수:' as info, COUNT(*) as count FROM projects;
SELECT '업무일지 수:' as info, COUNT(*) as count FROM work_diary;
