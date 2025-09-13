-- ========================================
-- 이미지에서 추출한 프로젝트 정보로 업데이트
-- ========================================

-- 1. 먼저 스키마 업데이트 (컬럼명 변경)
-- name 컬럼이 있는 경우에만 변경
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'projects' AND column_name = 'name') THEN
        ALTER TABLE projects RENAME COLUMN name TO project_name;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'projects' AND column_name = 'location') THEN
        ALTER TABLE projects RENAME COLUMN location TO project_number;
    END IF;
END $$;

-- 2. project_number에 유니크 제약조건 추가 (이미 있으면 무시)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'projects' AND constraint_name = 'unique_project_number') THEN
        ALTER TABLE projects ADD CONSTRAINT unique_project_number UNIQUE (project_number);
    END IF;
END $$;

-- 3. 기존 프로젝트 데이터 확인
SELECT id, project_name, project_number FROM projects ORDER BY id;

-- 4. 기존 프로젝트 데이터 삭제 (필요시)
DELETE FROM projects;

-- 5. 새로운 프로젝트 데이터 삽입
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
('귤현', 'CNCWL-2302', true, NOW(), NOW()),
('호포', 'CNCWL-2301', true, NOW(), NOW()),
('인도네시아 PT.ABHIPRAYA', 'CNCWL-2304', true, NOW(), NOW()),
('월배', 'CNCWL-2401', true, NOW(), NOW()),
('시흥2호기', 'CNCWL-2402', true, NOW(), NOW()),
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
('월배', 'CNCUWL-9401', true, NOW(), NOW()),
('모란', 'CNCUWL-9501', true, NOW(), NOW()),
('도봉', 'CNCUWL-9502', true, NOW(), NOW()),
('호포', 'CNCUWL-9601', true, NOW(), NOW()),
('안심', 'CNCUWL-9602', true, NOW(), NOW()),
('귤현', 'CNCUWL-9603', true, NOW(), NOW()),
('천왕', 'CNCUWL-9701', true, NOW(), NOW()),
('광양', 'CNCUWL-9801', true, NOW(), NOW()),
('부곡', 'CNCUWL-9802', true, NOW(), NOW()),
('신내', 'CNCUWL-9901', true, NOW(), NOW()),
('광주', 'CNCUWL-0001', true, NOW(), NOW()),
('이문', 'CNCUWL-0002', true, NOW(), NOW()),
('창동', 'CNCUWL-0201', true, NOW(), NOW()),
('판암', 'CNCUWL-0301', true, NOW(), NOW()),
('문양', 'CNCUWL-0302', true, NOW(), NOW()),
('지축', 'CNCUWL-0303', true, NOW(), NOW()),
('대저', 'CNCUWL-0304', true, NOW(), NOW()),
('분당', 'CNCUWL-0401', true, NOW(), NOW()),
('노포', 'CNCUWL-0501', true, NOW(), NOW()),
('영종', 'CNCUWL-0502', true, NOW(), NOW()),
('문산', 'CNCUWL-0503', true, NOW(), NOW()),
('로템9호선', 'CNCUWL-0504', true, NOW(), NOW()),
('신정', 'CNCUWL-0601', true, NOW(), NOW()),
('김해', 'CNCUWL-0701', true, NOW(), NOW()),
('당진', 'CNCUWL-0702', true, NOW(), NOW()),
('제천', 'CNCUWL-0801', true, NOW(), NOW()),
('평내', 'CNCUWL-0901', true, NOW(), NOW()),
('용문', 'CNCUWL-1001', true, NOW(), NOW()),
('인천2호선', 'CNCUWL-1101', true, NOW(), NOW()),
('신분당', 'CNCUWL-1206', true, NOW(), NOW()),
('DMRC 인도', 'CNCUWL-1207', true, NOW(), NOW()),
('브라질', 'CNCUWL-1208', true, NOW(), NOW()),
('김포경전철', 'CNCUWL-1301', true, NOW(), NOW()),
('소사원시', 'CNCUWL-1302', true, NOW(), NOW()),
('고덕', 'CNCUWL-1303', true, NOW(), NOW()),
('우이신설', 'CNCUWL-1401', true, NOW(), NOW()),
('방화', 'CNCUWL-1402', true, NOW(), NOW()),
('부발', 'CNCUWL-1501', true, NOW(), NOW()),
('포스코', 'CNCUWL-1502', true, NOW(), NOW()),
('천왕', 'CNCUWL-1601', true, NOW(), NOW()),
('신평', 'CNCUWL-1602', true, NOW(), NOW()),
('강릉', 'CNCUWL-1603', true, NOW(), NOW()),
('도봉', 'CNCUWL-1701', true, NOW(), NOW()),
('덕하', 'CNCUWL-1702', true, NOW(), NOW()),
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
('신분당', 'CNCWL-1203', true, NOW(), NOW())
ON CONFLICT (project_number) DO UPDATE SET
    project_name = EXCLUDED.project_name,
    updated_at = NOW();

-- 6. 프로젝트 번호가 없는 항목 처리 (2202_GTX A)
-- 괄호 안에 프로젝트명이 없으므로 별도 처리
INSERT INTO projects (project_name, project_number, is_active, created_at, updated_at) VALUES
('GTX A', 'CNCWL-2202', true, NOW(), NOW());

-- 7. 확인용 쿼리
SELECT 
    id,
    project_name,
    project_number,
    is_active,
    created_at
FROM projects 
ORDER BY project_number;

-- 8. 프로젝트 수 확인
SELECT COUNT(*) as total_projects FROM projects;
