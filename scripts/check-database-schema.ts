/**
 * Check database schema and connection
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("Database Schema Check");
  console.log("====================\n");

  // Check tables
  const tables = [
    "topics",
    "knowledge_packages",
    "knowledge_facts",
    "topic_translations",
    "rendered_outputs",
    "categories"
  ];

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .limit(1);

    console.log(`${table}: ${error ? '❌ Error' : '✅ OK'} (${data?.length || 0} records)`);
    if (error) {
      console.log(`  Error: ${error.message}`);
    }
  }

  // Check if we can see any data at all
  console.log("\nChecking for any data...");
  const { data: anyData } = await supabase
    .from("topics")
    .select("id")
    .limit(1);

  console.log(`Topics exist: ${anyData && anyData.length > 0 ? 'Yes' : 'No'}`);
}

main().catch(console.error);
