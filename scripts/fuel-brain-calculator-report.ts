/**
 * Fuel→Brain calculator proof: teaching coverage gate + regenerate 5.
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
import { gatherExternalWorldFuel } from "../services/discovery/brainExternalFuel";
import { countWords } from "@/services/knowledge/contentQualityGate";

const SLUGS = [
  "what-is-artificial-intelligence",
  "design-patterns",
  "html-fundamentals",
  "health-insurance",
  "index-funds",
] as const;

function firstParas(content: string, n = 3): string[] {
  return content
    .split(/\n{2,}/)
    .map((p) => p.replace(/^#+\s+.+$/m, "").trim())
    .filter((p) => p.length > 30 && !p.startsWith("#"))
    .slice(0, n)
    .map((p) => p.slice(0, 200));
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
  mkdirSync("temp", { recursive: true });
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
    const title = (row.topic_translations as Array<{ title: string }>)[0]?.title ?? slug;
    const target = {
      topicId: row.id,
      slug,
      title,
      wordCount: 0,
      factCount: 0,
      categorySlug: null,
      subcategorySlug: null,
      categoryTitle: null,
      subcategoryTitle: null,
      priorityScore: 0,
      reason: "",
    };
    const fuel = await gatherExternalWorldFuel(target);
    console.log(
      `  fuel sources=${fuel.sourceCount} def=${fuel.hasDefinitionSignal} teach=${fuel.teachingCoverage.pass} dims=${fuel.teachingCoverage.dimensions} missing=${fuel.teachingCoverage.missing.join(",") || "none"}`
    );

    await clearCache(sb, row.id);
    const result = await publishOriginalTopicBySlug(slug);

    const { data: after } = await sb
      .from("topic_translations")
      .select("content")
      .eq("topic_id", row.id)
      .eq("language_code", "en")
      .maybeSingle();
    const content = after?.content ?? "";

    const report = {
      slug,
      title,
      status: result.status,
      reason: result.reason,
      fuel: {
        sources: fuel.sourceCount,
        hasDefinition: fuel.hasDefinitionSignal,
        teachingPass: fuel.teachingCoverage.pass,
        dimensions: fuel.teachingCoverage.dimensions,
        what: fuel.teachingCoverage.hasWhat,
        why: fuel.teachingCoverage.hasWhy,
        how: fuel.teachingCoverage.hasHow,
        where: fuel.teachingCoverage.hasWhere,
        missing: fuel.teachingCoverage.missing,
      },
      wordCount: countWords(content),
      sample: firstParas(content),
    };
    reports.push(report);
    console.log(`  → ${result.status}${result.reason ? " | " + result.reason.slice(0, 100) : ""}`);
    if (result.status === "published") {
      console.log(`  P1: ${report.sample[0]}`);
      console.log(`  P2: ${report.sample[1] ?? ""}`);
    }
  }

  const out = {
    model: "Fuel = calculator input; Brain = exact output; thin fuel → skip (no chipak)",
    generatedAt: new Date().toISOString(),
    published: reports.filter((r) => r.status === "published").length,
    skipped: reports.filter((r) => r.status === "skipped").length,
    total: reports.length,
    reports,
  };
  writeFileSync("temp/fuel-brain-calculator-report.json", JSON.stringify(out, null, 2));
  console.log("\n=== REPORT → temp/fuel-brain-calculator-report.json ===");
  console.log(JSON.stringify({ published: out.published, skipped: out.skipped, total: out.total }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
