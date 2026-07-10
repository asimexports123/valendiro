/**
 * Validate generic composition on five domains.
 * Run: npx tsx scripts/validate-generic-composition.ts
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
import { writeFileSync, mkdirSync } from "fs";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
process.env.BRAIN_AUTO_PUBLISH = "true";
process.env.ALLOW_RENDER = "true";

import { publishOriginalTopicBySlug } from "../services/discovery/catalogOriginalPublish";
import { createAdminClient } from "@/lib/supabase/admin";
import { measureEditorialQuality } from "../services/discovery/brainEditorialRegression";
import { auditParagraphQuality } from "../services/discovery/paragraphQualityGate";
import { countWords } from "@/services/knowledge/contentQualityGate";

const SLUGS = [
  "what-is-artificial-intelligence",
  "design-patterns",
  "index-funds",
  "health-insurance",
  "html-fundamentals",
];

const BASE = "https://valendiro.com/en/topics";
const AI_SPECIFIC = /\b(ChatGPT|Netflix recommendations|spam filters|Google Search|Hollywood robot|combinatorial explosion|rational agent|ontology maps|generative AI in everyday)\b/i;

async function main() {
  mkdirSync("temp", { recursive: true });
  const sb = createAdminClient();
  const results = [];

  for (const slug of SLUGS) {
    console.log(`\n=== ${slug} ===`);
    const before = await sb
      .from("topics")
      .select("topic_translations(content, title)")
      .eq("slug", slug)
      .eq("topic_translations.language_code", "en")
      .maybeSingle();
    const wordsBefore = countWords(before.data?.topic_translations?.[0]?.content ?? "");

    const pub = await publishOriginalTopicBySlug(slug);
    const after = await sb
      .from("topics")
      .select("topic_translations(content, title)")
      .eq("slug", slug)
      .eq("topic_translations.language_code", "en")
      .maybeSingle();
    const content = after.data?.topic_translations?.[0]?.content ?? "";
    const title = after.data?.topic_translations?.[0]?.title ?? slug;
    const metrics = content ? measureEditorialQuality(content, slug) : null;
    const aiLeak = AI_SPECIFIC.test(content);
    const audit = content ? auditParagraphQuality(content.split(/\n## Next Steps/i)[0]) : null;

    results.push({
      slug,
      title,
      url: `${BASE}/${slug}`,
      status: pub.status,
      reason: pub.reason,
      wordsBefore,
      wordsAfter: pub.wordCount ?? countWords(content),
      internalScore: pub.internalScore,
      qualityGate: audit?.pass ?? false,
      aiSpecificLeak: aiLeak,
      metrics,
    });
    console.log(`  ${pub.status} — ${wordsBefore} → ${pub.wordCount ?? countWords(content)} words`);
  }

  const published = results.filter((r) => r.status === "published");
  const report = {
    engine: "generic-discourse-planner",
    published: published.length,
    total: SLUGS.length,
    urls: Object.fromEntries(results.map((r) => [r.title, r.url])),
    results,
    general: published.length >= 4 && results.every((r) => !r.aiSpecificLeak || r.slug === "what-is-artificial-intelligence"),
  };
  writeFileSync("temp/generic-composition-validation.json", JSON.stringify(report, null, 2));
  console.log("\n" + JSON.stringify(report, null, 2));
  process.exit(published.length >= 3 ? 0 : 1);
}

main();
