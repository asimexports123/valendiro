-- Migration for retry_queue table
-- Stores topics that failed validation for retry processing

CREATE TABLE IF NOT EXISTS retry_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  reason TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_attempted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for retry_queue
CREATE INDEX IF NOT EXISTS idx_retry_queue_topic_id ON retry_queue(topic_id);
CREATE INDEX IF NOT EXISTS idx_retry_queue_slug ON retry_queue(slug);
CREATE INDEX IF NOT EXISTS idx_retry_queue_retry_count ON retry_queue(retry_count);
CREATE INDEX IF NOT EXISTS idx_retry_queue_created_at ON retry_queue(created_at);

-- Enable RLS for retry_queue
ALTER TABLE retry_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies for retry_queue
CREATE POLICY "Service role can read retry_queue" ON retry_queue
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert retry_queue" ON retry_queue
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update retry_queue" ON retry_queue
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete retry_queue" ON retry_queue
  FOR DELETE USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_retry_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER retry_queue_updated_at
  BEFORE UPDATE ON retry_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_retry_queue_updated_at();
