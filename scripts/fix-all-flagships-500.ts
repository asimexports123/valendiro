/**
 * Unarchive all flagships + rebuild every one to 500+ words.
 *   npx tsx scripts/fix-all-flagships-500.ts
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { exitLegacyPublishScript } from "./lib/legacyPublishRedirect";
exitLegacyPublishScript();

import { FLAGSHIP_TOPIC_SLUGS } from "../config/flagshipTopics";
import { createAdminClient } from "../lib/supabase/admin";
import { rebuildTopicFromAuthority } from "../services/learning/rebuildTopicFromAuthority";
import { countWords } from "../services/knowledge/contentQualityGate";

async function main() {
  const sb = createAdminClient();
  console.log("\n=== FIX ALL FLAGSHIPS (500+ words) ===\n");

  // Unarchive everything first — no hiding
  await sb
    .from("topics")
    .update({ status: "published", updated_at: new Date().toISOString() })
    .in("slug", [...FLAGSHIP_TOPIC_SLUGS]);

  const results: { slug: string; words: number; ok: boolean; err?: string }[] = [];

  for (const slug of FLAGSHIP_TOPIC_SLUGS) {
    const { data: exists } = await sb.from("topics").select("id").eq("slug", slug).maybeSingle();
    if (!exists) {
      results.push({ slug, words: 0, ok: false, err: "not in DB" });
      console.log(`  ✗ ${slug} — not in DB`);
      continue;
    }

    process.stdout.write(`  ${slug}... `);
    const r = await rebuildTopicFromAuthority(slug);

    const { data: after } = await sb
      .from("topics")
      .select("topic_translations(content)")
      .eq("slug", slug)
      .eq("topic_translations.language_code", "en")
      .maybeSingle();

    const words = countWords(after?.topic_translations?.[0]?.content ?? "");
    const ok = r.published && words >= 500;
    results.push({ slug, words, ok, err: r.error });

    if (ok) console.log(`✓ ${r.wordsBefore} → ${words}w`);
    else console.log(`✗ ${words}w — ${r.error ?? "under 500"}`);
  }

  const pass = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok).length;
  const { count } = await sb.from("topics").select("*", { count: "exact", head: true }).eq("status", "published");

  console.log(`\n=== DONE: ${pass} pass (500+w), ${fail} fail ===`);
  console.log(`Published on site: ${count}\n`);
  for (const r of results.filter((x) => !x.ok)) {
    console.log(`  FAIL ${r.slug}: ${r.words}w ${r.err ?? ""}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
