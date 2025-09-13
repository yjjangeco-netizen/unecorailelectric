-- 기존 프로젝트 데이터 삭제
DELETE FROM projects;

-- 새로운 프로젝트 데이터 삽입
INSERT INTO projects (project_name, project_number, created_at, updated_at) VALUES
('브라질 CSP', 'CNCWL-1204', NOW(), NOW()),
('제천 Dsl (화차)', 'CNCWL-1501', NOW(), NOW()),
('도봉 Dsl', 'CNCWL-1601', NOW(), NOW()),
('군자 Dsl', 'CNCWL-1701', NOW(), NOW()),
('덕하 DSL', 'CNCWL-1702', NOW(), NOW()),
('고덕 DSL', 'CNCWL-1801', NOW(), NOW()),
('대단 Dsl', 'CNCWL-1901', NOW(), NOW()),
('대전시설장비 - 840D SL', 'CNCWL-2101', NOW(), NOW()),
('시흥 - Dsl', 'CNCWL-2102', NOW(), NOW()),
('대단 - Fanuc', 'CNCWL-2201', NOW(), NOW()),
('귤현 - 840D sL', 'CNCWL-2302', NOW(), NOW()),
('GTX A - 840D SL', 'CNCWL-2202', NOW(), NOW()),
('호포 - 840D sL', 'CNCWL-2301', NOW(), NOW()),
('인도네시아 PT.ABHIPRAYA - Fanuc', 'CNCWL-2304', NOW(), NOW()),
('월배 - Fanuc', 'CNCWL-2401', NOW(), NOW()),
('시흥2호기 - Sinuone', 'CNCWL-2402', NOW(), NOW());

