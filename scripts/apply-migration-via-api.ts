/**
 * Apply regeneration queue migration via Supabase SQL API
 * This uses the Supabase REST API to execute SQL directly
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function applyMigration() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
    process.exit(1);
  }

  console.log("Applying regeneration queue migration via Supabase SQL API...");

  const migrationSQL = `
-- Content Regeneration Queue Table
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
  previous_content TEXT,
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
CREATE POLICY IF NOT EXISTS "Admins can view all regeneration jobs" ON content_regeneration_queue
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Admins can insert regeneration jobs" ON content_regeneration_queue
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Admins can update regeneration jobs" ON content_regeneration_queue
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Admins can delete regeneration jobs" ON content_regeneration_queue
  FOR DELETE USING (auth.role() = 'authenticated');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_content_regeneration_queue_updated_at ON content_regeneration_queue;
CREATE TRIGGER update_content_regeneration_queue_updated_at
  BEFORE UPDATE ON content_regeneration_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`;

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ sql: migrationSQL }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Migration failed:", error);
    console.log("\nPlease apply the migration manually via Supabase Dashboard:");
    console.log("1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql");
    console.log("2. Copy and paste the SQL from: supabase/migrations/20260707_create_content_regeneration_queue.sql");
    console.log("3. Click 'Run'");
    process.exit(1);
  }

  console.log("✓ Migration applied successfully");
}

applyMigration()
  .then(() => {
    console.log("Migration completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    console.log("\nPlease apply the migration manually via Supabase Dashboard:");
    console.log("File: supabase/migrations/20260707_create_content_regeneration_queue.sql");
    process.exit(1);
  });
