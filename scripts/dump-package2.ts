import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

const SLUGS = ["agile-development", "pandas-data-analysis", "software-design-patterns"];

async function main() {
  for (const slug of SLUGS) {
    const { data: pkg } = await sb.from("knowledge_packages").select("id,slug").eq("slug", slug).single();
    if (!pkg) { console.log(`Not found: ${slug}`); continue; }
    const { data: facts } = await sb.from("knowledge_facts").select("fact_type,statement,confidence").eq("package_id", pkg.id).order("created_at");
    const { data: cits } = await sb.from("knowledge_citations").select("source_name,source_url,source_authority").eq("package_id", pkg.id);
    const out = { slug, facts, citations: cits };
    fs.writeFileSync(`scripts/pkg-${slug}.json`, JSON.stringify(out, null, 2));
    console.log(`${slug}: ${facts?.length} facts, ${cits?.length} citations`);
  }
}
main().catch(console.error);
