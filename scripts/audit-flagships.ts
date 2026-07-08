/**
 * Audit all flagship topics — word count, dummy detection, publish readiness.
 *   npx tsx scripts/audit-flagships.ts
 */

import { FLAGSHIP_TOPIC_SLUGS } from "../config/flagshipTopics";
import { createAdminClient } from "../lib/supabase/admin";
import { countWords, detectDummyContent, evaluatePublishEligibility } from "../services/knowledge/contentQualityGate";

async function main() {
  const sb = createAdminClient();
  console.log("\n=== FLAGSHIP AUDIT ===\n");

  let pass = 0;
  let fail = 0;

  for (const slug of FLAGSHIP_TOPIC_SLUGS) {
    const { data: topic } = await sb
      .from("topics")
      .select("id, slug, status, topic_translations(title, content)")
      .eq("slug", slug)
      .eq("topic_translations.language_code", "en")
      .maybeSingle();

    if (!topic) {
      console.log(`✗ ${slug} — NOT IN DB`);
      fail++;
      continue;
    }

    const content = topic.topic_translations?.[0]?.content ?? "";
    const words = countWords(content);
    const dummy = detectDummyContent(content);
    const eligibility = evaluatePublishEligibility({ content });

    const ok = topic.status === "published" && eligibility.allowed;
    const icon = ok ? "✓" : "✗";
    console.log(`${icon} ${slug} | ${topic.status} | ${words} words${dummy ? " | DUMMY" : ""}`);
    if (!ok) {
      if (topic.status !== "published") console.log(`    status: ${topic.status}`);
      for (const r of eligibility.reasons) console.log(`    - ${r}`);
    }
    if (ok) pass++;
    else fail++;
  }

  console.log(`\nResult: ${pass} pass, ${fail} fail / ${FLAGSHIP_TOPIC_SLUGS.length} flagships\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
