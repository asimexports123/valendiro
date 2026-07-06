/**
 * Apply Discovery System Migration via Supabase Management API
 * Executes SQL through Supabase's SQL editor API
 */

import { env } from "../lib/env";

async function applyMigration() {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase credentials not found in environment");
  }

  console.log("Applying Discovery System migration via Supabase API...");

  try {
    // Read the migration SQL
    const fs = await import("fs");
    const path = await import("path");
    const migrationPath = path.join(__dirname, "../database/migrations/discovery_system.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    // Extract project reference from URL
    const projectRef = supabaseUrl.replace("https://", "").replace(".supabase.co", "");

    // Use Supabase SQL Editor API
    const apiUrl = `https://api.supabase.com/v1/projects/${projectRef}/sql`;

    console.log(`Executing SQL via Supabase API for project: ${projectRef}`);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey,
      },
      body: JSON.stringify({
        query: migrationSQL,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ Migration applied successfully!");
    console.log("Result:", JSON.stringify(result, null, 2));

    console.log("\n✅ Discovery System is ready to use!");
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
