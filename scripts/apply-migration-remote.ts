/**
 * Apply regeneration queue migration to remote database
 * This script executes SQL directly on the remote Supabase database
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function applyMigration() {
  console.log("Applying regeneration queue migration to remote database...");

  // Execute each SQL statement separately
  const statements = [
    // Create table
    `CREATE TABLE IF NOT EXISTS content_regeneration_queue (
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
    )`,
    // Create indexes
    `CREATE INDEX IF NOT EXISTS idx_regeneration_queue_status ON content_regeneration_queue(status)`,
    `CREATE INDEX IF NOT EXISTS idx_regeneration_queue_topic_id ON content_regeneration_queue(topic_id)`,
    `CREATE INDEX IF NOT EXISTS idx_regeneration_queue_queued_at ON content_regeneration_queue(queued_at DESC)`,
    // Enable RLS
    `ALTER TABLE content_regeneration_queue ENABLE ROW LEVEL SECURITY`,
    // Create policies
    `CREATE POLICY IF NOT EXISTS "Admins can view all regeneration jobs" ON content_regeneration_queue
      FOR SELECT USING (auth.role() = 'authenticated')`,
    `CREATE POLICY IF NOT EXISTS "Admins can insert regeneration jobs" ON content_regeneration_queue
      FOR INSERT WITH CHECK (auth.role() = 'authenticated')`,
    `CREATE POLICY IF NOT EXISTS "Admins can update regeneration jobs" ON content_regeneration_queue
      FOR UPDATE USING (auth.role() = 'authenticated')`,
    `CREATE POLICY IF NOT EXISTS "Admins can delete regeneration jobs" ON content_regeneration_queue
      FOR DELETE USING (auth.role() = 'authenticated')`,
    // Create trigger function
    `CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql`,
    // Create trigger
    `DROP TRIGGER IF EXISTS update_content_regeneration_queue_updated_at ON content_regeneration_queue`,
    `CREATE TRIGGER update_content_regeneration_queue_updated_at
      BEFORE UPDATE ON content_regeneration_queue
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()`,
  ];

  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i];
    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    
    // Use raw SQL execution via Supabase
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`Statement ${i + 1} failed:`, error.message);
      console.log("SQL:", sql);
      continue;
    }
    
    console.log(`✓ Statement ${i + 1} succeeded`);
  }

  console.log("\n✓ Migration completed");
  console.log("\nNote: Some statements may have failed if they already exist.");
  console.log("Please verify the table was created successfully.");
}

applyMigration()
  .then(() => {
    console.log("\nDone");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
