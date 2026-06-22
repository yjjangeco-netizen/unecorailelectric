-- Telegram assistant account linkage
CREATE TABLE IF NOT EXISTS telegram_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id TEXT NOT NULL UNIQUE,
  telegram_user_id TEXT,
  username TEXT,
  display_name TEXT,
  linked_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_users_chat_id ON telegram_users(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_users_linked_user_id ON telegram_users(linked_user_id);

COMMENT ON TABLE telegram_users IS 'Telegram chat to UNECO user linkage for the personal assistant';

-- The current API uses the existing Supabase anon key from server routes.
-- These policies allow the webhook route to manage Telegram links while RLS is enabled.
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "telegram_users_select" ON telegram_users;
DROP POLICY IF EXISTS "telegram_users_insert" ON telegram_users;
DROP POLICY IF EXISTS "telegram_users_update" ON telegram_users;

CREATE POLICY "telegram_users_select"
ON telegram_users FOR SELECT
USING (true);

CREATE POLICY "telegram_users_insert"
ON telegram_users FOR INSERT
WITH CHECK (true);

CREATE POLICY "telegram_users_update"
ON telegram_users FOR UPDATE
USING (true)
WITH CHECK (true);
