-- work_diary 테이블에 출근시간, 퇴근시간, 초과근무시간 컬럼 추가
ALTER TABLE work_diary 
ADD COLUMN start_time TIME,
ADD COLUMN end_time TIME,
ADD COLUMN overtime_hours DECIMAL(4,2) DEFAULT 0.0;

-- 컬럼 설명 추가
COMMENT ON COLUMN work_diary.start_time IS '출근시간 (HH:MM 형식)';
COMMENT ON COLUMN work_diary.end_time IS '퇴근시간 (HH:MM 형식)';
COMMENT ON COLUMN work_diary.overtime_hours IS '초과근무시간 (시간 단위, 소수점 2자리)';

-- 기존 데이터에 기본값 설정 (선택사항)
UPDATE work_diary 
SET start_time = '09:00', end_time = '18:00', overtime_hours = 0.0
WHERE start_time IS NULL AND end_time IS NULL;
