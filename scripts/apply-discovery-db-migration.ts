/**
 * Apply Discovery System Database Migration
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function applyMigration() {
  console.log("Applying discovery system migration...");

  // Check if tables already exist
  const { data: existingTables } = await supabase
    .from("information_schema.tables")
    .select("table_name")
    .eq("table_schema", "public")
    .in("table_name", ["discovery_sources", "discovered_content", "knowledge_graph_nodes", "knowledge_graph_edges", "gap_analysis_results", "internal_links", "system_health", "discovery_queue", "pipeline_runs"]);

  if (existingTables && existingTables.length > 0) {
    console.log(`✓ Discovery system tables already exist (${existingTables.length} tables)`);
    console.log("Skipping migration.");
    return;
  }

  console.log("Tables do not exist. Please apply the migration manually via Supabase Dashboard:");
  console.log("File: supabase/migrations/20260707_create_discovery_system.sql");
}

applyMigration()
  .then(() => {
    console.log("\nDone");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration check failed:", error);
    process.exit(1);
  });
