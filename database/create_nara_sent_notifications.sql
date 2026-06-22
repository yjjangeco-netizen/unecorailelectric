CREATE TABLE IF NOT EXISTS nara_sent_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT,
  url TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nara_sent_notifications_sent_at
ON nara_sent_notifications(sent_at DESC);

COMMENT ON TABLE nara_sent_notifications IS 'NARA/Korail search results already sent to Telegram.';
