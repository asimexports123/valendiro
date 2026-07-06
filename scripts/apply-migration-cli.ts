/**
 * Apply Discovery System Migration via Supabase CLI
 * Uses Supabase CLI to execute SQL migration directly
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function applyMigration() {
  console.log("Applying Discovery System migration via Supabase CLI...");

  try {
    const fs = await import("fs");
    const path = await import("path");
    const migrationPath = path.join(__dirname, "../database/migrations/discovery_system.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    // Execute SQL using psql via supabase CLI
    const { env } = await import("../lib/env");
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || "";
    if (!supabaseUrl) {
      throw new Error("Supabase URL not found");
    }
    const projectId = supabaseUrl.replace("https://", "").replace(".supabase.co", "");
    
    // Use supabase db execute command
    const command = `npx supabase db execute --file "${migrationPath}" --project-ref ${projectId}`;
    
    console.log(`Executing: ${command}`);
    
    const { stdout, stderr } = await execAsync(command);
    
    console.log("✅ Migration applied successfully!");
    if (stdout) console.log(stdout);
    if (stderr) console.log(stderr);

    // Verify tables
    await verifyTables();

  } catch (error) {
    console.error("Migration error:", error);
    
    // Fallback: try direct SQL execution via supabase CLI
    console.log("Trying fallback approach...");
    await fallbackExecution();
  }
}

async function verifyTables() {
  const { createAdminClient } = await import("../lib/env");
  const supabase = createAdminClient();
  
  const tables = [
    "discovery_system_sources",
    "discovered_articles",
    "article_deduplication",
    "discovered_article_topics",
    "knowledge_extraction_queue",
    "discovery_schedule",
    "discovery_metrics",
    "feedly_config"
  ];

  console.log("\nVerifying tables:");
  for (const table of tables) {
    const { error } = await supabase.from(table).select("*").limit(1);
    console.log(`  ${table}: ${error ? "✗" : "✓"}`);
  }
}

async function fallbackExecution() {
  console.log("Using fallback execution method...");
  
  const { env } = await import("../lib/env");
  const fs = await import("fs");
  const path = await import("path");
  const migrationPath = path.join(__dirname, "../database/migrations/discovery_system.sql");
  const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

  // Try using supabase migration apply
  try {
    const command = `npx supabase migration apply --db-url "postgresql://postgres.diwwvkbztvhwouttajha:Th3r3alSup3rbas3@aws-0-us-east-1.pooler.supabase.com:5432/postgres"`;
    const { stdout, stderr } = await execAsync(command);
    console.log("✅ Migration applied via fallback!");
    await verifyTables();
  } catch (e) {
    console.log("Fallback also failed. Tables require manual creation via SQL Editor.");
  }
}

applyMigration().catch(console.error);
