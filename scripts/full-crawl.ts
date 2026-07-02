/**
 * Full Production Crawl — Emergency Stabilization
 * Checks every known URL, validates hierarchy, reports all issues.
 */

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

const BASE = "https://valendiro.com/en";

async function checkUrl(url: string) {
  try {
    const r = await fetch(url, { redirect: "follow", headers: { "User-Agent": "Valendiro-Crawler/2.0" } });
    const body = await r.text();
    const hasContent = body.includes("</main>") || body.includes("data-content");
    const isEmpty = body.includes("coming soon") || body.includes("No topics") || body.includes("No articles");
    return { status: r.status, ok: r.status < 400, bodyLen: body.length, isEmpty };
  } catch (e: any) {
    return { status: 0, ok: false, bodyLen: 0, isEmpty: false };
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  FULL PRODUCTION CRAWL — valendiro.com");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Load DB
  const [catR, subR, topR, trR] = await Promise.all([
    sb.from("categories").select("id, slug, category_translations(name, language_code)"),
    sb.from("subcategories").select("id, slug, category_id, subcategory_translations(name, language_code)"),
    sb.from("topics").select("id, slug, subcategory_id, category_id, status"),
    sb.from("topic_translations").select("topic_id, language_code, content, title").eq("language_code", "en"),
  ]);

  const cats   = catR.data ?? [];
  const subs   = subR.data ?? [];
  const topics = topR.data ?? [];
  const trans  = trR.data ?? [];

  const transByTopic = new Map(trans.map((t: any) => [t.topic_id, t]));
  const subById      = new Map(subs.map((s: any) => [s.id, s]));
  const catById      = new Map(cats.map((c: any) => [c.id, c]));

  // ── DB INVENTORY ──────────────────────────────────────────────────────────
  console.log("── DB INVENTORY ────────────────────────────────────────────────");
  console.log(`  Categories:    ${cats.length}`);
  console.log(`  Subcategories: ${subs.length}`);
  console.log(`  Topics:        ${topics.length}`);
  console.log(`  Translations:  ${trans.length}`);

  // ── HIERARCHY CHECK ───────────────────────────────────────────────────────
  const publishedTopics = topics.filter((t: any) => t.status === "published");

  const subsWithCat  = subs.filter((s: any) => catById.has(s.category_id));
  const subsOrphan   = subs.filter((s: any) => !catById.has(s.category_id));
  const topicsLinked = publishedTopics.filter((t: any) => subById.has(t.subcategory_id));
  const topicsOrphan = publishedTopics.filter((t: any) => !t.subcategory_id || !subById.has(t.subcategory_id));
  const emptyTopics  = publishedTopics.filter((t: any) => {
    const tr = transByTopic.get(t.id);
    return !tr || !tr.content || tr.content.trim().length < 100;
  });
  const goodTopics   = publishedTopics.filter((t: any) => {
    const tr = transByTopic.get(t.id);
    return tr && tr.content && tr.content.trim().length >= 100;
  });

  console.log("\n── HIERARCHY INTEGRITY ─────────────────────────────────────────");
  console.log(`  Subcategories linked to categories: ${subsWithCat.length}/${subs.length}`);
  console.log(`  Orphan subcategories:               ${subsOrphan.length}`);
  console.log(`  Topics linked to subcategories:     ${topicsLinked.length}/${publishedTopics.length} (published only)`);
  console.log(`  Orphan topics:                      ${topicsOrphan.length}`);
  console.log(`  Topics with content (≥100 chars):   ${goodTopics.length}`);
  console.log(`  Topics empty/bare (<100 chars):     ${emptyTopics.length}`);
  const draftCount = topics.filter((t: any) => t.status === "draft").length;
  if (draftCount > 0) console.log(`  Draft (hidden) topics:              ${draftCount}`);

  if (topicsOrphan.length > 0) {
    console.log("\n  ORPHAN TOPICS (no subcategory link):");
    topicsOrphan.forEach((t: any) => console.log(`    ❌ ${t.slug}`));
  }
  if (emptyTopics.length > 0) {
    console.log("\n  EMPTY/BARE TOPICS:");
    emptyTopics.forEach((t: any) => {
      const tr = transByTopic.get(t.id);
      const w = tr?.content?.split(/\s+/).filter(Boolean).length ?? 0;
      console.log(`    ⚠️  ${t.slug}  (${w}w)`);
    });
  }

  // ── BUILD URL LIST ────────────────────────────────────────────────────────
  const staticUrls = [
    `${BASE}`,
    `${BASE}/categories`,
    `${BASE}/subcategories`,
    `${BASE}/topics`,
    `${BASE}/articles`,
    `${BASE}/search`,
    `${BASE}/about`,
    `${BASE}/contact`,
    `${BASE}/privacy`,
    `${BASE}/terms`,
  ];

  const catUrls  = cats.map((c: any)  => ({ url: `${BASE}/categories/${c.slug}`,    type: "category",    slug: c.slug }));
  const subUrls  = subs.map((s: any)  => ({ url: `${BASE}/subcategories/${s.slug}`, type: "subcategory", slug: s.slug }));
  const topUrls  = topics.filter((t: any) => t.status === "published").map((t: any)=> ({ url: `${BASE}/topics/${t.slug}`, type: "topic", slug: t.slug }));

  const allDynamic = [...catUrls, ...subUrls, ...topUrls];
  const staticChecks = staticUrls.map((url) => ({ url, type: "static", slug: url.replace(BASE, "") || "/" }));
  const allUrls = [...staticChecks, ...allDynamic];

  // ── HTTP CRAWL ────────────────────────────────────────────────────────────
  console.log(`\n── HTTP CRAWL (${allUrls.length} URLs) ──────────────────────────────────`);

  const results: any[] = [];
  const BATCH = 6;
  for (let i = 0; i < allUrls.length; i += BATCH) {
    const batch = allUrls.slice(i, i + BATCH);
    const checked = await Promise.all(batch.map(async (u) => ({ ...u, ...(await checkUrl(u.url)) })));
    results.push(...checked);
    process.stdout.write(`  ${Math.min(i + BATCH, allUrls.length)}/${allUrls.length} checked\r`);
  }
  console.log(`  ${allUrls.length}/${allUrls.length} checked ✓\n`);

  const broken    = results.filter((r) => !r.ok);
  const notFound  = results.filter((r) => r.status === 404);
  const errors    = results.filter((r) => r.status >= 500 || r.status === 0);
  const emptyPage = results.filter((r) => r.ok && r.isEmpty);
  const working   = results.filter((r) => r.ok);

  // ── CRAWL REPORT ──────────────────────────────────────────────────────────
  console.log("── CRAWL RESULTS ───────────────────────────────────────────────");
  console.log(`  Total URLs:    ${results.length}`);
  console.log(`  ✅ Working:    ${working.length}`);
  console.log(`  ❌ 404:        ${notFound.length}`);
  console.log(`  ❌ 5xx/error:  ${errors.length}`);
  console.log(`  ⚠️  Empty page: ${emptyPage.length}`);

  if (notFound.length > 0) {
    console.log("\n  404 PAGES:");
    notFound.forEach((r) => console.log(`    [404] ${r.type.padEnd(12)} ${r.url}`));
  }
  if (errors.length > 0) {
    console.log("\n  ERROR PAGES:");
    errors.forEach((r) => console.log(`    [${r.status}] ${r.type.padEnd(12)} ${r.url}`));
  }
  if (emptyPage.length > 0) {
    console.log("\n  EMPTY/COMING-SOON PAGES:");
    emptyPage.forEach((r) => console.log(`    ⚠️  ${r.type.padEnd(12)} ${r.url}`));
  }

  // ── PER-TYPE BREAKDOWN ────────────────────────────────────────────────────
  console.log("\n── PER-TYPE STATUS ─────────────────────────────────────────────");
  for (const type of ["static", "category", "subcategory", "topic"]) {
    const g = results.filter((r) => r.type === type);
    const b = g.filter((r) => !r.ok);
    const e = g.filter((r) => r.ok && r.isEmpty);
    console.log(`  ${type.padEnd(14)} total=${String(g.length).padStart(3)}  broken=${b.length}  empty=${e.length}`);
  }

  // ── TOPIC CONTENT DEPTH ───────────────────────────────────────────────────
  console.log("\n── TOPIC CONTENT DEPTH ─────────────────────────────────────────");
  for (const tr of trans) {
    const topic = topics.find((t: any) => t.id === tr.topic_id);
    if (!topic || topic.status !== "published") continue;
    const words = tr.content?.split(/\s+/).filter(Boolean).length ?? 0;
    const depth = words === 0 ? "❌ EMPTY " : words < 100 ? "❌ BARE  " : words < 300 ? "⚠️  THIN  " : "✅ OK    ";
    console.log(`  ${depth} ${String(words).padStart(4)}w  ${topic.slug}`);
  }

  // ── FINAL VERDICT ─────────────────────────────────────────────────────────
  const total404    = notFound.length;
  const totalErrors = errors.length;
  const totalEmpty  = emptyTopics.length;
  const totalOrphan = topicsOrphan.length;
  const stable = total404 === 0 && totalErrors === 0 && totalEmpty === 0 && totalOrphan === 0;

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  FINAL VERDICT");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  404s:                 ${total404    === 0 ? "✅ ZERO" : "❌ " + total404}`);
  console.log(`  5xx/network errors:   ${totalErrors === 0 ? "✅ ZERO" : "❌ " + totalErrors}`);
  console.log(`  Empty topics:         ${totalEmpty  === 0 ? "✅ ZERO" : "❌ " + totalEmpty}`);
  console.log(`  Orphan topics:        ${totalOrphan === 0 ? "✅ ZERO" : "❌ " + totalOrphan}`);
  console.log(`  Orphan subcategories: ${subsOrphan.length === 0 ? "✅ ZERO" : "❌ " + subsOrphan.length}`);
  console.log(`\n  STATUS: ${stable ? "✅ STABLE — ready to deploy" : "❌ NOT STABLE — fixes required"}`);
}

main().catch(console.error);
