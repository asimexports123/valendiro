import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

const TABLES = [
  "categories", "subcategories", "collections",
  "topics", "topic_translations",
  "knowledge_packages", "knowledge_facts",
  "hub_slots", "hubs",
];

async function main() {
  for (const t of TABLES) {
    const { data, error, count } = await sb.from(t).select("*", { count: "exact", head: true });
    if (error) {
      console.log(`  ❌ ${t.padEnd(25)} — ${error.message}`);
    } else {
      const { data: sample } = await sb.from(t).select("*").limit(1).single();
      const cols = sample ? Object.keys(sample).join(", ") : "(empty)";
      console.log(`  ✅ ${t.padEnd(25)} count=${count}  cols: ${cols.slice(0, 80)}`);
    }
  }
}
main().catch(console.error);
