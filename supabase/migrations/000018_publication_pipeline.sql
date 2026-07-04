-- Phase 16B: Publication Pipeline
-- Creates tables for publication pipeline and publication logs.
-- Does NOT modify any existing tables.

-- ─── Publication Logs ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS publication_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rendered_output_id  UUID NOT NULL REFERENCES rendered_outputs(id) ON DELETE CASCADE,
  topic_id            UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  language_code       TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  validation_result   JSONB NOT NULL,
  success             BOOLEAN NOT NULL,
  error_message       TEXT,
  published_at        TIMESTAMPTZ,
  cache_invalidated   BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_publication_logs_rendered_output ON publication_logs(rendered_output_id);
CREATE INDEX IF NOT EXISTS idx_publication_logs_topic ON publication_logs(topic_id);
CREATE INDEX IF NOT EXISTS idx_publication_logs_success ON publication_logs(success);
CREATE INDEX IF NOT EXISTS idx_publication_logs_created_at ON publication_logs(created_at DESC);

-- ─── Publication Queue ────────────────────────────────────────────────────────
-- Future capability: Scheduled publishing, draft publishing, etc.

CREATE TABLE IF NOT EXISTS publication_queue (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rendered_output_id  UUID NOT NULL REFERENCES rendered_outputs(id) ON DELETE CASCADE,
  topic_id            UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  language_code       TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  priority            INTEGER NOT NULL DEFAULT 50,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'failed', 'cancelled')),
  scheduled_at        TIMESTAMPTZ,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  error_message       TEXT,
  created_by          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_publication_queue_status ON publication_queue(status, priority, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_publication_queue_topic ON publication_queue(topic_id);

-- ─── RLS Policies ────────────────────────────────────────────────────────────

ALTER TABLE publication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE publication_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on publication_logs"
  ON publication_logs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on publication_queue"
  ON publication_queue FOR ALL
  USING (auth.role() = 'service_role');

-- ─── Triggers ───────────────────────────────────────────────────────────────

-- Update updated_at timestamp on publication_queue
CREATE OR REPLACE FUNCTION update_publication_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_publication_queue_updated_at
  BEFORE UPDATE ON publication_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_publication_queue_updated_at();

-- ─── Comments ───────────────────────────────────────────────────────────────

COMMENT ON TABLE publication_logs IS 'Logs of all publication attempts for audit trail';
COMMENT ON TABLE publication_queue IS 'Queue for scheduled and batch publishing operations';
