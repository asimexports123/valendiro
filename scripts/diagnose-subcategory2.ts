/**
 * Extended diagnosis — avoid the status column error, check full schema and data.
 */

const SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";
const sb = createClient(SUPABASE_URL, SERVICE_KEY);

const TARGET = process.argv[2] || "retirement-planning";

async function main() {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  DEEP DIAGNOSIS: /en/subcategories/${TARGET}`);
  console.log(`${"═".repeat(60)}\n`);

  // ── 1. Raw subcategory row — NO status column ───────────────────────────
  console.log("── 1. Subcategory row (raw) ────────────────────────────────");
  const { data: sub, error: subErr } = await sb
    .from("subcategories")
    .select("id, slug, category_id, sort_order")
    .eq("slug", TARGET)
    .maybeSingle();

  if (subErr) console.log("  ERROR:", subErr.message);
  if (!sub) {
    console.log(`  ❌ Subcategory "${TARGET}" does not exist in DB (after removing status from select)`);
    // List all subcategory slugs
    const { data: all } = await sb.from("subcategories").select("slug").order("slug");
    console.log(`  All slugs: ${all?.map((r: any) => r.slug).join(", ")}`);
    return;
  }
  console.log(`  ✅ id=${sub.id}  slug=${sub.slug}  category_id=${sub.category_id}`);

  // ── 2. Subcategory translations ─────────────────────────────────────────
  console.log("\n── 2. Subcategory translations ────────────────────────────");
  const { data: trans } = await sb
    .from("subcategory_translations")
    .select("language_code, name, description")
    .eq("subcategory_id", sub.id);
  console.log(`  Translations: ${JSON.stringify(trans)}`);

  // ── 3. What getSubcategoryBySlug actually runs (exact replica) ──────────
  console.log("\n── 3. getSubcategoryBySlug exact query ────────────────────");
  const { data: exactQuery, error: exactErr } = await sb
    .from("subcategories")
    .select("id, slug, category_id, subcategory_translations(name, description), categories(slug)")
    .eq("slug", TARGET)
    .eq("subcategory_translations.language_code", "en")
    .maybeSingle();

  if (exactErr) console.log("  ❌ QUERY ERROR:", exactErr.message);
  else if (!exactQuery) console.log("  ❌ Returns null — slug not found");
  else console.log("  ✅ Returns:", JSON.stringify(exactQuery, null, 2));

  // ── 4. Topics via topics.subcategory_id (direct FK) ─────────────────────
  console.log("\n── 4. Topics via topics.subcategory_id (direct FK) ────────");
  const { data: directTopics, error: dtErr } = await sb
    .from("topics")
    .select("id, slug, status, subcategory_id")
    .eq("subcategory_id", sub.id);

  if (dtErr) console.log("  ERROR:", dtErr.message);
  else {
    console.log(`  Total: ${directTopics?.length ?? 0}`);
    const pub = (directTopics || []).filter((t: any) => t.status === "published");
    const notPub = (directTopics || []).filter((t: any) => t.status !== "published");
    console.log(`  Published: ${pub.length}  |  Other status: ${notPub.length}`);
    if (notPub.length > 0) console.log(`  Other status breakdown: ${notPub.map((t: any) => `${t.slug}(${t.status})`).join(", ")}`);
    if (pub.length === 0) {
      console.log(`  ❌ 0 published topics via direct FK → this is the notFound() trigger`);
    }
  }

  // ── 5. Topics via topic_subcategories junction ───────────────────────────
  console.log("\n── 5. Topics via topic_subcategories junction ──────────────");
  const { data: jRows, error: jErr } = await sb
    .from("topic_subcategories")
    .select("topic_id")
    .eq("subcategory_id", sub.id);

  if (jErr) {
    console.log("  ERROR (table may not exist):", jErr.message);
  } else {
    console.log(`  Junction rows: ${jRows?.length ?? 0}`);
    if (jRows && jRows.length > 0) {
      const tids = jRows.map((r: any) => r.topic_id);
      const { data: jTopics } = await sb
        .from("topics")
        .select("id, slug, status")
        .in("id", tids);
      const pubJ = (jTopics || []).filter((t: any) => t.status === "published");
      console.log(`  Published topics via junction: ${pubJ.length}`);
      console.log(`  Slugs: ${pubJ.map((t: any) => t.slug).join(", ")}`);
    }
  }

  // ── 6. Which navigation links point here ────────────────────────────────
  console.log("\n── 6. Where is this subcategory linked from? ───────────────");
  // Check if nav shows it — getSubcategoriesByCategory would show it if topic_count > 0
  const { count: navCount } = await sb
    .from("topics")
    .select("id", { count: "exact", head: true })
    .eq("subcategory_id", sub.id)
    .eq("status", "published");
  console.log(`  Nav would show this subcategory: ${(navCount ?? 0) > 0 ? "YES" : "NO (hidden from nav)"}`);
  console.log(`  (nav filter: topics.subcategory_id + status=published count > 0)`);

  // ── 7. Schema check — does topics have subcategory_id column? ───────────
  console.log("\n── 7. Topics table schema ──────────────────────────────────");
  const { data: sampleTopic } = await sb
    .from("topics")
    .select("*")
    .limit(1)
    .maybeSingle();
  const topicColumns = sampleTopic ? Object.keys(sampleTopic) : [];
  console.log(`  topics columns: ${topicColumns.join(", ")}`);
  console.log(`  Has subcategory_id: ${topicColumns.includes("subcategory_id") ? "YES" : "NO"}`);

  // ── 8. How many total topics exist and what are their statuses? ──────────
  console.log("\n── 8. Topics global state ──────────────────────────────────");
  const { data: allStatuses } = await sb
    .from("topics")
    .select("status");
  const statusCounts: Record<string, number> = {};
  (allStatuses || []).forEach((t: any) => { statusCounts[t.status ?? "null"] = (statusCounts[t.status ?? "null"] || 0) + 1; });
  console.log(`  Status breakdown: ${JSON.stringify(statusCounts)}`);

  // ── 9. Any topics that are linked to this sub via category_id approach ───
  console.log("\n── 9. Broader search — topics near this subcategory ────────");
  const { data: catTopics } = await sb
    .from("topics")
    .select("id, slug, status, subcategory_id, category_id")
    .eq("category_id", sub.category_id)
    .limit(5);
  console.log(`  Sample topics in same category: ${JSON.stringify(catTopics?.map((t: any) => ({ slug: t.slug, status: t.status, subcat: t.subcategory_id })))}`);

  // ── 10. Verdict ──────────────────────────────────────────────────────────
  console.log(`\n${"═".repeat(60)}`);
  console.log("  VERDICT");
  console.log(`${"═".repeat(60)}`);
  const directPub = (directTopics || []).filter((t: any) => t.status === "published").length;
  const junctionCount = jRows?.length ?? 0;

  if (directPub > 0) {
    console.log(`  ✅ ${directPub} published topics via direct FK — page should NOT 404`);
    console.log("  → Likely cause: ISR stale cache or Vercel edge caching a previous 404");
  } else if (junctionCount > 0) {
    console.log(`  ⚠️  Topics exist in junction table only — direct FK is empty`);
    console.log("  → getTopicsBySubcategory uses topics.subcategory_id, not junction table");
    console.log("  → FIX: rewrite getTopicsBySubcategory to use junction table");
    console.log("       OR backfill topics.subcategory_id from junction table");
  } else {
    console.log("  ❌ NO topics linked by any method — subcategory is empty");
    console.log("  → FIX: seed topics for this subcategory");
  }
  console.log();
}

main().catch(console.error);
