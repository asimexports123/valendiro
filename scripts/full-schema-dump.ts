import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function main() {
  // categories
  const { data: cats } = await sb.from("categories").select("*").limit(3);
  console.log("CATEGORIES sample:", JSON.stringify(cats?.[0], null, 2));

  // subcategories
  const { data: subs } = await sb.from("subcategories").select("*").limit(3);
  console.log("\nSUBCATEGORIES sample:", JSON.stringify(subs?.[0], null, 2));

  // topics
  const { data: topics } = await sb.from("topics").select("*").limit(2);
  console.log("\nTOPICS sample:", JSON.stringify(topics?.[0], null, 2));

  // category_translations
  const tables = ["category_translations", "subcategory_translations", "collection_translations"];
  for (const t of tables) {
    const { data, error } = await sb.from(t).select("*").limit(1);
    if (error) console.log(`\n${t}: ❌ ${error.message}`);
    else console.log(`\n${t} sample:`, JSON.stringify(data?.[0], null, 2));
  }
}
main().catch(console.error);
