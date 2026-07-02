import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

const SLUGS = ["agile-development", "pandas-data-analysis", "software-design-patterns"];

async function main() {
  for (const slug of SLUGS) {
    const { data } = await sb
      .from("knowledge_packages")
      .select("slug, assembled_knowledge")
      .eq("slug", slug)
      .single();
    fs.writeFileSync(`scripts/pkg-${slug}.json`, JSON.stringify(data?.assembled_knowledge, null, 2));
    console.log(`Written: scripts/pkg-${slug}.json`);
  }
}
main().catch(console.error);
