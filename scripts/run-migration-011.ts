/**
 * Applies migration 000011_rename_collections_to_subcategories.sql
 * to the production Supabase database.
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function runSql(sql: string, label: string) {
  const { error } = await sb.rpc("exec_sql", { sql_string: sql });
  if (error) {
    console.log(`  ✗ ${label}: ${error.message}`);
    return false;
  }
  console.log(`  ✓ ${label}`);
  return true;
}

async function main() {
  console.log("=== Migration 011: Rename collections → subcategories ===\n");

  // Run statements individually for safety
  const steps: Array<{ label: string; sql: string }> = [
    // Drop policies
    { label: "Drop RLS policies (collections)", sql: `DROP POLICY IF EXISTS "Public read collections" ON collections; DROP POLICY IF EXISTS "Admin and editor manage collections" ON collections; DROP POLICY IF EXISTS "Public read collection translations" ON collection_translations; DROP POLICY IF EXISTS "Admin and editor manage collection translations" ON collection_translations;` },

    // Drop triggers
    { label: "Drop triggers", sql: `DROP TRIGGER IF EXISTS update_collections_updated_at ON collections; DROP TRIGGER IF EXISTS update_collection_translations_updated_at ON collection_translations;` },

    // Drop indexes
    { label: "Drop indexes", sql: `DROP INDEX IF EXISTS idx_collections_category; DROP INDEX IF EXISTS idx_collections_slug; DROP INDEX IF EXISTS idx_topics_collection; DROP INDEX IF EXISTS idx_demand_topic_queue_collection; DROP INDEX IF EXISTS idx_demand_topic_clusters_collection;` },

    // Rename tables
    { label: "Rename collections → subcategories", sql: `ALTER TABLE collections RENAME TO subcategories;` },
    { label: "Rename collection_translations → subcategory_translations", sql: `ALTER TABLE collection_translations RENAME TO subcategory_translations;` },

    // Rename FK columns
    { label: "Rename subcategory_translations.collection_id → subcategory_id", sql: `ALTER TABLE subcategory_translations RENAME COLUMN collection_id TO subcategory_id;` },
    { label: "Rename topics.collection_id → subcategory_id", sql: `ALTER TABLE topics RENAME COLUMN collection_id TO subcategory_id;` },

    // demand_topic_queue (conditional)
    { label: "Rename demand_topic_queue.collection_id (if exists)", sql: `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='demand_topic_queue' AND column_name='collection_id') THEN ALTER TABLE demand_topic_queue RENAME COLUMN collection_id TO subcategory_id; END IF; END $$;` },

    // demand_topic_clusters (conditional)
    { label: "Rename demand_topic_clusters.collection_id (if exists)", sql: `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='demand_topic_clusters' AND column_name='collection_id') THEN ALTER TABLE demand_topic_clusters RENAME COLUMN collection_id TO subcategory_id; END IF; END $$;` },

    // Re-create constraints
    { label: "Update internal_links constraints", sql: `ALTER TABLE internal_links DROP CONSTRAINT IF EXISTS internal_links_source_type_check; ALTER TABLE internal_links ADD CONSTRAINT internal_links_source_type_check CHECK (source_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object', 'category', 'subcategory')); ALTER TABLE internal_links DROP CONSTRAINT IF EXISTS internal_links_target_type_check; ALTER TABLE internal_links ADD CONSTRAINT internal_links_target_type_check CHECK (target_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object', 'category', 'subcategory'));` },

    // Update existing data
    { label: "Update internal_links data: collection → subcategory", sql: `UPDATE internal_links SET source_type = 'subcategory' WHERE source_type = 'collection'; UPDATE internal_links SET target_type = 'subcategory' WHERE target_type = 'collection';` },

    // Re-create indexes
    { label: "Re-create indexes", sql: `CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_id); CREATE INDEX IF NOT EXISTS idx_subcategories_slug ON subcategories(slug); CREATE INDEX IF NOT EXISTS idx_topics_subcategory ON topics(subcategory_id);` },

    // Re-create RLS policies
    { label: "Re-create RLS policies (subcategories)", sql: `ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY; ALTER TABLE subcategory_translations ENABLE ROW LEVEL SECURITY; CREATE POLICY IF NOT EXISTS "Public read subcategories" ON subcategories FOR SELECT USING (true); CREATE POLICY IF NOT EXISTS "Public read subcategory translations" ON subcategory_translations FOR SELECT USING (true);` },
  ];

  let passed = 0;
  let failed = 0;

  for (const step of steps) {
    const ok = await runSql(step.sql, step.label);
    if (ok) passed++; else failed++;
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`  Passed: ${passed}  Failed: ${failed}`);

  // Verify
  console.log("\n  Verifying...");
  const { data: cols } = await sb.rpc("exec_sql", {
    sql_string: `SELECT column_name FROM information_schema.columns WHERE table_name='topics' AND column_name='subcategory_id'`
  });
  console.log(`  topics.subcategory_id column: ${cols ? "EXISTS ✓" : "MISSING ✗"}`);

  console.log("\n=== Done ===");
}

main().catch(console.error);
