    -- 외근/출장 관련 테이블 생성

    -- 1. 외근/출장 등록 테이블
    CREATE TABLE IF NOT EXISTS business_trips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    title TEXT NOT NULL,
    purpose TEXT NOT NULL,
    location TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
    report_status TEXT DEFAULT 'pending', -- pending, submitted, approved
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 2. 외근/출장 보고서 테이블
    CREATE TABLE IF NOT EXISTS business_trip_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES business_trips(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    status TEXT DEFAULT 'submitted', -- submitted, approved, rejected
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 3. 인덱스 생성
    CREATE INDEX IF NOT EXISTS idx_business_trips_user_id ON business_trips(user_id);
    CREATE INDEX IF NOT EXISTS idx_business_trips_dates ON business_trips(start_date, end_date);
    CREATE INDEX IF NOT EXISTS idx_business_trips_status ON business_trips(status);
    CREATE INDEX IF NOT EXISTS idx_business_trip_reports_trip_id ON business_trip_reports(trip_id);
    CREATE INDEX IF NOT EXISTS idx_business_trip_reports_user_id ON business_trip_reports(user_id);

    -- 4. RLS 정책 설정
    ALTER TABLE business_trips ENABLE ROW LEVEL SECURITY;
    ALTER TABLE business_trip_reports ENABLE ROW LEVEL SECURITY;

    -- 외근/출장 테이블 정책: 자신의 것과 상위 레벨이 볼 수 있음
    CREATE POLICY "Users can view their own business trips" ON business_trips
    FOR SELECT USING (
        user_id = current_setting('app.current_user', true)::text
    );

    CREATE POLICY "Managers can view all business trips" ON business_trips
    FOR SELECT USING (
        EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = current_setting('app.current_user', true)::text 
        AND (u.level = '5' OR u.level = 'administrator')
        )
    );

    -- 보고서 테이블 정책: 자신의 것과 상위 레벨에서 하위 레벨의 보고서를 볼 수 있음
    CREATE POLICY "Users can view their own and lower level reports" ON business_trip_reports
    FOR SELECT USING (
        user_id = current_setting('app.current_user', true)::text
        OR EXISTS (
        SELECT 1 FROM users u1, users u2
        WHERE u1.id = current_setting('app.current_user', true)::text 
        AND u2.id = business_trip_reports.user_id
        AND (
            (u1.level = 'administrator') OR
            (u1.level = '5' AND u2.level::integer < 5) OR
            (u1.level = '4' AND u2.level::integer < 4) OR
            (u1.level = '3' AND u2.level::integer < 3) OR
            (u1.level = '2' AND u2.level::integer < 2) OR
            (u1.level = '1' AND u2.level::integer < 1)
        )
        )
    );
