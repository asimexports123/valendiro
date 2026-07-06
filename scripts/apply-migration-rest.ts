/**
 * Apply Discovery System Migration via Supabase REST API
 * Uses proper SQL execution through PostgREST
 */

import { env } from "../lib/env";

async function applyMigration() {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || "";
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase credentials not found");
  }
  
  console.log("Applying Discovery System migration via Supabase REST API...");

  try {
    const fs = await import("fs");
    const path = await import("path");
    const migrationPath = path.join(__dirname, "../database/migrations/discovery_system.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    // Use Supabase's SQL execution endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
        "Prefer": "return=minimal",
      },
      body: migrationSQL,
    });

    if (response.ok) {
      console.log("✅ Migration applied successfully!");
    } else {
      const errorText = await response.text();
      console.log(`Response: ${response.status} - ${errorText}`);
      
      // Try alternative: execute statements individually
      console.log("Trying individual statement execution...");
      await executeStatementsIndividually(supabaseUrl, serviceRoleKey, migrationSQL);
    }

    // Verify tables
    await verifyTables();

  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  }
}

async function executeStatementsIndividually(baseUrl: string, key: string, sql: string) {
  const statements = sql
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith("--"));

  console.log(`Executing ${statements.length} statements individually...`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    try {
      const response = await fetch(`${baseUrl}/rest/v1/sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/sql",
          "apikey": key,
          "Authorization": `Bearer ${key}`,
        },
        body: statement,
      });
      
      console.log(`Statement ${i + 1}/${statements.length}: ${response.ok ? '✓' : '⚠'}`);
    } catch (e) {
      console.log(`Statement ${i + 1}/${statements.length}: ⚠`);
    }
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

applyMigration().catch(console.error);
