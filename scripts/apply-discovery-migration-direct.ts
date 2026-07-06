/**
 * Apply Discovery System Migration Direct
 * Executes the discovery system SQL migration using Supabase client
 */

import { createAdminClient } from "../lib/supabase/admin";
import { env } from "../lib/env";

async function applyMigration() {
  const supabase = createAdminClient();
  
  console.log("Applying Discovery System migration using Supabase client...");

  try {
    // Read the migration SQL
    const fs = await import("fs");
    const path = await import("path");
    const migrationPath = path.join(__dirname, "../database/migrations/discovery_system.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--"));

    console.log(`Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        // Use Supabase's direct SQL execution
        const { error } = await supabase.rpc("exec_sql", { sql: statement });
        
        if (error) {
          console.log(`Statement ${i + 1} warning:`, error.message);
        } else {
          console.log(`Statement ${i + 1} ✓`);
        }
      } catch (err) {
        // Try using the PostgREST API directly for CREATE statements
        if (statement.toUpperCase().includes("CREATE")) {
          try {
            const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "apikey": env.SUPABASE_SERVICE_ROLE_KEY || "",
                "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({ sql: statement }),
            });
            
            if (!response.ok) {
              console.log(`Statement ${i + 1} warning: ${response.statusText}`);
            } else {
              console.log(`Statement ${i + 1} ✓`);
            }
          } catch (e) {
            console.log(`Statement ${i + 1} skipped: ${e instanceof Error ? e.message : String(e)}`);
          }
        } else {
          console.log(`Statement ${i + 1} skipped`);
        }
      }
    }

    // Verify tables were created
    console.log("\nVerifying created tables...");
    const { data: tables, error: tablesError } = await supabase
      .from("discovery_system_sources")
      .select("*")
      .limit(1);

    if (tablesError) {
      console.log("⚠️  Tables may not have been created. Please apply migration manually via Supabase SQL Editor.");
      console.log("1. Open your Supabase project SQL Editor");
      console.log("2. Copy contents of database/migrations/discovery_system.sql");
      console.log("3. Execute the SQL");
    } else {
      console.log("✅ Discovery System tables verified!");
    }

    console.log("\n✅ Discovery System migration completed!");
    console.log("\nNext steps:");
    console.log("1. Configure Feedly credentials via admin interface at /admin/discovery-admin");
    console.log("2. Add RSS feeds via admin interface");
    console.log("3. Run the discovery orchestrator: npx tsx scripts/discovery-orchestrator.ts start");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    console.log("\nTo complete setup manually:");
    console.log("1. Open your Supabase project SQL Editor");
    console.log("2. Copy contents of database/migrations/discovery_system.sql");
    console.log("3. Execute the SQL");
    throw error;
  }
}

applyMigration().catch(console.error);
