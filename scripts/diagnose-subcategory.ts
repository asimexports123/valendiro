/**
 * Root cause investigation: why does /en/subcategories/retirement-planning return 404?
 * Traces every condition that can trigger notFound() in the subcategory page.
 */

const SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";
const sb = createClient(SUPABASE_URL, SERVICE_KEY);

const TARGET = process.argv[2] || "retirement-planning";

async function main() {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  SUBCATEGORY DIAGNOSIS: /en/subcategories/${TARGET}`);
  console.log(`${"═".repeat(60)}\n`);

  // ── 1. Does the subcategory row exist? ──────────────────────────────────
  console.log("── 1. Subcategory row ─────────────────────────────────────");
  const { data: sub, error: subErr } = await sb
    .from("subcategories")
    .select("id, slug, category_id, status, sort_order, subcategory_translations(name, language_code)")
    .eq("slug", TARGET)
    .maybeSingle();

  if (subErr) { console.log("  ERROR:", subErr.message); }
  if (!sub) {
    console.log(`  ❌ NOT FOUND — subcategory with slug="${TARGET}" does not exist in DB`);
    console.log("\n  → notFound() triggered at: getSubcategoryBySlug returns null (line 80)\n");
    await suggestSimilar();
    return;
  }

  console.log(`  ✅ EXISTS  id=${sub.id}`);
  console.log(`     slug=${sub.slug}`);
  console.log(`     category_id=${sub.category_id}`);
  console.log(`     status=${sub.status ?? "(no status column)"}`);
  console.log(`     translations: ${JSON.stringify(sub.subcategory_translations)}`);

  const subcatId = sub.id;

  // ── 2. topics.subcategory_id — direct FK (what the page queries) ────────
  console.log("\n── 2. Topics via topics.subcategory_id (what page uses) ──");
  const { data: directTopics, count: directCount } = await sb
    .from("topics")
    .select("id, slug, status", { count: "exact" })
    .eq("subcategory_id", subcatId);

  console.log(`  Total topics with subcategory_id=${subcatId}: ${directCount ?? 0}`);

  if (directTopics && directTopics.length > 0) {
    const published = directTopics.filter((t: any) => t.status === "published");
    const draft     = directTopics.filter((t: any) => t.status !== "published");
    console.log(`  Published: ${published.length}  |  Non-published: ${draft.length}`);
    if (draft.length > 0) console.log(`  Non-published slugs: ${draft.map((t: any) => t.slug).join(", ")}`);
    if (published.length === 0) {
      console.log(`  ❌ 0 published topics via direct FK → notFound() at line 90`);
    } else {
      console.log(`  ✅ ${published.length} published topics via direct FK`);
    }
  } else {
    console.log(`  ❌ 0 topics via direct FK → notFound() at line 90`);
  }

  // ── 3. topic_subcategories junction table ───────────────────────────────
  console.log("\n── 3. Topics via topic_subcategories junction ─────────────");
  const { data: junctionRows, count: junctionCount } = await sb
    .from("topic_subcategories")
    .select("topic_id", { count: "exact" })
    .eq("subcategory_id", subcatId);

  console.log(`  Rows in topic_subcategories for this subcategory: ${junctionCount ?? 0}`);

  if (junctionRows && junctionRows.length > 0) {
    const topicIds = junctionRows.map((r: any) => r.topic_id);
    const { data: jTopics } = await sb
      .from("topics")
      .select("id, slug, status")
      .in("id", topicIds);

    const pubJ = (jTopics || []).filter((t: any) => t.status === "published");
    const dftJ = (jTopics || []).filter((t: any) => t.status !== "published");
    console.log(`  Published: ${pubJ.length}  |  Non-published: ${dftJ.length}`);
    console.log(`  Published slugs: ${pubJ.map((t: any) => t.slug).join(", ") || "(none)"}`);
  }

  // ── 4. Knowledge packages ────────────────────────────────────────────────
  console.log("\n── 4. Knowledge Packages ──────────────────────────────────");
  const { data: pkgs, count: pkgCount } = await sb
    .from("knowledge_packages")
    .select("id, slug, status", { count: "exact" });

  // packages linked to topics in this subcategory via direct FK
  const directPubTopicSlugs = (directTopics || [])
    .filter((t: any) => t.status === "published")
    .map((t: any) => t.slug);

  if (directPubTopicSlugs.length > 0) {
    const { data: pkgsForTopics, count: pkgForTopicCount } = await sb
      .from("knowledge_packages")
      .select("id, slug, status", { count: "exact" })
      .in("slug", directPubTopicSlugs);
    console.log(`  Packages for published topics in this subcategory: ${pkgForTopicCount ?? 0}`);
  } else {
    console.log(`  Packages for published topics in this subcategory: 0 (no published topics via direct FK)`);
  }

  // ── 5. Navigation query — what nav-audit sees ────────────────────────────
  console.log("\n── 5. Navigation visibility ───────────────────────────────");
  const { data: navCheck } = await sb
    .from("subcategories")
    .select("id, slug")
    .eq("id", subcatId);

  // Simulate nav-audit topic count
  const { count: navTopicCount } = await sb
    .from("topics")
    .select("id", { count: "exact", head: true })
    .eq("subcategory_id", subcatId)
    .eq("status", "published");

  console.log(`  Published topics via direct FK (nav-audit logic): ${navTopicCount ?? 0}`);
  if ((navTopicCount ?? 0) === 0) {
    console.log(`  → This subcategory IS hidden from nav (correct)`);
  } else {
    console.log(`  → This subcategory IS shown in nav`);
  }

  // ── 6. Category ──────────────────────────────────────────────────────────
  console.log("\n── 6. Parent category ─────────────────────────────────────");
  if (sub.category_id) {
    const { data: cat } = await sb
      .from("categories")
      .select("id, slug, category_translations(name)")
      .eq("id", sub.category_id)
      .maybeSingle();
    console.log(`  Category: ${cat?.slug ?? "NOT FOUND"}  id=${sub.category_id}`);
  } else {
    console.log(`  ❌ No category_id on subcategory row`);
  }

  // ── 7. Root cause verdict ────────────────────────────────────────────────
  console.log(`\n${"═".repeat(60)}`);
  console.log("  ROOT CAUSE VERDICT");
  console.log(`${"═".repeat(60)}`);

  const topicsViaDirectFK = (directTopics || []).filter((t: any) => t.status === "published").length;
  const topicsViaJunction = junctionRows?.length ?? 0;

  if (!sub) {
    console.log("  Subcategory row does not exist → 404 at getSubcategoryBySlug");
  } else if (topicsViaDirectFK === 0 && topicsViaJunction === 0) {
    console.log("  Subcategory exists but has NO topics linked by any method");
    console.log("  → 404 at: if (topics.length === 0) notFound() [line 90]");
    console.log("  → FIX NEEDED: Seed topics for this subcategory");
  } else if (topicsViaDirectFK === 0 && topicsViaJunction > 0) {
    console.log(`  ⚠️  Topics exist in junction table (${topicsViaJunction}) but NOT in topics.subcategory_id`);
    console.log("  → 404 at: if (topics.length === 0) notFound() [line 90]");
    console.log("  → getTopicsBySubcategory queries topics.subcategory_id (direct FK)");
    console.log("  → But topics are linked via topic_subcategories junction table");
    console.log("  → These two sources are OUT OF SYNC");
    console.log("  → FIX NEEDED: Either populate topics.subcategory_id OR rewrite query to use junction table");
  } else if (topicsViaDirectFK > 0) {
    console.log(`  ✅ ${topicsViaDirectFK} published topics via direct FK — should NOT be 404`);
    console.log("  → Check ISR cache — may be serving stale 404");
  }
  console.log();
}

async function suggestSimilar() {
  console.log("\n── Looking for similar slugs ──────────────────────────────");
  const { data } = await sb
    .from("subcategories")
    .select("slug")
    .ilike("slug", `%${TARGET.split("-")[0]}%`)
    .limit(10);
  if (data?.length) {
    console.log(`  Similar slugs: ${data.map((r: any) => r.slug).join(", ")}`);
  } else {
    console.log("  No similar slugs found");
  }

  // Also show all subcategory slugs to see the full picture
  const { data: all, count } = await sb
    .from("subcategories")
    .select("slug", { count: "exact" })
    .order("slug");
  console.log(`\n  Total subcategories in DB: ${count}`);
}

main().catch(console.error);
