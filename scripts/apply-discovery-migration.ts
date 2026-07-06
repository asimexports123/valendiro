/**
 * Apply Discovery System Database Migration
 * Directly applies the discovery system schema to the database
 */

import { createAdminClient } from "../lib/supabase/admin";
import fs from "fs";
import path from "path";

async function applyMigration() {
  const supabase = createAdminClient();

  // Read the migration file
  const migrationPath = path.join(__dirname, "../database/migrations/discovery_system.sql");
  const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

  // Split by statements (simple approach)
  const statements = migrationSQL
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith("--"));

  console.log(`Applying ${statements.length} SQL statements...`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    try {
      const { error } = await supabase.rpc("exec_sql", { sql: statement });
      if (error) {
        console.error(`Statement ${i + 1} failed:`, error);
      } else {
        console.log(`Statement ${i + 1} succeeded`);
      }
    } catch (error) {
      console.error(`Statement ${i + 1} failed:`, error);
    }
  }

  console.log("Migration completed");
}

applyMigration().catch(console.error);
