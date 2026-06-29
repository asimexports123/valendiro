-- Migration: Automation Settings and Content Lifecycle Management

-- Global system settings for automation control and rate limits
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- Seed defaults
INSERT INTO system_settings (key, value, description) VALUES
  ('AUTOMATION_ENABLED', 'true', 'Master kill switch for all automation'),
  ('publish_limit_per_run', '100', 'Max articles to publish per cron run'),
  ('demand_discovery_enabled', 'true', 'Enable demand discovery sources'),
  ('quality_gate_enabled', 'true', 'Enable quality gate before publish')
ON CONFLICT (key) DO NOTHING;

-- Add lifecycle status to articles
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS lifecycle_status TEXT NOT NULL DEFAULT 'draft'
  CHECK (lifecycle_status IN ('draft', 'published', 'indexed', 'growing', 'stable', 'declining', 'update_required', 'archived'));

CREATE INDEX IF NOT EXISTS idx_articles_lifecycle ON articles(lifecycle_status);

-- Track last successful publish and cron runs
CREATE TABLE IF NOT EXISTS system_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_events_type ON system_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_events_name ON system_events(event_name, created_at DESC);
