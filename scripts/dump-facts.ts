import { createClient } from "@supabase/supabase-js";
const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);
const SLUGS = process.argv.slice(2).length ? process.argv.slice(2) : ["python-programming-fundamentals","algorithms-fundamentals","database-design"];
async function main() {
  for (const slug of SLUGS) {
    const { data: pkg } = await sb.from("knowledge_packages").select("id,slug").eq("slug", slug).single();
    if (!pkg) { console.log(`\n❌ Package not found: ${slug}`); continue; }
    const { data: facts } = await sb.from("knowledge_facts").select("fact_type,statement,confidence").eq("package_id", pkg.id).order("created_at");
    console.log(`\n═══ ${slug} (${facts?.length} facts) ═══`);
    facts?.forEach(f => console.log(`  [${f.fact_type}/${f.confidence}] ${f.statement}`));
  }
}
main().catch(console.error);
