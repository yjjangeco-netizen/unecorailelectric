-- 캘린더 이벤트 테이블 생성
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  category VARCHAR(50) DEFAULT '기타',
  sub_category VARCHAR(50),
  description TEXT,
  location VARCHAR(255),
  participant_id UUID REFERENCES auth.users(id),
  companions JSONB, -- 동행자 ID 배열
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_participant_id ON calendar_events(participant_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);
CREATE INDEX IF NOT EXISTS idx_calendar_events_category ON calendar_events(category);

-- RLS (Row Level Security) 활성화
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- 정책 생성: 사용자는 자신이 생성한 이벤트만 조회/수정/삭제 가능
CREATE POLICY "Users can view their own events" ON calendar_events
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own events" ON calendar_events
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own events" ON calendar_events
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own events" ON calendar_events
  FOR DELETE USING (auth.uid() = created_by);

-- 관리자는 모든 이벤트 조회 가능 (선택사항)
-- CREATE POLICY "Admins can view all events" ON calendar_events
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM user_profiles 
--       WHERE user_id = auth.uid() AND level = 'admin'
--     )
--   );

-- updated_at 자동 업데이트를 위한 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_calendar_events_updated_at 
  BEFORE UPDATE ON calendar_events 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 삽입 (선택사항)
INSERT INTO calendar_events (title, start_date, end_date, start_time, end_time, category, sub_category, description, location, participant_id, created_by)
VALUES 
  ('팀 미팅', '2024-01-15', '2024-01-15', '09:00:00', '10:00:00', '회의', '정기미팅', '주간 팀 미팅', '회의실 A', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('출장', '2024-01-20', '2024-01-22', NULL, NULL, '출장/외근', '현장답사', '고객사 현장 방문', '서울시 강남구', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('교육', '2024-01-25', '2024-01-25', '14:00:00', '17:00:00', '교육', '기술교육', 'React 고급 기법 교육', '교육실 B', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT (id) DO NOTHING;
