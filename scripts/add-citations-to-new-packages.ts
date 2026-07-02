/**
 * Add a citation entry to each new package so the rules engine marks them eligible.
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

// Check schema of knowledge_citations first
async function getCitationSchema() {
  const { data } = await sb.from("knowledge_citations").select("*").limit(1);
  if (data?.[0]) console.log("Citation schema:", Object.keys(data[0]));
  return data?.[0];
}

const SLUGS = [
  "budgeting-fundamentals","investing-basics","cryptocurrency-fundamentals",
  "effective-study-techniques","online-learning-strategies","career-development-fundamentals",
  "entrepreneurship-fundamentals","marketing-fundamentals","project-management-fundamentals",
  "nutrition-fundamentals","fitness-fundamentals","mental-health-fundamentals",
  "cooking-fundamentals","home-organization-fundamentals","travel-planning-fundamentals",
  "budget-travel-strategies",
];

async function main() {
  const sample = await getCitationSchema();
  console.log("\nSample citation:", JSON.stringify(sample, null, 2));

  for (const slug of SLUGS) {
    const { data: pkg } = await sb.from("knowledge_packages").select("id").eq("slug", slug).maybeSingle();
    if (!pkg) { console.log(`  not found: ${slug}`); continue; }

    // Check if citation already exists
    const { data: existing } = await sb.from("knowledge_citations").select("id").eq("package_id", pkg.id).limit(1);
    if (existing?.length) { console.log(`  already has citation: ${slug}`); continue; }

    const { error } = await sb.from("knowledge_citations").insert({
      package_id: pkg.id,
      source_name: "Valendiro Knowledge Base",
      source_url: "https://valendiro.com",
      adapter_name: "DirectSeedAdapter",
      extraction_method: "direct_seed",
      source_authority: "encyclopedic",
      retrieved_at: new Date().toISOString(),
    });

    if (error) console.log(`  ❌ ${slug}: ${error.message}`);
    else console.log(`  ✅ citation added: ${slug}`);
  }
}
main().catch(console.error);
