-- ========================================
-- 작업유형/세부유형 제약조건 업데이트
-- 프로젝트명에 따른 작업유형/세부유형 규칙 적용
-- ========================================

-- 1. 작업유형 제약조건 추가
ALTER TABLE work_diary 
ADD CONSTRAINT check_work_type_wsms 
CHECK (
  -- WSMS 관련 프로젝트인 경우: 신규, 보완, AS, SS, OV만 허용
  (work_type IN ('신규', '보완', 'AS', 'SS', 'OV') AND 
   EXISTS (
     SELECT 1 FROM projects p 
     WHERE p.id = work_diary.project_id 
     AND (
       LOWER(p.project_number) LIKE '%cncwl%' OR
       LOWER(p.project_number) LIKE '%cncuwl%' OR
       LOWER(p.project_number) LIKE '%wsms%' OR
       LOWER(p.project_number) LIKE '%m&d%' OR
       LOWER(p.project_number) LIKE '%tandem%' OR
       LOWER(p.project_number) LIKE '%cncdwl%'
     )
   )) OR
  -- WSMS 관련 프로젝트가 아닌 경우: 빈 문자열 또는 자유 입력 허용
  (NOT EXISTS (
     SELECT 1 FROM projects p 
     WHERE p.id = work_diary.project_id 
     AND (
       LOWER(p.project_number) LIKE '%cncwl%' OR
       LOWER(p.project_number) LIKE '%cncuwl%' OR
       LOWER(p.project_number) LIKE '%wsms%' OR
       LOWER(p.project_number) LIKE '%m&d%' OR
       LOWER(p.project_number) LIKE '%tandem%' OR
       LOWER(p.project_number) LIKE '%cncdwl%'
     )
   ))
);

-- 2. 세부유형 제약조건 추가
ALTER TABLE work_diary 
ADD CONSTRAINT check_work_sub_type_wsms 
CHECK (
  -- WSMS 관련 프로젝트이고 작업유형이 선택된 경우: 출장, 외근, 전화만 허용
  (work_sub_type IN ('출장', '외근', '전화') AND 
   work_type IN ('신규', '보완', 'AS', 'SS', 'OV') AND
   EXISTS (
     SELECT 1 FROM projects p 
     WHERE p.id = work_diary.project_id 
     AND (
       LOWER(p.project_number) LIKE '%cncwl%' OR
       LOWER(p.project_number) LIKE '%cncuwl%' OR
       LOWER(p.project_number) LIKE '%wsms%' OR
       LOWER(p.project_number) LIKE '%m&d%' OR
       LOWER(p.project_number) LIKE '%tandem%' OR
       LOWER(p.project_number) LIKE '%cncdwl%'
     )
   )) OR
  -- WSMS 관련 프로젝트가 아니거나 작업유형이 없는 경우: 빈 문자열 또는 자유 입력 허용
  (NOT EXISTS (
     SELECT 1 FROM projects p 
     WHERE p.id = work_diary.project_id 
     AND (
       LOWER(p.project_number) LIKE '%cncwl%' OR
       LOWER(p.project_number) LIKE '%cncuwl%' OR
       LOWER(p.project_number) LIKE '%wsms%' OR
       LOWER(p.project_number) LIKE '%m&d%' OR
       LOWER(p.project_number) LIKE '%tandem%' OR
       LOWER(p.project_number) LIKE '%cncdwl%'
     )
   ) OR work_type = '' OR work_type IS NULL)
);

-- 3. 통계 분석을 위한 뷰 업데이트
CREATE OR REPLACE VIEW work_diary_stats_enhanced AS
SELECT 
    DATE(work_date) as work_date,
    CASE 
        WHEN custom_project_name IS NOT NULL THEN custom_project_name
        ELSE p.project_name
    END as project_name,
    work_type,
    work_sub_type,
    -- 프로젝트 유형 분류
    CASE 
        WHEN custom_project_name IS NOT NULL THEN
            CASE 
                WHEN LOWER(custom_project_name) LIKE '%cncwl%' OR
                     LOWER(custom_project_name) LIKE '%cncuwl%' OR
                     LOWER(custom_project_name) LIKE '%wsms%' OR
                     LOWER(custom_project_name) LIKE '%m&d%' OR
                     LOWER(custom_project_name) LIKE '%tandem%' THEN 'WSMS'
                ELSE 'OTHER'
            END
        ELSE
            CASE 
                WHEN LOWER(p.project_name) LIKE '%cncwl%' OR
                     LOWER(p.project_name) LIKE '%cncuwl%' OR
                     LOWER(p.project_name) LIKE '%wsms%' OR
                     LOWER(p.project_name) LIKE '%m&d%' OR
                     LOWER(p.project_name) LIKE '%tandem%' THEN 'WSMS'
                ELSE 'OTHER'
            END
    END as project_category,
    COUNT(*) as work_count,
    COUNT(DISTINCT user_id) as user_count
FROM work_diary wd
LEFT JOIN projects p ON wd.project_id = p.id
GROUP BY DATE(work_date), 
         CASE WHEN custom_project_name IS NOT NULL THEN custom_project_name ELSE p.project_name END,
         work_type, 
         work_sub_type,
         CASE 
            WHEN custom_project_name IS NOT NULL THEN
                CASE 
                    WHEN LOWER(custom_project_name) LIKE '%cncwl%' OR
                         LOWER(custom_project_name) LIKE '%cncuwl%' OR
                         LOWER(custom_project_name) LIKE '%wsms%' OR
                         LOWER(custom_project_name) LIKE '%m&d%' OR
                         LOWER(custom_project_name) LIKE '%tandem%' THEN 'WSMS'
                    ELSE 'OTHER'
                END
            ELSE
                CASE 
                    WHEN LOWER(p.project_name) LIKE '%cncwl%' OR
                         LOWER(p.project_name) LIKE '%cncuwl%' OR
                         LOWER(p.project_name) LIKE '%wsms%' OR
                         LOWER(p.project_name) LIKE '%m&d%' OR
                         LOWER(p.project_name) LIKE '%tandem%' THEN 'WSMS'
                    ELSE 'OTHER'
                END
         END
ORDER BY work_date DESC;

-- 4. 프로젝트별 작업유형 통계 뷰
CREATE OR REPLACE VIEW project_work_type_stats AS
SELECT 
    CASE 
        WHEN custom_project_name IS NOT NULL THEN custom_project_name
        ELSE p.project_name
    END as project_name,
    CASE 
        WHEN custom_project_name IS NOT NULL THEN
            CASE 
                WHEN LOWER(custom_project_name) LIKE '%cncwl%' OR
                     LOWER(custom_project_name) LIKE '%cncuwl%' OR
                     LOWER(custom_project_name) LIKE '%wsms%' OR
                     LOWER(custom_project_name) LIKE '%m&d%' OR
                     LOWER(custom_project_name) LIKE '%tandem%' THEN 'WSMS'
                ELSE 'OTHER'
            END
        ELSE
            CASE 
                WHEN LOWER(p.project_name) LIKE '%cncwl%' OR
                     LOWER(p.project_name) LIKE '%cncuwl%' OR
                     LOWER(p.project_name) LIKE '%wsms%' OR
                     LOWER(p.project_name) LIKE '%m&d%' OR
                     LOWER(p.project_name) LIKE '%tandem%' THEN 'WSMS'
                ELSE 'OTHER'
            END
    END as project_category,
    work_type,
    work_sub_type,
    COUNT(*) as work_count,
    COUNT(DISTINCT user_id) as user_count,
    MIN(work_date) as first_work_date,
    MAX(work_date) as last_work_date
FROM work_diary wd
LEFT JOIN projects p ON wd.project_id = p.id
GROUP BY CASE WHEN custom_project_name IS NOT NULL THEN custom_project_name ELSE p.project_name END,
         CASE 
            WHEN custom_project_name IS NOT NULL THEN
                CASE 
                    WHEN LOWER(custom_project_name) LIKE '%cncwl%' OR
                         LOWER(custom_project_name) LIKE '%cncuwl%' OR
                         LOWER(custom_project_name) LIKE '%wsms%' OR
                         LOWER(custom_project_name) LIKE '%m&d%' OR
                         LOWER(custom_project_name) LIKE '%tandem%' THEN 'WSMS'
                    ELSE 'OTHER'
                END
            ELSE
                CASE 
                    WHEN LOWER(p.project_name) LIKE '%cncwl%' OR
                         LOWER(p.project_name) LIKE '%cncuwl%' OR
                         LOWER(p.project_name) LIKE '%wsms%' OR
                         LOWER(p.project_name) LIKE '%m&d%' OR
                         LOWER(p.project_name) LIKE '%tandem%' THEN 'WSMS'
                    ELSE 'OTHER'
                END
         END,
         work_type, 
         work_sub_type
ORDER BY work_count DESC;

-- 5. 기존 데이터 정리 (필요시)
-- WSMS 관련 프로젝트의 잘못된 작업유형/세부유형 정리
UPDATE work_diary 
SET work_type = '', work_sub_type = ''
WHERE work_type NOT IN ('신규', '보완', 'AS', 'SS', 'OV')
AND EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = work_diary.project_id 
    AND (
        LOWER(p.project_name) LIKE '%cncwl%' OR
        LOWER(p.project_name) LIKE '%cncuwl%' OR
        LOWER(p.project_name) LIKE '%wsms%' OR
        LOWER(p.project_name) LIKE '%m&d%' OR
        LOWER(p.project_name) LIKE '%tandem%'
    )
);

UPDATE work_diary 
SET work_sub_type = ''
WHERE work_sub_type NOT IN ('출장', '외근', '전화')
AND work_type IN ('신규', '보완', 'AS', 'SS', 'OV')
AND EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = work_diary.project_id 
    AND (
        LOWER(p.project_name) LIKE '%cncwl%' OR
        LOWER(p.project_name) LIKE '%cncuwl%' OR
        LOWER(p.project_name) LIKE '%wsms%' OR
        LOWER(p.project_name) LIKE '%m&d%' OR
        LOWER(p.project_name) LIKE '%tandem%'
    )
);

-- 6. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_work_diary_project_category ON work_diary(
    CASE 
        WHEN custom_project_name IS NOT NULL THEN
            CASE 
                WHEN LOWER(custom_project_name) LIKE '%cncwl%' OR
                     LOWER(custom_project_name) LIKE '%cncuwl%' OR
                     LOWER(custom_project_name) LIKE '%wsms%' OR
                     LOWER(custom_project_name) LIKE '%m&d%' OR
                     LOWER(custom_project_name) LIKE '%tandem%' THEN 'WSMS'
                ELSE 'OTHER'
            END
        ELSE
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM projects p 
                    WHERE p.id = work_diary.project_id 
                    AND (
                        LOWER(p.project_name) LIKE '%cncwl%' OR
                        LOWER(p.project_name) LIKE '%cncuwl%' OR
                        LOWER(p.project_name) LIKE '%wsms%' OR
                        LOWER(p.project_name) LIKE '%m&d%' OR
                        LOWER(p.project_name) LIKE '%tandem%'
                    )
                ) THEN 'WSMS'
                ELSE 'OTHER'
            END
    END
);

COMMENT ON CONSTRAINT check_work_type_wsms ON work_diary IS 'WSMS 관련 프로젝트는 신규/보완/AS/SS/OV만 허용, 기타는 자유 입력';
COMMENT ON CONSTRAINT check_work_sub_type_wsms ON work_diary IS 'WSMS 관련 프로젝트는 출장/외근/전화만 허용, 기타는 자유 입력';
COMMENT ON VIEW work_diary_stats_enhanced IS '프로젝트 카테고리별 통계 뷰 (WSMS/OTHER 구분)';
COMMENT ON VIEW project_work_type_stats IS '프로젝트별 작업유형/세부유형 통계 뷰';
