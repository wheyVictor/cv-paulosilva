-- Voice rate limiting table for santifer.io voice mode
-- Apply this migration to your Supabase project

CREATE TABLE IF NOT EXISTS voice_rate_limits (
  ip TEXT PRIMARY KEY,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_voice_rate_limits_window
  ON voice_rate_limits (window_start);

-- RLS: only service role can access (API calls use service role key)
ALTER TABLE voice_rate_limits ENABLE ROW LEVEL SECURITY;

-- Cleanup old entries (run periodically or via cron)
-- DELETE FROM voice_rate_limits WHERE window_start < NOW() - INTERVAL '24 hours';
