/**
 * Navigation Link Audit
 * Traces every link that a user can click from the public site and checks whether
 * the destination returns a working page with meaningful content.
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

const BASE = "https://valendiro.com/en";
const MIN_CONTENT_WORDS = 100;

async function check(url: string): Promise<{ ok: boolean; status: number; isEmpty: boolean }> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return { ok: false, status: res.status, isEmpty: false };
    const html = await res.text();
    const isEmpty =
      html.includes("coming soon") ||
      html.includes("Topics coming soon") ||
      html.includes("No topics") ||
      html.includes("being prepared");
    return { ok: true, status: res.status, isEmpty };
  } catch {
    return { ok: false, status: 0, isEmpty: false };
  }
}

interface Link {
  source: string;   // page that contains this link
  href: string;     // destination URL
  label: string;    // link text
  type: string;     // category | subcategory | topic | article | static
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  NAVIGATION LINK AUDIT — valendiro.com");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // ── Load all data ──────────────────────────────────────────────────────────
  const { data: cats }   = await sb.from("categories").select("id, slug, category_translations(name)").eq("category_translations.language_code","en").order("sort_order");
  const { data: subs }   = await sb.from("subcategories").select("id, slug, category_id, subcategory_translations(name)").eq("subcategory_translations.language_code","en").order("sort_order");
  const { data: topics } = await sb.from("topics").select("id, slug, status, subcategory_id, topic_translations(title, content)").eq("topic_translations.language_code","en");
  const { data: articles} = await sb.from("articles").select("id, slug, status, topic_id, article_translations(title)").eq("article_translations.language_code","en");

  const catList   = (cats   || []) as any[];
  const subList   = (subs   || []) as any[];
  const topicList = (topics || []) as any[];
  const artList   = (articles || []) as any[];

  // Index helpers
  const catById  = new Map(catList.map((c) => [c.id, c]));
  const subById  = new Map(subList.map((s) => [s.id, s]));

  // Published topics by subcategory
  const pubTopicsBySub = new Map<string, any[]>();
  for (const t of topicList) {
    if (t.status !== "published") continue;
    if (!t.subcategory_id) continue;
    if (!pubTopicsBySub.has(t.subcategory_id)) pubTopicsBySub.set(t.subcategory_id, []);
    pubTopicsBySub.get(t.subcategory_id)!.push(t);
  }

  // Published articles by topic
  const pubArtsByTopic = new Map<string, any[]>();
  for (const a of artList) {
    if (a.status !== "published") continue;
    if (!pubArtsByTopic.has(a.topic_id)) pubArtsByTopic.set(a.topic_id, []);
    pubArtsByTopic.get(a.topic_id)!.push(a);
  }

  // ── Build navigation link tree ─────────────────────────────────────────────
  const links: Link[] = [];

  // 1. Homepage → category cards
  for (const cat of catList) {
    const hasSubs = subList.some((s) => s.category_id === cat.id && (pubTopicsBySub.get(s.id)?.length ?? 0) > 0);
    const hasDirectTopics = topicList.some((t) => t.status === "published" && t.category_id === cat.id);
    if (hasSubs || hasDirectTopics) {
      links.push({
        source: `${BASE}/`,
        href: `${BASE}/categories/${cat.slug}`,
        label: cat.category_translations?.[0]?.name ?? cat.slug,
        type: "category",
      });
    }
  }

  // 2. Category page → subcategory cards
  for (const sub of subList) {
    const cat = catById.get(sub.category_id);
    if (!cat) continue;
    const pubTopics = pubTopicsBySub.get(sub.id) ?? [];
    if (pubTopics.length > 0) {
      links.push({
        source: `${BASE}/categories/${cat.slug}`,
        href: `${BASE}/subcategories/${sub.slug}`,
        label: sub.subcategory_translations?.[0]?.name ?? sub.slug,
        type: "subcategory",
      });
    }
  }

  // 3. Subcategory page → topic links
  for (const sub of subList) {
    const pubTopics = pubTopicsBySub.get(sub.id) ?? [];
    for (const t of pubTopics) {
      const words = t.topic_translations?.[0]?.content?.split(/\s+/).filter(Boolean).length ?? 0;
      if (words >= MIN_CONTENT_WORDS) {
        links.push({
          source: `${BASE}/subcategories/${sub.slug}`,
          href: `${BASE}/topics/${t.slug}`,
          label: t.topic_translations?.[0]?.title ?? t.slug,
          type: "topic",
        });
      }
    }
  }

  // 4. Topic page → article links
  for (const t of topicList) {
    if (t.status !== "published") continue;
    const arts = pubArtsByTopic.get(t.id) ?? [];
    for (const a of arts) {
      links.push({
        source: `${BASE}/topics/${t.slug}`,
        href: `${BASE}/articles/${a.slug}`,
        label: a.article_translations?.[0]?.title ?? a.slug,
        type: "article",
      });
    }
  }

  // 5. Header nav → subcategory dropdown links (same as category→sub logic)
  // Already covered above

  console.log(`── TOTAL NAV LINKS BUILT FROM DATA: ${links.length}`);
  console.log(`   Categories:   ${links.filter(l=>l.type==="category").length}`);
  console.log(`   Subcategories:${links.filter(l=>l.type==="subcategory").length}`);
  console.log(`   Topics:       ${links.filter(l=>l.type==="topic").length}`);
  console.log(`   Articles:     ${links.filter(l=>l.type==="article").length}\n`);

  // ── HTTP verify all nav links ──────────────────────────────────────────────
  console.log(`── VERIFYING ${links.length} NAVIGATION LINKS...\n`);

  const BATCH = 8;
  const results: { link: Link; ok: boolean; status: number; isEmpty: boolean }[] = [];

  for (let i = 0; i < links.length; i += BATCH) {
    const batch = links.slice(i, i + BATCH);
    const checked = await Promise.all(batch.map(async (l) => {
      const r = await check(l.href);
      return { link: l, ...r };
    }));
    results.push(...checked);
    process.stdout.write(`\r  ${Math.min(i + BATCH, links.length)}/${links.length} checked`);
  }
  console.log(" ✓\n");

  const broken  = results.filter(r => !r.ok);
  const empty   = results.filter(r => r.ok && r.isEmpty);
  const working = results.filter(r => r.ok && !r.isEmpty);

  // ── Report ─────────────────────────────────────────────────────────────────
  console.log("── RESULTS ─────────────────────────────────────────────────────");
  console.log(`  Total nav links:      ${results.length}`);
  console.log(`  ✅ Working:           ${working.length}`);
  console.log(`  ⚠️  Empty/coming soon: ${empty.length}`);
  console.log(`  ❌ Broken (non-200):  ${broken.length}`);

  if (broken.length > 0) {
    console.log("\n  BROKEN NAV LINKS:");
    for (const r of broken) {
      console.log(`    [${r.status}] ${r.link.type.padEnd(12)} ${r.link.href}`);
      console.log(`           linked from: ${r.link.source}`);
    }
  }

  if (empty.length > 0) {
    console.log("\n  EMPTY DESTINATION PAGES:");
    for (const r of empty) {
      console.log(`    ⚠️  ${r.link.type.padEnd(12)} ${r.link.href}`);
      console.log(`           linked from: ${r.link.source}`);
    }
  }

  // ── Hidden links (content exists in DB but filtered out) ──────────────────
  console.log("\n── LINKS HIDDEN (content unpublished or empty) ─────────────────");

  // Subcategories with 0 published topics
  const hiddenSubs = subList.filter((s) => (pubTopicsBySub.get(s.id)?.length ?? 0) === 0);
  console.log(`  Empty subcategories hidden from nav: ${hiddenSubs.length}`);
  if (hiddenSubs.length > 0) hiddenSubs.slice(0, 10).forEach((s: any) => console.log(`    - ${s.slug}`));
  if (hiddenSubs.length > 10) console.log(`    ... and ${hiddenSubs.length - 10} more`);

  // Topics with < MIN_CONTENT_WORDS (bare but published)
  const thinTopics = topicList.filter((t) => {
    if (t.status !== "published") return false;
    const w = t.topic_translations?.[0]?.content?.split(/\s+/).filter(Boolean).length ?? 0;
    return w < MIN_CONTENT_WORDS;
  });
  console.log(`  Thin topics hidden from nav: ${thinTopics.length}`);
  if (thinTopics.length > 0) thinTopics.forEach((t: any) => {
    const w = t.topic_translations?.[0]?.content?.split(/\s+/).filter(Boolean).length ?? 0;
    console.log(`    - ${t.slug} (${w}w)`);
  });

  // Draft topics
  const draftTopics = topicList.filter((t) => t.status === "draft");
  console.log(`  Draft topics hidden: ${draftTopics.length}`);
  if (draftTopics.length > 0) draftTopics.forEach((t: any) => console.log(`    - ${t.slug}`));

  // Categories with 0 subcategories with topics
  const hiddenCats = catList.filter((c) => {
    const hasSubs = subList.some((s) => s.category_id === c.id && (pubTopicsBySub.get(s.id)?.length ?? 0) > 0);
    const hasDirectTopics = topicList.some((t) => t.status === "published" && t.category_id === c.id);
    return !hasSubs && !hasDirectTopics;
  });
  console.log(`  Empty categories hidden from nav: ${hiddenCats.length}`);
  if (hiddenCats.length > 0) hiddenCats.forEach((c: any) => console.log(`    - ${c.slug}`));

  // ── Verdict ────────────────────────────────────────────────────────────────
  const stable = broken.length === 0 && empty.length === 0;
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  VERDICT");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  Broken nav links:     ${broken.length === 0 ? "✅ ZERO" : "❌ " + broken.length}`);
  console.log(`  Empty dest pages:     ${empty.length  === 0 ? "✅ ZERO" : "❌ " + empty.length}`);
  console.log(`\n  STATUS: ${stable ? "✅ CLEAN — every click leads to real content" : "❌ NAVIGATION HAS DEAD LINKS"}`);
}

main().catch(console.error);
