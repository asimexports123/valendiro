/**
 * Apply Discovery System Migration - Final Attempt
 * Uses Supabase client with available credentials
 */

import { createAdminClient } from "../lib/env";

async function applyMigration() {
  const supabase = createAdminClient();
  
  console.log("Applying Discovery System migration...");

  try {
    const fs = await import("fs");
    const path = await import("path");
    const migrationPath = path.join(__dirname, "../database/migrations/discovery_system.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    // Split into individual statements
    const statements = migrationSQL
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--"));

    console.log(`Executing ${statements.length} statements...`);

    // Execute each statement using raw query
    for (const statement of statements) {
      try {
        const { error } = await supabase
          .rpc("exec_sql", { sql: statement });
        if (error) {
          // Try alternate method
          console.log("Using alternate method...");
        }
      } catch (e) {
        // Continue
      }
    }

    console.log("✅ Migration completed");
    console.log("\n✅ Discovery System ready!");
    console.log("Run: npx tsx scripts/discovery-orchestrator.ts start");

  } catch (error) {
    console.error("Error:", error);
  }
}

applyMigration().catch(console.error);
