import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://diwwvkbztvhwouttajha.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";
const sb = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Get all subcategories
  const { data: subcats } = await sb.from("subcategories").select("id, slug, category_id");
  console.log("\n=== DATABASE SUBCATEGORIES ===");
  for (const s of subcats ?? []) {
    console.log(`  ${s.slug}`);
  }
}

main().catch(console.error);
