/**
 * CEO Teaching Curiosity — regenerate 5; honest human-teaching report (not scores).
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
import { writeFileSync, mkdirSync } from "fs";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
process.env.BRAIN_AUTO_PUBLISH = "true";
process.env.ALLOW_RENDER = "true";
process.env.BRAIN_DEBUG_WRITER = "true";

import { createAdminClient } from "@/lib/supabase/admin";
import { publishOriginalTopicBySlug } from "../services/discovery/catalogOriginalPublish";
import { countWords } from "@/services/knowledge/contentQualityGate";

const SLUGS = [
  "what-is-artificial-intelligence",
  "design-patterns",
  "html-fundamentals",
  "health-insurance",
  "index-funds",
] as const;

function bodyParas(content: string): string[] {
  return content
    .split(/\n{2,}/)
    .map((p) => p.replace(/^#+\s+.+$/m, "").trim())
    .filter((p) => p.length > 40 && !p.startsWith("#"));
}

function teachingAudit(content: string) {
  const paras = bodyParas(content);
  const curiosityHooks = (
    content.match(
      /\b(The useful question|Before the mechanism|Once the purpose|Curiosity shifts|natural follow-up|Where will I|What do beginners|That raises a sharper question|The next honest question)\b/gi
    ) ?? []
  ).length;
  const metaBanners = (
    content.match(
      /\b(Once the definition is clear|With the purpose in view|These ideas connect in practice|Here the focus shifts|is clearer when you separate definition)\b/gi
    ) ?? []
  ).length;
  const historyJumps = (
    content.match(/\b(paper|proposal|Turing|according to the|Retrieved)\b/gi) ?? []
  ).length;
  return {
    paragraphCount: paras.length,
    curiosityHooks,
    metaBanners,
    historyJumps,
    sample: paras.slice(0, 5).map((p) => p.slice(0, 240)),
  };
}

async function clearCache(sb: ReturnType<typeof createAdminClient>, topicId: string) {
  const { data: packages } = await sb
    .from("knowledge_packages")
    .select("id")
    .eq("topic_id", topicId)
    .in("status", ["ready", "draft"]);
  for (const pkg of packages ?? []) {
    await sb.from("rendered_outputs").delete().eq("package_id", pkg.id);
    await sb.from("knowledge_packages").update({ status: "archived" }).eq("id", pkg.id);
  }
}

async function main() {
  mkdirSync("temp/previous-teaching-gen", { recursive: true });
  const sb = createAdminClient();
  const reports: Array<Record<string, unknown>> = [];

  for (const slug of SLUGS) {
    console.log(`\n=== ${slug} ===`);
    const { data: row } = await sb
      .from("topics")
      .select("id, topic_translations(title, content)")
      .eq("slug", slug)
      .eq("topic_translations.language_code", "en")
      .maybeSingle();
    if (!row) continue;
    const trans = (row.topic_translations as Array<{ title: string; content: string }>)[0];
    const before = trans.content ?? "";
    writeFileSync(`temp/previous-teaching-gen/${slug}.md`, before);
    const beforeAudit = teachingAudit(before);

    await clearCache(sb, row.id);
    const result = await publishOriginalTopicBySlug(slug);

    const { data: afterRow } = await sb
      .from("topic_translations")
      .select("content")
      .eq("topic_id", row.id)
      .eq("language_code", "en")
      .maybeSingle();
    const after = afterRow?.content ?? "";
    const afterAudit = teachingAudit(after);

    reports.push({
      slug,
      title: trans.title,
      status: result.status,
      reason: result.reason,
      wordsBefore: countWords(before),
      wordsAfter: countWords(after),
      before: beforeAudit,
      after: afterAudit,
    });
    console.log(
      `  ${result.status} hooks ${beforeAudit.curiosityHooks}→${afterAudit.curiosityHooks} meta ${beforeAudit.metaBanners}→${afterAudit.metaBanners} history ${beforeAudit.historyJumps}→${afterAudit.historyJumps}`
    );
    console.log(`  P1: ${(afterAudit.sample[0] || "").slice(0, 140)}`);
    console.log(`  P2: ${(afterAudit.sample[1] || "").slice(0, 140)}`);
    if (result.reason) console.log(`  reason: ${result.reason}`);
  }

  const out = {
    directive: "Curiosity-driven teaching (not fact-connecting)",
    generatedAt: new Date().toISOString(),
    published: reports.filter((r) => r.status === "published").length,
    total: reports.length,
    brainChanges: [
      "brainTeaching: order paragraphs by reader next-curiosity, not fact rank",
      "Generic deriveQuestion — removed topic-specific AI hacks",
      "Teaching wrap: curiosity hook → answer → forward seed",
      "Removed meta section banners (Once the definition is clear…)",
      "Penalize history/aside facts when reader still needs what/why/how",
    ],
    honestVerdict:
      "Still not fully human. Curiosity ordering and hooks help, but prose is still claim-derived and can jump when fuel lacks a clean answer to the live question.",
    reports,
  };
  writeFileSync("temp/teaching-curiosity-ceo-report.json", JSON.stringify(out, null, 2));
  console.log("\n=== REPORT → temp/teaching-curiosity-ceo-report.json ===");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
