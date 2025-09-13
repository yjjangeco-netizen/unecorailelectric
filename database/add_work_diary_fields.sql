-- 업무일지 테이블에 작업 유형과 세부 유형, 기타 프로젝트명 컬럼 추가
-- 통계 분석을 위한 필드들

-- work_diary 테이블에 새로운 컬럼들 추가
ALTER TABLE work_diary 
ADD COLUMN IF NOT EXISTS work_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS work_sub_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS custom_project_name VARCHAR(255);

-- 인덱스 추가 (통계 쿼리 성능 향상)
CREATE INDEX IF NOT EXISTS idx_work_diary_work_type ON work_diary(work_type);
CREATE INDEX IF NOT EXISTS idx_work_diary_work_sub_type ON work_diary(work_sub_type);
CREATE INDEX IF NOT EXISTS idx_work_diary_custom_project ON work_diary(custom_project_name);

-- 기존 데이터에 대한 기본값 설정 (필요시)
UPDATE work_diary 
SET work_type = '신규', 
    work_sub_type = '', 
    custom_project_name = NULL 
WHERE work_type IS NULL;

-- 통계 분석을 위한 뷰 생성
CREATE OR REPLACE VIEW work_diary_stats AS
SELECT 
    DATE(work_date) as work_date,
    CASE 
        WHEN custom_project_name IS NOT NULL THEN custom_project_name
        ELSE p.project_name
    END as project_name,
    work_type,
    work_sub_type,
    COUNT(*) as work_count,
    COUNT(DISTINCT user_id) as user_count
FROM work_diary wd
LEFT JOIN projects p ON wd.project_id = p.id
GROUP BY DATE(work_date), 
         CASE WHEN custom_project_name IS NOT NULL THEN custom_project_name ELSE p.project_name END,
         work_type, 
         work_sub_type
ORDER BY work_date DESC;

-- 월별 통계 뷰
CREATE OR REPLACE VIEW monthly_work_stats AS
SELECT 
    DATE_TRUNC('month', work_date) as month,
    work_type,
    COUNT(*) as total_entries,
    COUNT(DISTINCT user_id) as active_users,
    COUNT(DISTINCT CASE WHEN custom_project_name IS NOT NULL THEN custom_project_name ELSE p.project_name END) as unique_projects
FROM work_diary wd
LEFT JOIN projects p ON wd.project_id = p.id
GROUP BY DATE_TRUNC('month', work_date), work_type
ORDER BY month DESC, work_type;

-- 프로젝트별 통계 뷰
CREATE OR REPLACE VIEW project_work_stats AS
SELECT 
    CASE 
        WHEN custom_project_name IS NOT NULL THEN custom_project_name
        ELSE p.project_name
    END as project_name,
    work_type,
    work_sub_type,
    COUNT(*) as work_count,
    COUNT(DISTINCT user_id) as user_count,
    MIN(work_date) as first_work_date,
    MAX(work_date) as last_work_date
FROM work_diary wd
LEFT JOIN projects p ON wd.project_id = p.id
GROUP BY CASE WHEN custom_project_name IS NOT NULL THEN custom_project_name ELSE p.project_name END,
         work_type, 
         work_sub_type
ORDER BY work_count DESC;

COMMENT ON COLUMN work_diary.work_type IS '작업 유형 (신규, AS, SS, OV, 기타 등)';
COMMENT ON COLUMN work_diary.work_sub_type IS '세부 유형 (출장, 외근, 통화, 기타 등)';
COMMENT ON COLUMN work_diary.custom_project_name IS '기타 프로젝트명 (project_id가 NULL일 때 사용)';
