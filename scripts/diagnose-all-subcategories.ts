/**
 * Full audit of all 82 subcategories:
 * - How many have 0 published topics (would 404)?
 * - How many have topics but via wrong linkage?
 * - Which nav links are dead ends?
 */

const SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";
const sb = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  console.log("\n=== FULL SUBCATEGORY AUDIT ===\n");

  // 1. All subcategories
  const { data: subs } = await sb
    .from("subcategories")
    .select("id, slug, category_id")
    .order("slug");

  if (!subs?.length) { console.log("No subcategories found."); return; }
  console.log(`Total subcategories: ${subs.length}\n`);

  // 2. All published topics and their subcategory_id
  const { data: allTopics } = await sb
    .from("topics")
    .select("id, slug, subcategory_id, status");

  const publishedTopics = (allTopics || []).filter((t: any) => t.status === "published");
  const topicsBySubcat: Record<string, string[]> = {};
  publishedTopics.forEach((t: any) => {
    if (t.subcategory_id) {
      if (!topicsBySubcat[t.subcategory_id]) topicsBySubcat[t.subcategory_id] = [];
      topicsBySubcat[t.subcategory_id].push(t.slug);
    }
  });

  // 3. Category names
  const { data: cats } = await sb
    .from("categories")
    .select("id, slug, category_translations(name)")
    .eq("category_translations.language_code", "en");
  const catMap: Record<string, string> = {};
  (cats || []).forEach((c: any) => { catMap[c.id] = c.slug; });

  // 4. Audit each subcategory
  const withTopics: string[] = [];
  const empty: string[] = [];

  console.log(`${"Subcategory Slug".padEnd(40)} ${"Category".padEnd(20)} Topics`);
  console.log("─".repeat(72));

  for (const sub of subs) {
    const count = topicsBySubcat[sub.id]?.length ?? 0;
    const cat = catMap[sub.category_id] ?? "?";
    const flag = count === 0 ? "❌ EMPTY → 404" : `✅ ${count}`;
    console.log(`${sub.slug.padEnd(40)} ${cat.padEnd(20)} ${flag}`);
    if (count === 0) empty.push(sub.slug);
    else withTopics.push(sub.slug);
  }

  console.log("\n" + "═".repeat(72));
  console.log(`✅ Subcategories with published topics:  ${withTopics.length}`);
  console.log(`❌ Subcategories with 0 published topics: ${empty.length}  (all would 404)`);

  // 5. Topics with no subcategory_id at all
  const noSubcat = publishedTopics.filter((t: any) => !t.subcategory_id);
  console.log(`\n⚠️  Published topics with NULL subcategory_id: ${noSubcat.length}`);
  if (noSubcat.length > 0) {
    console.log(`   Slugs: ${noSubcat.map((t: any) => t.slug).join(", ")}`);
  }

  // 6. Show category-level summary
  console.log("\n── Category breakdown ──────────────────────────────────────");
  const byCategory: Record<string, { ok: number; empty: number }> = {};
  for (const sub of subs) {
    const cat = catMap[sub.category_id] ?? "unknown";
    if (!byCategory[cat]) byCategory[cat] = { ok: 0, empty: 0 };
    const count = topicsBySubcat[sub.id]?.length ?? 0;
    if (count > 0) byCategory[cat].ok++;
    else byCategory[cat].empty++;
  }
  for (const [cat, counts] of Object.entries(byCategory).sort()) {
    console.log(`  ${cat.padEnd(25)} ✅ ${counts.ok}  ❌ ${counts.empty}`);
  }

  console.log("\n── Empty subcategories (will all 404) ──────────────────────");
  empty.forEach(s => console.log(`  /en/subcategories/${s}`));
}

main().catch(console.error);
