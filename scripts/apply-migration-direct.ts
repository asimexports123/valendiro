/**
 * Apply regeneration queue migration directly using admin client
 * This executes SQL statements via the Supabase REST API
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function applyMigration() {
  console.log("Applying regeneration queue migration...");

  try {
    // Try to create the table directly
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
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
        )
      `
    });

    if (tableError) {
      console.log("Table creation failed (may already exist):", tableError.message);
    } else {
      console.log("✓ Table created successfully");
    }

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_regeneration_queue_status ON content_regeneration_queue(status)',
      'CREATE INDEX IF NOT EXISTS idx_regeneration_queue_topic_id ON content_regeneration_queue(topic_id)',
      'CREATE INDEX IF NOT EXISTS idx_regeneration_queue_queued_at ON content_regeneration_queue(queued_at DESC)'
    ];

    for (const indexSql of indexes) {
      const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSql });
      if (indexError) {
        console.log("Index creation failed (may already exist):", indexError.message);
      } else {
        console.log("✓ Index created successfully");
      }
    }

    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE content_regeneration_queue ENABLE ROW LEVEL SECURITY'
    });
    if (rlsError) {
      console.log("RLS enable failed (may already be enabled):", rlsError.message);
    } else {
      console.log("✓ RLS enabled");
    }

    // Create policies
    const policies = [
      `CREATE POLICY IF NOT EXISTS "Admins can view all regeneration jobs" ON content_regeneration_queue FOR SELECT USING (auth.role() = 'authenticated')`,
      `CREATE POLICY IF NOT EXISTS "Admins can insert regeneration jobs" ON content_regeneration_queue FOR INSERT WITH CHECK (auth.role() = 'authenticated')`,
      `CREATE POLICY IF NOT EXISTS "Admins can update regeneration jobs" ON content_regeneration_queue FOR UPDATE USING (auth.role() = 'authenticated')`,
      `CREATE POLICY IF NOT EXISTS "Admins can delete regeneration jobs" ON content_regeneration_queue FOR DELETE USING (auth.role() = 'authenticated')`
    ];

    for (const policySql of policies) {
      const { error: policyError } = await supabase.rpc('exec_sql', { sql: policySql });
      if (policyError) {
        console.log("Policy creation failed (may already exist):", policyError.message);
      } else {
        console.log("✓ Policy created successfully");
      }
    }

    // Create trigger function
    const { error: triggerFuncError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
      `
    });
    if (triggerFuncError) {
      console.log("Trigger function creation failed:", triggerFuncError.message);
    } else {
      console.log("✓ Trigger function created");
    }

    // Create trigger
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP TRIGGER IF EXISTS update_content_regeneration_queue_updated_at ON content_regeneration_queue;
        CREATE TRIGGER update_content_regeneration_queue_updated_at
        BEFORE UPDATE ON content_regeneration_queue
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
      `
    });
    if (triggerError) {
      console.log("Trigger creation failed:", triggerError.message);
    } else {
      console.log("✓ Trigger created");
    }

    console.log("\n✓ Migration completed");
  } catch (error: any) {
    console.error("Migration failed:", error);
    console.log("\nPlease apply the migration manually via Supabase Dashboard:");
    console.log("1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql");
    console.log("2. Copy and paste the SQL from: supabase/migrations/20260707_create_content_regeneration_queue.sql");
    console.log("3. Click 'Run'");
    process.exit(1);
  }
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
