/**
 * Publish 10 flagship topics via Brain Composition Engine v1.0.
 * Run: npx tsx scripts/publish-flagship-ten.ts
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
process.env.BRAIN_AUTO_PUBLISH = "true";
process.env.ALLOW_RENDER = "true";

import { createAdminClient } from "@/lib/supabase/admin";
import { publishOriginalTopicBySlug } from "../services/discovery/catalogOriginalPublish";
import { gatherExternalWorldFuel } from "../services/discovery/brainExternalFuel";
import { measureEditorialQuality } from "../services/discovery/brainEditorialRegression";
import {
  COMPOSITION_ENGINE_VERSION,
  FLAGSHIP_TEN_SLUGS,
  EDITORIAL_BENCHMARK_SLUG,
} from "../services/discovery/brainComposeVersion";
import { countWords, detectDummyContent } from "@/services/knowledge/contentQualityGate";
import { auditParagraphQuality } from "../services/discovery/paragraphQualityGate";
import type { CatalogTopicTarget } from "../services/discovery/catalogHierarchy";

const BASE_URL = "https://valendiro.com/en/topics";

interface TopicReport {
  slug: string;
  title: string;
  url: string;
  status: string;
  reason?: string;
  wordsBefore: number;
  wordsAfter: number;
  internalScore?: number;
  qualityScore?: number;
  sourcesUsed: number;
  sourceUrls: string[];
  factsAfter: number;
  qualityGatePass: boolean;
  editorialNotes: string[];
}

async function loadTarget(sb: ReturnType<typeof createAdminClient>, slug: string): Promise<CatalogTopicTarget | null> {
  const { data: row } = await sb
    .from("topics")
    .select("id, slug, category_id, subcategory_id, topic_translations(title, content)")
    .eq("slug", slug)
    .eq("topic_translations.language_code", "en")
    .maybeSingle();
  if (!row) return null;
  const trans = row.topic_translations?.[0];
  const content = trans?.content ?? "";
  const { data: pkg } = await sb
    .from("knowledge_packages")
    .select("fact_count")
    .eq("topic_id", row.id)
    .eq("status", "ready")
    .order("fact_count", { ascending: false })
    .limit(1)
    .maybeSingle();
  return {
    topicId: row.id,
    slug: row.slug,
    title: trans?.title ?? slug,
    wordCount: countWords(content),
    factCount: pkg?.fact_count ?? 0,
    categorySlug: null,
    categoryTitle: null,
    subcategorySlug: null,
    subcategoryTitle: null,
    priorityScore: 100,
    reason: "flagship-ten",
  };
}

async function snapshotAfter(sb: ReturnType<typeof createAdminClient>, topicId: string) {
  const { data: trans } = await sb
    .from("topic_translations")
    .select("content")
    .eq("topic_id", topicId)
    .eq("language_code", "en")
    .maybeSingle();
  const { data: pkg } = await sb
    .from("knowledge_packages")
    .select("fact_count")
    .eq("topic_id", topicId)
    .eq("status", "ready")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  return {
    content: trans?.content ?? "",
    facts: pkg?.fact_count ?? 0,
  };
}

function editorialNotes(before: string, after: string): string[] {
  const notes: string[] = [];
  const beforeDummy = detectDummyContent(before);
  const afterDummy = detectDummyContent(after);
  if (beforeDummy && !afterDummy) notes.push("Replaced placeholder/dummy content with Brain prose");
  const beforeAudit = auditParagraphQuality(before);
  const afterAudit = auditParagraphQuality(after);
  if (!beforeAudit.pass && afterAudit.pass) notes.push("Paragraph quality gate now passes");
  if (countWords(before) < 400 && countWords(after) >= 600) notes.push("Expanded thin article to full guide length");
  if (notes.length === 0) notes.push("Refreshed with Composition Engine v1.0 narration and structure");
  return notes;
}

async function main() {
  mkdirSync("temp", { recursive: true });
  const sb = createAdminClient();
  const reports: TopicReport[] = [];

  for (const slug of FLAGSHIP_TEN_SLUGS) {
    console.log(`\n=== ${slug} ===`);
    const target = await loadTarget(sb, slug);
    if (!target) {
      reports.push({
        slug,
        title: slug,
        url: `${BASE_URL}/${slug}`,
        status: "failed",
        reason: "topic not found in catalog",
        wordsBefore: 0,
        wordsAfter: 0,
        sourcesUsed: 0,
        sourceUrls: [],
        factsAfter: 0,
        qualityGatePass: false,
        editorialNotes: [],
      });
      continue;
    }

    const wordsBefore = target.wordCount;
    const beforeContent = (
      await sb
        .from("topic_translations")
        .select("content")
        .eq("topic_id", target.topicId)
        .eq("language_code", "en")
        .maybeSingle()
    ).data?.content ?? "";

    const fuel = await gatherExternalWorldFuel(target);
    const sourceUrls = fuel.blocks?.map((b) => b.url).filter(Boolean) ?? [];

    const result = await publishOriginalTopicBySlug(slug);
    const after = await snapshotAfter(sb, target.topicId);
    const wordsAfter = countWords(after.content);
    const metrics = after.content ? measureEditorialQuality(after.content, slug, fuel.texts) : null;

    reports.push({
      slug,
      title: target.title,
      url: `${BASE_URL}/${slug}`,
      status: result.status,
      reason: result.reason,
      wordsBefore,
      wordsAfter: result.wordCount ?? wordsAfter,
      internalScore: result.internalScore,
      qualityScore: result.qualityScore,
      sourcesUsed: fuel.sourceCount,
      sourceUrls: [...new Set(sourceUrls)].slice(0, 8),
      factsAfter: after.facts,
      qualityGatePass: metrics?.qualityGatePass ?? false,
      editorialNotes:
        result.status === "published"
          ? editorialNotes(beforeContent, after.content)
          : [`Not published: ${result.reason ?? "unknown"}`],
    });

    console.log(`  ${result.status} — ${wordsBefore} → ${result.wordCount ?? wordsAfter} words`);
  }

  const published = reports.filter((r) => r.status === "published");
  const failed = reports.filter((r) => r.status !== "published");
  const avgInternal =
    published.length > 0
      ? Math.round(
          published.reduce((s, r) => s + (r.internalScore ?? 0), 0) / published.length
        )
      : 0;
  const qualityPassRate =
    published.length > 0
      ? Math.round(
          (published.filter((r) => r.qualityGatePass).length / published.length) * 100
        )
      : 0;

  let benchmarkScore = 92;
  const benchPath = resolve(process.cwd(), "data/brain-benchmark/what-is-artificial-intelligence.json");
  if (existsSync(benchPath)) {
    const bench = JSON.parse(readFileSync(benchPath, "utf8"));
    benchmarkScore = bench.metrics?.internalScore ?? 92;
  }

  const readiness = Math.round(
    (published.length / FLAGSHIP_TEN_SLUGS.length) * 40 +
      qualityPassRate * 0.35 +
      avgInternal * 0.25
  );

  const ceo = {
    compositionEngineVersion: COMPOSITION_ENGINE_VERSION,
    benchmarkSlug: EDITORIAL_BENCHMARK_SLUG,
    benchmarkUrl: `${BASE_URL}/${EDITORIAL_BENCHMARK_SLUG}`,
    flagshipUrls: Object.fromEntries(
      reports.map((r) => [r.title, r.status === "published" ? r.url : `${r.url} (${r.status})`])
    ),
    beforeAfterSummary: reports.map((r) => ({
      topic: r.title,
      before: `${r.wordsBefore} words`,
      after: r.status === "published" ? `${r.wordsAfter} words, score ${r.internalScore}` : r.status,
      quality: r.status === "published" ? (r.qualityGatePass ? "pass" : "issues") : "n/a",
    })),
    wordCounts: Object.fromEntries(reports.map((r) => [r.slug, r.wordsAfter || r.wordsBefore])),
    sourcesUsed: Object.fromEntries(
      reports.map((r) => [r.slug, { count: r.sourcesUsed, urls: r.sourceUrls }])
    ),
    knowledgeAdded: Object.fromEntries(reports.map((r) => [r.slug, `${r.factsAfter} package facts`])),
    brainImprovements: Object.fromEntries(reports.map((r) => [r.slug, r.editorialNotes])),
    failures: failed.map((r) => ({ slug: r.slug, reason: r.reason ?? r.status })),
    overallReadinessScore: readiness,
    published: published.length,
    total: FLAGSHIP_TEN_SLUGS.length,
    reports,
  };

  writeFileSync("temp/flagship-ten-ceo-report.json", JSON.stringify(ceo, null, 2));
  console.log("\n=== CEO REPORT ===\n");
  console.log(JSON.stringify(ceo, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
