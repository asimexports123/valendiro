import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function main() {
  console.log("=== Running Migration 000015: Discovery Engine ===\n");

  const sqlPath = path.join(__dirname, "..", "database", "migrations", "000015_discovery_engine.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  // Split by semicolon and run each statement
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  let success = 0;
  let failed = 0;

  for (const stmt of statements) {
    const label = stmt.slice(0, 60).replace(/\n/g, " ");
    const { error } = await sb.rpc("exec_sql", { sql_string: stmt });
    if (error) {
      // Skip "already exists" errors
      if (error.message.includes("already exists")) {
        console.log(`  ⊘ ${label}... (already exists)`);
        success++;
      } else {
        console.log(`  ✗ ${label}... ERROR: ${error.message}`);
        failed++;
      }
    } else {
      console.log(`  ✓ ${label}...`);
      success++;
    }
  }

  console.log(`\n${success} succeeded, ${failed} failed`);

  // Reload schema cache
  await sb.rpc("exec_sql", { sql_string: "NOTIFY pgrst, 'reload schema'" });
  console.log("Schema cache reloaded");

  // Wait for refresh
  await new Promise((r) => setTimeout(r, 3000));

  // Verify
  const { error: e1 } = await sb.from("discovery_sources").select("id").limit(1);
  const { error: e2 } = await sb.from("discovery_runs").select("id").limit(1);
  const { error: e3 } = await sb.from("discovery_candidates").select("id").limit(1);
  console.log("\nVerification:");
  console.log("  discovery_sources:", e1 ? "FAIL: " + e1.message : "✓");
  console.log("  discovery_runs:", e2 ? "FAIL: " + e2.message : "✓");
  console.log("  discovery_candidates:", e3 ? "FAIL: " + e3.message : "✓");
}

main().catch((e) => console.error("FATAL:", e.message));
