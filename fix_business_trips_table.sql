-- business_trips 테이블 구조 수정 및 컬럼 추가

-- 1. 기존 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'business_trips' 
ORDER BY ordinal_position;

-- 2. 필요한 컬럼들 추가
ALTER TABLE business_trips 
ADD COLUMN IF NOT EXISTS trip_type VARCHAR(20) DEFAULT 'field_work',
ADD COLUMN IF NOT EXISTS user_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS title VARCHAR(200),
ADD COLUMN IF NOT EXISTS purpose TEXT,
ADD COLUMN IF NOT EXISTS location VARCHAR(200),
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS created_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS created_by_level VARCHAR(10);

-- 3. 컬럼 코멘트 추가
COMMENT ON COLUMN business_trips.trip_type IS '출장/외근 구분 (business/field_work)';
COMMENT ON COLUMN business_trips.user_name IS '사용자 이름';
COMMENT ON COLUMN business_trips.title IS '제목';
COMMENT ON COLUMN business_trips.purpose IS '목적/내용';
COMMENT ON COLUMN business_trips.location IS '장소';
COMMENT ON COLUMN business_trips.start_date IS '시작일';
COMMENT ON COLUMN business_trips.end_date IS '종료일';
COMMENT ON COLUMN business_trips.start_time IS '시작시간';
COMMENT ON COLUMN business_trips.end_time IS '종료시간';
COMMENT ON COLUMN business_trips.status IS '상태 (approved/pending/rejected)';

-- 4. 기존 데이터가 있다면 기본값 설정
UPDATE business_trips 
SET 
    trip_type = 'field_work',
    user_name = 'Unknown',
    title = '제목 없음',
    purpose = '내용 없음',
    location = '미지정',
    status = 'approved'
WHERE trip_type IS NULL;

-- 5. 테스트 데이터 삽입
INSERT INTO business_trips (
    user_id,
    user_name,
    title,
    purpose,
    location,
    start_date,
    end_date,
    start_time,
    end_time,
    status,
    trip_type,
    created_at,
    updated_at
) VALUES (
    '1',
    '테스트 사용자',
    '테스트 외근',
    '시스템 테스트',
    '테스트 현장',
    '2025-01-07',
    '2025-01-07',
    '09:00:00',
    '18:00:00',
    'approved',
    'field_work',
    NOW(),
    NOW()
);

-- 6. 최종 확인
SELECT * FROM business_trips ORDER BY created_at DESC LIMIT 5;
