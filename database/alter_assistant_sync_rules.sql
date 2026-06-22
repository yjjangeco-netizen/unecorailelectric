-- Assistant sync rules: Google Calendar/Tasks/Drive + Telegram notification settings
-- Run this in Supabase SQL Editor after deployment if these columns do not exist yet.

ALTER TABLE assistant_google_event_links
  ADD COLUMN IF NOT EXISTS local_table TEXT DEFAULT 'events',
  ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced',
  ADD COLUMN IF NOT EXISTS google_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS google_summary TEXT,
  ADD COLUMN IF NOT EXISTS google_description TEXT;

CREATE INDEX IF NOT EXISTS idx_assistant_google_event_links_status
ON assistant_google_event_links(user_id, sync_status);

CREATE INDEX IF NOT EXISTS idx_assistant_google_event_links_local_table
ON assistant_google_event_links(user_id, local_table, local_event_id);

-- Optional: hide old personal calendar rows from normal web views by marking them clearly.
-- The API already filters these categories out, so this is not required.
-- UPDATE events
-- SET category = '개인일정'
-- WHERE category IN ('개인 AI', '개인 대화분석', '통화녹음 개인');

-- Stored inside assistant_settings.settings JSON:
-- google_business_calendar_id: 'Unecorail'
-- google_personal_calendar_id: '개인일정'
-- google_task_list_name: 'Unecorail'
-- morning_brief_time: '08:01'
-- work_report_reminder_time: '16:45'

-- Telegram target chat IDs are configured through environment variables:
-- TELEGRAM_PERSONAL_CHAT_ID: your personal Telegram chat id
-- TELEGRAM_WORK_CHAT_ID: yjjang work room chat id
