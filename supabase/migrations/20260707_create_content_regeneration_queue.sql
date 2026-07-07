-- Content Regeneration Queue Table
-- This table tracks all regeneration jobs in the canonical pipeline

CREATE TABLE IF NOT EXISTS content_regeneration_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  topic_slug TEXT NOT NULL,
  topic_title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'failed', 'published')),
  stage TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  logs TEXT[] NOT NULL DEFAULT '{}',
  error TEXT,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_remaining_seconds INTEGER,
  previous_content TEXT, -- Preserved for rollback on failure
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_regeneration_queue_status ON content_regeneration_queue(status);
CREATE INDEX IF NOT EXISTS idx_regeneration_queue_topic_id ON content_regeneration_queue(topic_id);
CREATE INDEX IF NOT EXISTS idx_regeneration_queue_queued_at ON content_regeneration_queue(queued_at DESC);

-- Enable RLS
ALTER TABLE content_regeneration_queue ENABLE ROW LEVEL SECURITY;

-- Policies (admin only access)
CREATE POLICY "Admins can view all regeneration jobs" ON content_regeneration_queue
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert regeneration jobs" ON content_regeneration_queue
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update regeneration jobs" ON content_regeneration_queue
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete regeneration jobs" ON content_regeneration_queue
  FOR DELETE USING (auth.role() = 'authenticated');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_regeneration_queue_updated_at
  BEFORE UPDATE ON content_regeneration_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
