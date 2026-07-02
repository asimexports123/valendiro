/**
 * Emergency Stabilization Audit
 * 
 * Phase 1: Database inventory — every category, subcategory, topic, article
 * Phase 2: HTTP crawl — check every public URL for 404s and empty content
 * Phase 3: Hierarchy integrity — orphans, broken FK chains
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";
const BASE_URL = "https://valendiro.com";
const LANG = "en";

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkUrl(url: string): Promise<{ status: number; ok: boolean; bodyLen: number }> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Valendiro-Audit/1.0" } });
    const text = await res.text();
    return { status: res.status, ok: res.status < 400, bodyLen: text.length };
  } catch (e: any) {
    return { status: 0, ok: false, bodyLen: 0 };
  }
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║        EMERGENCY STABILIZATION AUDIT — Valendiro             ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // ── 1. Load full hierarchy from DB ──────────────────────────────────────────
  const [catRes, subRes, topicRes, transRes] = await Promise.all([
    sb.from("categories").select("id, slug, name").order("slug"),
    sb.from("subcategories").select("id, slug, name, category_id").order("slug"),
    sb.from("topics").select("id, slug, subcategory_id, category_id, status").order("slug"),
    sb.from("topic_translations").select("topic_id, language_code, content, title").eq("language_code", "en"),
  ]);

  const categories = catRes.data ?? [];
  const subcategories = subRes.data ?? [];
  const topics = topicRes.data ?? [];
  const translations = transRes.data ?? [];

  const transByTopic = new Map(translations.map((t) => [t.topic_id, t]));

  console.log("── DATABASE INVENTORY ─────────────────────────────────────────");
  console.log(`  Categories:    ${categories.length}`);
  console.log(`  Subcategories: ${subcategories.length}`);
  console.log(`  Topics:        ${topics.length}`);
  console.log(`  Translations:  ${translations.length}`);
  console.log();

  // ── 2. Hierarchy integrity ───────────────────────────────────────────────────
  const subById = new Map(subcategories.map((s) => [s.id, s]));
  const catById = new Map(categories.map((c) => [c.id, c]));

  const orphanTopics = topics.filter((t) => !t.subcategory_id || !subById.has(t.subcategory_id));
  const orphanSubs = subcategories.filter((s) => !s.category_id || !catById.has(s.category_id));
  const topicsNoTranslation = topics.filter((t) => !transByTopic.has(t.id));
  const topicsEmptyContent = topics.filter((t) => {
    const tr = transByTopic.get(t.id);
    return tr && (!tr.content || tr.content.trim().length < 50);
  });
  const topicsWithContent = topics.filter((t) => {
    const tr = transByTopic.get(t.id);
    return tr && tr.content && tr.content.trim().length >= 50;
  });

  console.log("── HIERARCHY INTEGRITY ────────────────────────────────────────");
  console.log(`  Orphan topics (no subcategory):     ${orphanTopics.length}`);
  console.log(`  Orphan subcategories (no category): ${orphanSubs.length}`);
  console.log(`  Topics with no translation:         ${topicsNoTranslation.length}`);
  console.log(`  Topics with empty content (<50c):   ${topicsEmptyContent.length}`);
  console.log(`  Topics with real content:           ${topicsWithContent.length}`);
  console.log();

  if (orphanTopics.length > 0) {
    console.log("  ORPHAN TOPICS:");
    orphanTopics.forEach((t) => console.log(`    ❌ ${t.slug}`));
  }
  if (orphanSubs.length > 0) {
    console.log("  ORPHAN SUBCATEGORIES:");
    orphanSubs.forEach((s) => console.log(`    ❌ ${s.slug}`));
  }
  if (topicsNoTranslation.length > 0) {
    console.log("  TOPICS WITH NO TRANSLATION:");
    topicsNoTranslation.forEach((t) => console.log(`    ❌ ${t.slug}`));
  }
  if (topicsEmptyContent.length > 0) {
    console.log("  TOPICS WITH EMPTY CONTENT:");
    topicsEmptyContent.forEach((t) => console.log(`    ⚠️  ${t.slug}`));
  }
  console.log();

  // ── 3. Build URL list ────────────────────────────────────────────────────────
  const urls: { url: string; type: string; slug: string }[] = [
    { url: `${BASE_URL}/${LANG}`, type: "homepage", slug: "home" },
  ];

  categories.forEach((c) => urls.push({ url: `${BASE_URL}/${LANG}/categories/${c.slug}`, type: "category", slug: c.slug }));
  subcategories.forEach((s) => urls.push({ url: `${BASE_URL}/${LANG}/subcategories/${s.slug}`, type: "subcategory", slug: s.slug }));
  topics.forEach((t) => urls.push({ url: `${BASE_URL}/${LANG}/topics/${t.slug}`, type: "topic", slug: t.slug }));

  console.log(`── HTTP CRAWL (${urls.length} URLs) ──────────────────────────────────`);
  console.log("  Crawling... (this may take a minute)\n");

  const results: { url: string; type: string; slug: string; status: number; ok: boolean; bodyLen: number }[] = [];
  const CONCURRENCY = 5;

  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const checked = await Promise.all(batch.map(async (u) => {
      const r = await checkUrl(u.url);
      return { ...u, ...r };
    }));
    results.push(...checked);
    process.stdout.write(`  Checked ${Math.min(i + CONCURRENCY, urls.length)}/${urls.length}\r`);
  }
  console.log();

  // ── 4. Crawl Report ──────────────────────────────────────────────────────────
  const broken = results.filter((r) => !r.ok);
  const working = results.filter((r) => r.ok);
  const smallPages = results.filter((r) => r.ok && r.bodyLen < 5000);

  console.log("\n── CRAWL RESULTS ──────────────────────────────────────────────");
  console.log(`  Total URLs checked:  ${results.length}`);
  console.log(`  ✅ Working (2xx/3xx): ${working.length}`);
  console.log(`  ❌ Broken (4xx/5xx):  ${broken.length}`);
  console.log(`  ⚠️  Suspiciously small pages (<5KB): ${smallPages.length}`);

  if (broken.length > 0) {
    console.log("\n  BROKEN URLs:");
    broken.forEach((r) => console.log(`    [${r.status}] ${r.type.padEnd(12)} ${r.url}`));
  }

  if (smallPages.length > 0) {
    console.log("\n  SUSPICIOUSLY SMALL PAGES:");
    smallPages.forEach((r) => console.log(`    ${String(r.bodyLen).padStart(6)}B  ${r.type.padEnd(12)} ${r.url}`));
  }

  // ── 5. Per-type breakdown ────────────────────────────────────────────────────
  const byType = (type: string) => results.filter((r) => r.type === type);
  console.log("\n── PER-TYPE STATUS ───────────────────────────────────────────");
  for (const type of ["homepage", "category", "subcategory", "topic"]) {
    const group = byType(type);
    const brokenGroup = group.filter((r) => !r.ok);
    console.log(`  ${type.padEnd(14)} total=${group.length}  broken=${brokenGroup.length}`);
  }

  // ── 6. Content depth for topics ─────────────────────────────────────────────
  console.log("\n── TOPIC CONTENT DEPTH ───────────────────────────────────────");
  const topicResults = results.filter((r) => r.type === "topic");
  for (const t of topicResults) {
    const tr = transByTopic.get(topics.find((tp) => tp.slug === t.slug)?.id ?? "");
    const words = tr?.content?.split(/\s+/).filter(Boolean).length ?? 0;
    const depth = words === 0 ? "❌ EMPTY " : words < 100 ? "❌ BARE  " : words < 300 ? "⚠️  THIN  " : "✅ OK    ";
    const httpFlag = t.ok ? "   " : `[${t.status}]`;
    console.log(`  ${depth} ${httpFlag} ${String(words).padStart(4)}w  ${t.slug}`);
  }

  // ── 7. Summary verdict ───────────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║                     VERDICT                                  ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`  404s:             ${broken.length === 0 ? "✅ ZERO" : "❌ " + broken.length}`);
  console.log(`  Empty topics:     ${(topicsEmptyContent.length + topicsNoTranslation.length) === 0 ? "✅ ZERO" : "❌ " + (topicsEmptyContent.length + topicsNoTranslation.length)}`);
  console.log(`  Orphan topics:    ${orphanTopics.length === 0 ? "✅ ZERO" : "❌ " + orphanTopics.length}`);
  console.log(`  Orphan subs:      ${orphanSubs.length === 0 ? "✅ ZERO" : "❌ " + orphanSubs.length}`);
  const stable = broken.length === 0 && (topicsEmptyContent.length + topicsNoTranslation.length) === 0 && orphanTopics.length === 0;
  console.log(`\n  SITE STATUS: ${stable ? "✅ STABLE" : "❌ NOT STABLE — FIXES REQUIRED"}`);
}

main().catch(console.error);
