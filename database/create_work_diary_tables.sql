-- ========================================
-- 업무일지 관련 테이블 생성
-- ========================================

-- 1. 프로젝트 테이블
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 업무일지 테이블
CREATE TABLE IF NOT EXISTS work_diary (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    work_date DATE NOT NULL,
    project_id INTEGER REFERENCES projects(id),
    work_content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 기본 프로젝트 데이터 삽입
INSERT INTO projects (name, description) VALUES
('전기설비 유지보수', '전기설비 점검 및 유지보수 작업'),
('신규 설치', '새로운 전기설비 설치 작업'),
('고장 수리', '전기설비 고장 수리 및 복구'),
('점검 작업', '정기 점검 및 안전점검'),
('기타 업무', '기타 전기 관련 업무')
ON CONFLICT DO NOTHING;

-- 4. 인덱스 생성
CREATE INDEX idx_work_diary_user_id ON work_diary(user_id);
CREATE INDEX idx_work_diary_date ON work_diary(work_date);
CREATE INDEX idx_work_diary_project ON work_diary(project_id);

-- 5. RLS 정책 설정
ALTER TABLE work_diary ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 프로젝트 조회 가능
CREATE POLICY "Users can view projects" ON projects
    FOR SELECT USING (true);

-- 사용자는 자신의 업무일지만 조회 가능
CREATE POLICY "Users can view own work diary" ON work_diary
    FOR SELECT USING (user_id = current_setting('app.current_user', true)::text);

-- 사용자는 자신의 업무일지만 작성/수정 가능
CREATE POLICY "Users can manage own work diary" ON work_diary
    FOR ALL USING (user_id = current_setting('app.current_user', true)::text);

-- 6. 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_work_diary_updated_at 
    BEFORE UPDATE ON work_diary 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
