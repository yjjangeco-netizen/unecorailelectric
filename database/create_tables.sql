-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    level VARCHAR(20) NOT NULL DEFAULT '1',
    permissions TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 프로젝트 테이블
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    project_name VARCHAR(200) NOT NULL,
    project_number VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    assembly_date DATE,
    factory_test_date DATE,
    site_test_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 업무일지 테이블
CREATE TABLE IF NOT EXISTS work_diary (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id),
    work_date DATE NOT NULL,
    project_id INTEGER REFERENCES projects(id),
    work_content TEXT NOT NULL,
    work_type VARCHAR(50),
    work_sub_type VARCHAR(50),
    custom_project_name VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 일정 테이블 (로컬 이벤트)
CREATE TABLE IF NOT EXISTS local_events (
    id VARCHAR(50) PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    sub_category VARCHAR(50),
    sub_sub_category VARCHAR(50),
    project_type VARCHAR(50),
    project_id INTEGER REFERENCES projects(id),
    custom_project VARCHAR(200),
    summary VARCHAR(200) NOT NULL,
    description TEXT,
    start_date_time TIMESTAMP,
    start_date DATE,
    end_date_time TIMESTAMP,
    end_date DATE,
    location VARCHAR(200),
    participant_id VARCHAR(50) NOT NULL REFERENCES users(id),
    created_by_id VARCHAR(50) NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 프로젝트 이벤트 테이블
CREATE TABLE IF NOT EXISTS project_events (
    id VARCHAR(50) PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    event_type VARCHAR(50) NOT NULL, -- '조립완료', '공장시운전', '현장시운전'
    event_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_work_diary_user_id ON work_diary(user_id);
CREATE INDEX IF NOT EXISTS idx_work_diary_work_date ON work_diary(work_date);
CREATE INDEX IF NOT EXISTS idx_work_diary_project_id ON work_diary(project_id);
CREATE INDEX IF NOT EXISTS idx_local_events_participant_id ON local_events(participant_id);
CREATE INDEX IF NOT EXISTS idx_local_events_created_by_id ON local_events(created_by_id);
CREATE INDEX IF NOT EXISTS idx_local_events_start_date ON local_events(start_date);
CREATE INDEX IF NOT EXISTS idx_local_events_end_date ON local_events(end_date);
CREATE INDEX IF NOT EXISTS idx_project_events_project_id ON project_events(project_id);
CREATE INDEX IF NOT EXISTS idx_project_events_event_date ON project_events(event_date);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_diary ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_events ENABLE ROW LEVEL SECURITY;

-- 사용자 테이블 RLS 정책 (모든 사용자가 자신의 정보 조회 가능)
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::text = id);

-- 프로젝트 테이블 RLS 정책 (모든 사용자가 프로젝트 조회 가능)
CREATE POLICY "All users can view projects" ON projects
    FOR SELECT USING (true);

-- 업무일지 테이블 RLS 정책 (레벨별 권한 제한)
CREATE POLICY "Work diary level-based access" ON work_diary
    FOR SELECT USING (
        -- Level 1: 자신의 업무일지만 조회
        (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND level = '1') AND user_id = auth.uid()::text) OR
        -- Level 2: Level 1-2 사용자의 업무일지 조회
        (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND level = '2') AND 
         EXISTS (SELECT 1 FROM users WHERE id = user_id AND level IN ('1', '2'))) OR
        -- Level 3: Level 1-3 사용자의 업무일지 조회
        (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND level = '3') AND 
         EXISTS (SELECT 1 FROM users WHERE id = user_id AND level IN ('1', '2', '3'))) OR
        -- Level 4: Level 1-4 사용자의 업무일지 조회
        (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND level = '4') AND 
         EXISTS (SELECT 1 FROM users WHERE id = user_id AND level IN ('1', '2', '3', '4'))) OR
        -- Level 5: Level 1-5 사용자의 업무일지 조회
        (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND level = '5') AND 
         EXISTS (SELECT 1 FROM users WHERE id = user_id AND level IN ('1', '2', '3', '4', '5'))) OR
        -- Administrator: 모든 사용자의 업무일지 조회
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND level = 'administrator')
    );

-- 업무일지 생성 정책 (Level 2 이상만 생성 가능)
CREATE POLICY "Work diary creation policy" ON work_diary
    FOR INSERT WITH CHECK (
        user_id = auth.uid()::text AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND level IN ('2', '3', '4', '5', 'administrator'))
    );

-- 업무일지 수정 정책 (작성자만 수정 가능)
CREATE POLICY "Work diary update policy" ON work_diary
    FOR UPDATE USING (
        user_id = auth.uid()::text OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND level = 'administrator')
    );

-- 업무일지 삭제 정책 (작성자 또는 관리자만 삭제 가능)
CREATE POLICY "Work diary delete policy" ON work_diary
    FOR DELETE USING (
        user_id = auth.uid()::text OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND level = 'administrator')
    );

-- 일정 테이블 RLS 정책 (레벨별 권한 제한)
CREATE POLICY "Local events level-based access" ON local_events
    FOR SELECT USING (
        -- Level 1: 자신의 일정만 조회
        (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND level = '1') AND 
         (participant_id = auth.uid()::text OR created_by_id = auth.uid()::text)) OR
        -- Level 2: Level 1-2 사용자의 일정 조회
        (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND level = '2') AND 
         EXISTS (SELECT 1 FROM users WHERE id = participant_id AND level IN ('1', '2'))) OR
        -- Level 3: Level 1-3 사용자의 일정 조회
        (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND level = '3') AND 
         EXISTS (SELECT 1 FROM users WHERE id = participant_id AND level IN ('1', '2', '3'))) OR
        -- Level 4: Level 1-4 사용자의 일정 조회
        (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND level = '4') AND 
         EXISTS (SELECT 1 FROM users WHERE id = participant_id AND level IN ('1', '2', '3', '4'))) OR
        -- Level 5: Level 1-5 사용자의 일정 조회
        (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND level = '5') AND 
         EXISTS (SELECT 1 FROM users WHERE id = participant_id AND level IN ('1', '2', '3', '4', '5'))) OR
        -- Administrator: 모든 사용자의 일정 조회
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND level = 'administrator')
    );

-- 일정 생성 정책 (Level 3 이상만 생성 가능)
CREATE POLICY "Local events creation policy" ON local_events
    FOR INSERT WITH CHECK (
        created_by_id = auth.uid()::text AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND level IN ('3', '4', '5', 'administrator'))
    );

-- 일정 수정 정책 (작성자만 수정 가능)
CREATE POLICY "Local events update policy" ON local_events
    FOR UPDATE USING (
        created_by_id = auth.uid()::text OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND level = 'administrator')
    );

-- 일정 삭제 정책 (작성자 또는 관리자만 삭제 가능)
CREATE POLICY "Local events delete policy" ON local_events
    FOR DELETE USING (
        created_by_id = auth.uid()::text OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND level = 'administrator')
    );

-- 프로젝트 이벤트 테이블 RLS 정책 (모든 사용자가 조회 가능)
CREATE POLICY "Project events view policy" ON project_events
    FOR SELECT USING (true);

-- 프로젝트 이벤트 생성 정책 (Level 5 이상만 생성 가능)
CREATE POLICY "Project events creation policy" ON project_events
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND level IN ('5', 'administrator'))
    );

-- 프로젝트 이벤트 수정 정책 (Level 5 이상만 수정 가능)
CREATE POLICY "Project events update policy" ON project_events
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND level IN ('5', 'administrator'))
    );

-- 프로젝트 이벤트 삭제 정책 (Level 5 이상만 삭제 가능)
CREATE POLICY "Project events delete policy" ON project_events
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND level IN ('5', 'administrator'))
    );
