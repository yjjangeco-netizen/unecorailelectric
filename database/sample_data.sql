-- =============================================
-- 샘플 데이터 삽입 스크립트
-- =============================================

-- 1. 사용자 데이터 삽입
-- =============================================
INSERT INTO users (id, name, level, permissions) VALUES
('user1', '김철수', '1', ARRAY['basic']),
('user2', '이영희', '2', ARRAY['basic', 'work_diary']),
('user3', '박민수', '3', ARRAY['basic', 'work_diary', 'schedule']),
('user4', '정수진', '4', ARRAY['basic', 'work_diary', 'schedule', 'project_management']),
('user5', '최관리', '5', ARRAY['basic', 'work_diary', 'schedule', 'project_management', 'admin']),
('admin', '관리자', 'administrator', ARRAY['basic', 'work_diary', 'schedule', 'project_management', 'admin', 'super_admin'])
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    level = EXCLUDED.level,
    permissions = EXCLUDED.permissions,
    updated_at = CURRENT_TIMESTAMP;

-- 2. 프로젝트 데이터 삽입
-- =============================================
INSERT INTO projects (project_name, project_number, assembly_date, factory_test_date, site_test_date) VALUES
('브라질 CSP 선반', 'CNCWL-1204', NULL, NULL, NULL),
('제천 선반', 'CNCWL-1501', NULL, NULL, NULL),
('도봉 선반', 'CNCWL-1601', NULL, NULL, NULL),
('군자 선반', 'CNCWL-1701', NULL, NULL, NULL),
('덕하 선반', 'CNCWL-1702', NULL, NULL, NULL),
('고덕 선반', 'CNCWL-1801', NULL, NULL, NULL),
('대단 선반', 'CNCWL-1901', NULL, NULL, NULL),
('대전시설장비 선반', 'CNCWL-2101', NULL, NULL, NULL),
('시흥 선반', 'CNCWL-2102', NULL, NULL, NULL),
('대단 선반', 'CNCWL-2201', NULL, NULL, NULL),
('GTX A 선반', 'CNCWL-2202', NULL, NULL, NULL),
('호포 선반', 'CNCWL-2301', NULL, NULL, NULL),
('귤현 선반', 'CNCWL-2302', NULL, NULL, NULL),
('인도네시아 PT.ABHIPRAYA 선반', 'CNCWL-2304', NULL, NULL, NULL),
('월배 선반', 'CNCWL-2401', NULL, NULL, NULL),
('시흥2호기 선반', 'CNCWL-2402', NULL, NULL, NULL),
('개화 선반', 'CNCWL-2501', NULL, NULL, NULL),
('부단 선반', 'CNCWL-9801', NULL, NULL, NULL),
('제천 선반', 'CNCWL-9901', NULL, NULL, NULL),
('부단 선반', 'CNCWL-9902', NULL, NULL, NULL),
('대단 선반', 'CNCWL-0001', NULL, NULL, NULL),
('이문 선반', 'CNCWL-0002', NULL, NULL, NULL),
('시흥 선반', 'CNCWL-0101', NULL, NULL, NULL),
('지축 선반', 'CNCWL-0102', NULL, NULL, NULL),
('광주 선반', 'CNCWL-0103', NULL, NULL, NULL),
('부산KTX 선반', 'CNCWL-0201', NULL, NULL, NULL),
('판암 선반', 'CNCWL-0301', NULL, NULL, NULL),
('고양KTX 선반', 'CNCWL-0302', NULL, NULL, NULL),
('영종 선반', 'CNCWL-0501', NULL, NULL, NULL),
('문산 선반', 'CNCWL-0502', NULL, NULL, NULL),
('로템9호선 선반', 'CNCWL-0503', NULL, NULL, NULL),
('노포 선반', 'CNCWL-0602', NULL, NULL, NULL),
('신정 선반', 'CNCWL-0701', NULL, NULL, NULL),
('부단 선반', 'CNCWL-0801', NULL, NULL, NULL),
('평내 선반', 'CNCWL-0901', NULL, NULL, NULL),
('부단 선반', 'CNCWL-1001', NULL, NULL, NULL),
('대만-CL431 선반', 'CNCWL-1101', NULL, NULL, NULL),
('대만-CL431 선반', 'CNCWL-1102', NULL, NULL, NULL),
('호남KTX 선반', 'CNCWL-1201', NULL, NULL, NULL),
('신분당 선반', 'CNCWL-1203', NULL, NULL, NULL),
('분당 선반', 'CNCWL-1202', NULL, NULL, NULL),
('광양 전삭기', 'CNCUWL-9801', NULL, NULL, NULL),
('부곡 전삭기', 'CNCUWL-9802', NULL, NULL, NULL),
('광주 전삭기', 'CNCUWL-0001', NULL, NULL, NULL),
('창동 전삭기', 'CNCUWL-0201', NULL, NULL, NULL),
('판암 전삭기', 'CNCUWL-0301', NULL, NULL, NULL),
('문양 전삭기', 'CNCUWL-0302', NULL, NULL, NULL),
('대저 전삭기', 'CNCUWL-0304', NULL, NULL, NULL),
('분당 전삭기', 'CNCUWL-0401', NULL, NULL, NULL),
('노포 전삭기', 'CNCUWL-0501', NULL, NULL, NULL),
('영종 전삭기', 'CNCUWL-0502', NULL, NULL, NULL),
('문산 전삭기', 'CNCUWL-0503', NULL, NULL, NULL),
('로템9호선 전삭기', 'CNCUWL-0504', NULL, NULL, NULL),
('신정 전삭기', 'CNCUWL-0601', NULL, NULL, NULL),
('김해 전삭기', 'CNCUWL-0701', NULL, NULL, NULL),
('당진 전삭기', 'CNCUWL-0702', NULL, NULL, NULL),
('제천 전삭기', 'CNCUWL-0801', NULL, NULL, NULL),
('평내 전삭기', 'CNCUWL-0901', NULL, NULL, NULL),
('용문 전삭기', 'CNCUWL-1001', NULL, NULL, NULL),
('인천2호선 전삭기', 'CNCUWL-1101', NULL, NULL, NULL),
('신분당 전삭기', 'CNCUWL-1206', NULL, NULL, NULL),
('DMRC 전삭기', 'CNCUWL-1207', NULL, NULL, NULL),
('김포경전철 전삭기', 'CNCUWL-1301', NULL, NULL, NULL),
('소사원시 전삭기', 'CNCUWL-1302', NULL, NULL, NULL),
('고덕 전삭기', 'CNCUWL-1303', NULL, NULL, NULL),
('우이신설 전삭기', 'CNCUWL-1401', NULL, NULL, NULL),
('방화 전삭기', 'CNCUWL-1402', NULL, NULL, NULL),
('부발 전삭기', 'CNCUWL-1501', NULL, NULL, NULL),
('포스코 전삭기', 'CNCUWL-1502', NULL, NULL, NULL),
('천왕 전삭기', 'CNCUWL-1601', NULL, NULL, NULL),
('신평 전삭기', 'CNCUWL-1602', NULL, NULL, NULL),
('강릉 전삭기', 'CNCUWL-1603', NULL, NULL, NULL),
('도봉 전삭기', 'CNCUWL-1701', NULL, NULL, NULL),
('덕하 전삭기', 'CNCUWL-1702', NULL, NULL, NULL),
('자카르타 전삭기', 'CNCUWL-1703', NULL, NULL, NULL),
('수서 전삭기', 'CNCUWL-1901', NULL, NULL, NULL),
('호포 전삭기', 'CNCUWL-1902', NULL, NULL, NULL),
('가야 전삭기', 'CNCUWL-1903', NULL, NULL, NULL),
('귤현 전삭기', 'CNCUWL-2001', NULL, NULL, NULL),
('이문 전삭기', 'CNCUWL-2002', NULL, NULL, NULL),
('대구월배 전삭기', 'CNCUWL-2101', NULL, NULL, NULL),
('익산 전삭기', 'CNCUWL-2102', NULL, NULL, NULL),
('신내 전삭기', 'CNCUWL-2103', NULL, NULL, NULL),
('군자 전삭기', 'CNCUWL-2104', NULL, NULL, NULL),
('병점동탄 전삭기', 'CNCUWL-2301', NULL, NULL, NULL),
('GTX-A 전삭기', 'CNCUWL-2201', NULL, NULL, NULL),
('지축 전삭기', 'CNCUWL-2401', NULL, NULL, NULL),
('안심 전삭기', 'CNCUWL-2501', NULL, NULL, NULL),
('개화 전삭기', 'CNCUWL-2502', NULL, NULL, NULL),
('진접 전삭기', 'CNCUWL-2506', NULL, NULL, NULL)
ON CONFLICT (project_number) DO UPDATE SET
    project_name = EXCLUDED.project_name,
    description = EXCLUDED.description,
    assembly_date = EXCLUDED.assembly_date,
    factory_test_date = EXCLUDED.factory_test_date,
    site_test_date = EXCLUDED.site_test_date,
    updated_at = CURRENT_TIMESTAMP;

-- 3. 업무일지 샘플 데이터 삽입
-- =============================================
INSERT INTO work_diary (user_id, work_date, project_id, work_content, work_type, work_sub_type, custom_project_name) VALUES
('user1', '2024-01-15', 1, 'A동 전기실 정기점검 및 배전반 상태 확인', '신규', '출장', NULL),
('user2', '2024-01-15', 2, 'B동 신규 전기설비 설치 및 배선 작업', '신규', '외근', NULL),
('user3', '2024-01-14', 3, 'C동 조명 고장 수리 및 교체 작업', 'AS', '전화', NULL),
('user4', '2024-01-13', 4, 'D동 전력 시스템 정기 점검 및 보수', '보완', '출장', NULL),
('user5', '2024-01-12', 5, '전체 전기설비 현황 점검 및 보고서 작성', '신규', '외근', NULL),
('user1', '2024-01-16', 1, 'A동 전기실 추가 점검 및 보수 작업', '보완', '외근', NULL),
('user2', '2024-01-16', 2, 'B동 신규 설비 테스트 및 검증', '신규', '출장', NULL),
('user3', '2024-01-17', 3, 'C동 조명 시스템 업그레이드 작업', '신규', '외근', NULL),
('user4', '2024-01-17', 4, 'D동 전력 시스템 모니터링 설정', '보완', '전화', NULL),
('user5', '2024-01-18', 5, '전체 시스템 통합 테스트 및 최적화', '신규', '출장', NULL),
('user1', '2024-01-18', 6, '고덕 프로젝트 현장 조사 및 계획 수립', '신규', '출장', NULL),
('user2', '2024-01-19', 7, '대단 프로젝트 설비 설치 및 연결', '신규', '외근', NULL),
('user3', '2024-01-19', 8, '대전시설장비 프로젝트 시스템 통합', '신규', '출장', NULL),
('user4', '2024-01-20', 9, '시흥 프로젝트 최종 점검 및 인수인계', '보완', '외근', NULL),
('user5', '2024-01-20', 10, '대단 Fanuc 프로젝트 전체 검토 및 보고', '신규', '전화', NULL)
ON CONFLICT DO NOTHING;

-- 4. 로컬 이벤트 샘플 데이터 삽입
-- =============================================
INSERT INTO local_events (id, category, sub_category, sub_sub_category, project_type, project_id, custom_project, summary, description, start_date_time, start_date, end_date_time, end_date, location, participant_id, created_by_id) VALUES
('event1', '기타일정', NULL, NULL, '팀 미팅', '주간 팀 미팅', '2024-01-15 10:00:00+09:00', '2024-01-15', '2024-01-15 11:00:00+09:00', '2024-01-15', '회의실 A', 'user2', 'user1'),
('event2', '조립완료', NULL, NULL, '프로젝트', 1, NULL, '프로젝트 리뷰', '프로젝트 진행 상황 리뷰', '2024-01-16 14:00:00+09:00', '2024-01-16', '2024-01-16 15:30:00+09:00', '2024-01-16', '회의실 B', 'user3', 'user2'),
('event3', '출장/외근', '출장', '시운전', '프로젝트', 2, NULL, '연수 프로그램', '5일간의 연수 프로그램', '2024-01-20 09:00:00+09:00', '2024-01-20', '2024-01-24 17:00:00+09:00', '2024-01-24', '교육센터', 'user3', 'user3'),
('event4', '반/연차', '연차', NULL, '휴가', '개인 휴가', NULL, '2024-01-25', NULL, '2024-01-27', '제주도', 'user4', 'user4'),
('event5', 'AS/SS', 'AS', 'AS', 'AS/SS', 3, NULL, '긴급 수리', 'C동 전력 시스템 긴급 수리', '2024-01-28 08:00:00+09:00', '2024-01-28', '2024-01-28 18:00:00+09:00', '2024-01-28', 'C동 전기실', 'user1', 'user5'),
('event6', '기타일정', NULL, NULL, '교육 세미나', '신기술 교육 세미나', '2024-01-30 09:00:00+09:00', '2024-01-30', '2024-01-30 17:00:00+09:00', '2024-01-30', '교육장', 'user2', 'user4'),
('event7', '출장/외근', '외근', '현장답사', '프로젝트', 4, NULL, '현장 답사', '군자 프로젝트 현장 답사', '2024-02-01 09:00:00+09:00', '2024-02-01', '2024-02-01 17:00:00+09:00', '2024-02-01', '군자 현장', 'user3', 'user3'),
('event8', '반/연차', '반차', NULL, '오전 반차', '개인 사정으로 오전 반차', NULL, '2024-02-05', NULL, '2024-02-05', '집', 'user1', 'user1')
ON CONFLICT (id) DO UPDATE SET
    category = EXCLUDED.category,
    sub_category = EXCLUDED.sub_category,
    sub_sub_category = EXCLUDED.sub_sub_category,
    project_type = EXCLUDED.project_type,
    project_id = EXCLUDED.project_id,
    custom_project = EXCLUDED.custom_project,
    summary = EXCLUDED.summary,
    description = EXCLUDED.description,
    start_date_time = EXCLUDED.start_date_time,
    start_date = EXCLUDED.start_date,
    end_date_time = EXCLUDED.end_date_time,
    end_date = EXCLUDED.end_date,
    location = EXCLUDED.location,
    participant_id = EXCLUDED.participant_id,
    created_by_id = EXCLUDED.created_by_id,
    updated_at = CURRENT_TIMESTAMP;

-- 5. 프로젝트 이벤트 샘플 데이터 삽입
-- =============================================
INSERT INTO project_events (id, project_id, event_type, event_date, description) VALUES
('assembly-1', 1, '조립완료', '2024-01-15', '브라질 CSP 조립완료'),
('factory-1', 1, '공장시운전', '2024-02-15', '브라질 CSP 공장시운전'),
('site-1', 1, '현장시운전', '2024-03-15', '브라질 CSP 현장시운전'),
('assembly-2', 2, '조립완료', '2024-02-01', '제천 조립완료'),
('factory-2', 2, '공장시운전', '2024-03-01', '제천 공장시운전'),
('site-2', 2, '현장시운전', '2024-04-01', '제천 현장시운전'),
('assembly-3', 3, '조립완료', '2024-02-15', '도봉 조립완료'),
('factory-3', 3, '공장시운전', '2024-03-15', '도봉 공장시운전'),
('site-3', 3, '현장시운전', '2024-04-15', '도봉 현장시운전'),
('assembly-4', 4, '조립완료', '2024-03-01', '군자 조립완료'),
('factory-4', 4, '공장시운전', '2024-04-01', '군자 공장시운전'),
('site-4', 4, '현장시운전', '2024-05-01', '군자 현장시운전'),
('assembly-5', 5, '조립완료', '2024-03-15', '덕하 조립완료'),
('factory-5', 5, '공장시운전', '2024-04-15', '덕하 공장시운전'),
('site-5', 5, '현장시운전', '2024-05-15', '덕하 현장시운전')
ON CONFLICT (id) DO UPDATE SET
    project_id = EXCLUDED.project_id,
    event_type = EXCLUDED.event_type,
    event_date = EXCLUDED.event_date,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- 6. 데이터 검증 쿼리
-- =============================================
-- 삽입된 데이터 확인
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'work_diary', COUNT(*) FROM work_diary
UNION ALL
SELECT 'local_events', COUNT(*) FROM local_events
UNION ALL
SELECT 'project_events', COUNT(*) FROM project_events;

-- 외래키 제약조건 확인
SELECT 
    'work_diary' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN user_id IN (SELECT id FROM users) THEN 1 END) as valid_user_refs,
    COUNT(CASE WHEN project_id IN (SELECT id FROM projects) OR project_id IS NULL THEN 1 END) as valid_project_refs
FROM work_diary
UNION ALL
SELECT 
    'local_events',
    COUNT(*),
    COUNT(CASE WHEN participant_id IN (SELECT id FROM users) THEN 1 END),
    COUNT(CASE WHEN project_id IN (SELECT id FROM projects) OR project_id IS NULL THEN 1 END)
FROM local_events
UNION ALL
SELECT 
    'project_events',
    COUNT(*),
    0,
    COUNT(CASE WHEN project_id IN (SELECT id FROM projects) THEN 1 END)
FROM project_events;
