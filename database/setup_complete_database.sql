-- ========================================
-- 완전한 데이터베이스 설정
-- ========================================

-- 1. 프로젝트 테이블 생성 (최신 스키마)
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

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_work_diary_user_id ON work_diary(user_id);
CREATE INDEX IF NOT EXISTS idx_work_diary_date ON work_diary(work_date);
CREATE INDEX IF NOT EXISTS idx_work_diary_project ON work_diary(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_number ON projects(project_number);

-- 4. RLS 정책 설정 (개발용 - 모든 사용자 허용)
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

-- 5. 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_work_diary_updated_at ON work_diary;
CREATE TRIGGER update_work_diary_updated_at 
    BEFORE UPDATE ON work_diary 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. 기존 데이터 삭제 (새로 시작)
DELETE FROM work_diary;
DELETE FROM projects;

-- 7. 프로젝트 데이터 삽입
INSERT INTO projects (project_name, project_number, is_active, created_at, updated_at) VALUES
-- CNCWL 프로젝트들
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
('귤현', 'CNCWL-2302', true, NOW(), NOW()),
('호포', 'CNCWL-2301', true, NOW(), NOW()),
('인도네시아 PT.ABHIPRAYA', 'CNCWL-2304', true, NOW(), NOW()),
('월배', 'CNCWL-2401', true, NOW(), NOW()),
('시흥2호기', 'CNCWL-2402', true, NOW(), NOW()),
('GTX A', 'CNCWL-2202', true, NOW(), NOW()),
-- CNCUWL 프로젝트들
('자카르타', 'CNCUWL-1703', true, NOW(), NOW()),
('수서', 'CNCUWL-1901', true, NOW(), NOW()),
('호포', 'CNCUWL-1902', true, NOW(), NOW()),
('가야', 'CNCUWL-1903', true, NOW(), NOW()),
('귤현', 'CNCUWL-2001', true, NOW(), NOW()),
('이문', 'CNCUWL-2002', true, NOW(), NOW()),
('대구월배', 'CNCUWL-2101', true, NOW(), NOW()),
('익산', 'CNCUWL-2102', true, NOW(), NOW()),
('신내', 'CNCUWL-2103', true, NOW(), NOW()),
('군자', 'CNCUWL-2104', true, NOW(), NOW()),
('병점동탄', 'CNCUWL-2301', true, NOW(), NOW()),
('GTX-A 파주', 'CNCUWL-2201', true, NOW(), NOW()),
('지축', 'CNCUWL-2401', true, NOW(), NOW()),
('안심', 'CNCUWL-2501', true, NOW(), NOW()),
('개화', 'CNCUWL-2502', true, NOW(), NOW()),
('진접', 'CNCUWL-2506', true, NOW(), NOW()),
-- 추가 CNCWL 프로젝트들
('부단', 'CNCWL-9201', true, NOW(), NOW()),
('신정', 'CNCWL-9202', true, NOW(), NOW()),
('부단화차', 'CNCWL-9301', true, NOW(), NOW()),
('서단', 'CNCWL-9401', true, NOW(), NOW()),
('분당', 'CNCWL-9402', true, NOW(), NOW()),
('고덕', 'CNCWL-9403', true, NOW(), NOW()),
('도봉', 'CNCWL-9404', true, NOW(), NOW()),
('대단', 'CNCWL-9501', true, NOW(), NOW()),
('군자', 'CNCWL-9502', true, NOW(), NOW()),
('월배', 'CNCWL-9601', true, NOW(), NOW()),
('지축', 'CNCWL-9602', true, NOW(), NOW()),
('서단', 'CNCWL-9701', true, NOW(), NOW()),
('호포', 'CNCWL-9702', true, NOW(), NOW()),
('시흥', 'CNCWL-9703', true, NOW(), NOW()),
('부단', 'CNCWL-9801', true, NOW(), NOW()),
('귤현', 'CNCWL-9802', true, NOW(), NOW()),
('제천', 'CNCWL-9901', true, NOW(), NOW()),
('부단', 'CNCWL-9902', true, NOW(), NOW()),
('대단', 'CNCWL-0001', true, NOW(), NOW()),
('이문', 'CNCWL-0002', true, NOW(), NOW()),
('시흥 이설', 'CNCWL-0101', true, NOW(), NOW()),
('지축', 'CNCWL-0102', true, NOW(), NOW()),
('광주', 'CNCWL-0103', true, NOW(), NOW()),
('부산KTX', 'CNCWL-0201', true, NOW(), NOW()),
('판암', 'CNCWL-0301', true, NOW(), NOW()),
('고양KTX', 'CNCWL-0302', true, NOW(), NOW()),
('영종', 'CNCWL-0501', true, NOW(), NOW()),
('문산', 'CNCWL-0502', true, NOW(), NOW()),
('로템9호선', 'CNCWL-0503', true, NOW(), NOW()),
('노포', 'CNCWL-0602', true, NOW(), NOW()),
('신정', 'CNCWL-0701', true, NOW(), NOW()),
('부단', 'CNCWL-0801', true, NOW(), NOW()),
('평내', 'CNCWL-0901', true, NOW(), NOW()),
('제천', 'CNCWL-0902', true, NOW(), NOW()),
('부단', 'CNCWL-1001', true, NOW(), NOW()),
('대만-CL431', 'CNCWL-1101', true, NOW(), NOW()),
('대만-CL431', 'CNCWL-1102', true, NOW(), NOW()),
('호남KTX', 'CNCWL-1201', true, NOW(), NOW()),
('분당', 'CNCWL-1202', true, NOW(), NOW()),
('신분당', 'CNCWL-1203', true, NOW(), NOW());

-- 8. 확인용 쿼리
SELECT '프로젝트 수:' as info, COUNT(*) as count FROM projects;
SELECT '업무일지 수:' as info, COUNT(*) as count FROM work_diary;

-- 9. 프로젝트 목록 확인
SELECT id, project_name, project_number, is_active 
FROM projects 
ORDER BY project_number 
LIMIT 10;
