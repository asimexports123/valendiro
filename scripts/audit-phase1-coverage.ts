/**
 * Phase-1 active subcategory coverage audit.
 *   npx tsx scripts/audit-phase1-coverage.ts
 */
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";
import {
  PHASE_1_ACTIVE_SUBCATEGORY_SLUGS,
  getCategorySlugForActiveSubcategory,
} from "../config/activeTaxonomy";
import { getToolsForSubcategory } from "../config/toolsRegistry";

async function main() {
  const sb = createAdminClient();
  console.log("\n=== PHASE-1 COVERAGE AUDIT ===\n");

  const { data: subs } = await sb
    .from("subcategories")
    .select("id, slug, subcategory_translations(name)")
    .in("slug", [...PHASE_1_ACTIVE_SUBCATEGORY_SLUGS])
    .eq("subcategory_translations.language_code", "en");

  const subBySlug = new Map((subs ?? []).map((s) => [s.slug, s]));

  const { data: topics } = await sb
    .from("topics")
    .select("id, slug, status, subcategory_id, topic_translations(title, content)")
    .eq("topic_translations.language_code", "en");

  const publishedBySub = new Map<string, { slug: string; words: number }[]>();
  for (const t of topics ?? []) {
    if (t.status !== "published" || !t.subcategory_id) continue;
    const content = t.topic_translations?.[0]?.content ?? "";
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const list = publishedBySub.get(t.subcategory_id) ?? [];
    list.push({ slug: t.slug, words });
    publishedBySub.set(t.subcategory_id, list);
  }

  console.log(
    `${"Subcategory".padEnd(28)} ${"Cat".padEnd(18)} ${"Topics".padStart(6)} ${"Tools".padStart(5)} Status`
  );
  console.log("─".repeat(85));

  let totalTopics = 0;
  let emptyCount = 0;

  for (const slug of PHASE_1_ACTIVE_SUBCATEGORY_SLUGS) {
    const sub = subBySlug.get(slug);
    const cat = getCategorySlugForActiveSubcategory(slug) ?? "?";
    const tools = getToolsForSubcategory(slug);
    const pub = sub ? (publishedBySub.get(sub.id) ?? []) : [];
    const count = pub.length;
    totalTopics += count;
    if (count === 0) emptyCount++;

    const status =
      count === 0
        ? "❌ EMPTY"
        : count < 5
          ? "⚠️  THIN"
          : count < 20
            ? "🟡 GROWING"
            : "✅ OK";

    console.log(
      `${slug.padEnd(28)} ${cat.padEnd(18)} ${String(count).padStart(6)} ${String(tools.length).padStart(5)} ${status}`
    );
    if (pub.length > 0 && pub.length <= 8) {
      console.log(`   topics: ${pub.map((p) => p.slug).join(", ")}`);
    }
  }

  console.log("\n" + "═".repeat(85));
  console.log(`Total published topics (9 subs): ${totalTopics}`);
  console.log(`Empty subcategories: ${emptyCount}`);
  console.log(`Target per sub (80%): ~20+ topics\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
