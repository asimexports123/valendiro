import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://diwwvkbztvhwouttajha.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";
const sb = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  PHASE 13B — KNOWLEDGE GRAPH VERIFICATION");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Topics
  const { data: allTopics } = await sb.from("topics").select("id, slug, status");
  const topicCount = allTopics?.length ?? 0;
  const statusBreakdown = new Map<string, number>();
  allTopics?.forEach(t => {
    statusBreakdown.set(t.status, (statusBreakdown.get(t.status) || 0) + 1);
  });
  console.log(`Topics (all): ${topicCount}`);
  console.log(`  Status breakdown: ${JSON.stringify(Object.fromEntries(statusBreakdown))}`);

  // Packages
  const { data: packages } = await sb.from("knowledge_packages").select("id, slug, status, fact_count");
  const packageCount = packages?.length ?? 0;
  console.log(`Packages (all): ${packageCount}`);

  // Facts
  const { data: facts } = await sb.from("knowledge_facts").select("id").in("package_id", packages?.map(p => p.id) ?? []);
  const factCount = facts?.length ?? 0;
  console.log(`Facts: ${factCount}`);

  // Citations
  const { data: citations } = await sb.from("knowledge_citations").select("id").in("package_id", packages?.map(p => p.id) ?? []);
  const citationCount = citations?.length ?? 0;
  console.log(`Citations: ${citationCount}`);

  // Subcategories with topics
  const { data: subcategoriesWithTopics } = await sb.rpc("count_subcategories_with_topics");
  console.log(`Subcategories with topics: ${subcategoriesWithTopics ?? 0}`);

  // Duplicate slugs
  const { data: topicsForDupes } = await sb.from("topics").select("slug");
  const slugCounts = new Map<string, number>();
  for (const t of topicsForDupes ?? []) {
    slugCounts.set(t.slug, (slugCounts.get(t.slug) || 0) + 1);
  }
  const duplicateCount = Array.from(slugCounts.values()).filter(c => c > 1).length;
  console.log(`Duplicate slugs: ${duplicateCount}`);

  // Orphan topics (no subcategory)
  const { data: orphanTopics } = await sb.from("topics").select("id, slug").is("subcategory_id", null);
  console.log(`Orphan topics (no subcategory): ${orphanTopics?.length ?? 0}`);

  // Packages without facts
  const packagesWithoutFacts = packages?.filter(p => p.fact_count === 0).length ?? 0;
  console.log(`Packages without facts: ${packagesWithoutFacts}`);

  // Coverage by category
  console.log("\n── Coverage by Category ──");
  const { data: categories } = await sb.from("categories").select("id, slug, name");
  for (const cat of categories ?? []) {
    const { data: subcats } = await sb.from("subcategories").select("id").eq("category_id", cat.id);
    const subcatIds = subcats?.map(s => s.id) ?? [];
    const { count: topicCount } = await sb.from("topics").select("*", { count: "exact", head: true })
      .in("subcategory_id", subcatIds);
    console.log(`  ${cat.slug}: ${topicCount ?? 0} topics across ${subcats?.length ?? 0} subcategories`);
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log(`  Validation: ${packageCount > 0 && factCount > 0 && citationCount > 0 ? "PASSED" : "FAILED"}`);
  console.log("═══════════════════════════════════════════════════════════════");
}

main().catch(console.error);
