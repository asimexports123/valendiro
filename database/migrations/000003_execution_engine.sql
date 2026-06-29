-- Migration: Autonomous Execution Engine
-- Adds execution logs, retry counters, and job tracking to queue tables.

-- Retry counters and failure tracking on existing queue tables
ALTER TABLE content_generation_queue ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE content_generation_queue ADD COLUMN IF NOT EXISTS failed_reason TEXT;
ALTER TABLE content_generation_queue ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;

ALTER TABLE content_update_queue ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE content_update_queue ADD COLUMN IF NOT EXISTS failed_reason TEXT;
ALTER TABLE content_update_queue ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;

ALTER TABLE content_priority_queue ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE content_priority_queue ADD COLUMN IF NOT EXISTS failed_reason TEXT;
ALTER TABLE content_priority_queue ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_content_generation_queue_processing ON content_generation_queue(status, priority_score DESC, retry_count);
CREATE INDEX IF NOT EXISTS idx_content_update_queue_processing ON content_update_queue(status, priority_score DESC, retry_count);
CREATE INDEX IF NOT EXISTS idx_content_priority_queue_processing ON content_priority_queue(status, priority_score DESC, retry_count);

-- Execution logs table
CREATE TABLE IF NOT EXISTS execution_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_type TEXT NOT NULL CHECK (queue_type IN ('generation', 'update', 'priority')),
  queue_item_id UUID NOT NULL,
  object_id UUID,
  object_type TEXT CHECK (object_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object')),
  action TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'success', 'failed', 'retry')),
  message TEXT,
  metadata JSONB,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_execution_logs_queue_item ON execution_logs(queue_type, queue_item_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_status ON execution_logs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_execution_logs_object ON execution_logs(object_id, object_type);

-- Enable RLS
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;

-- Execution logs: public cannot read, admin/editor can manage
CREATE POLICY "Admin and editor manage execution logs" ON execution_logs
  FOR ALL USING (is_admin_or_editor()) WITH CHECK (is_admin_or_editor());
