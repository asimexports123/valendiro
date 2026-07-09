/**
 * Sprint 1 — Flagship topic reassembly, render, and publish.
 * Uses frozen architecture only (assemble → render → publish).
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
import { mkdirSync, writeFileSync } from "fs";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import { assemble } from "../services/knowledge/assembler";
import {
  rebuildCandidatesFromPackage,
  gatherCandidatesForTopic,
  mergeCandidateSets,
} from "../services/knowledge/multiSourceGatherer";
import { renderPackage } from "../services/render/engine";
import { publishRenderedOutput } from "../services/publish/service";
import { clearGlossaryCache } from "../services/knowledge/normalizer";

/** CEO Sprint 1 flagship slugs (production canonical paths). */
const FLAGSHIP_SLUGS = [
  "nodejs-cluster",
  "javascript-fundamentals",
  "html-fundamentals",
  "css-fundamentals",
  "restful-apis",
  "index-funds",
  "health-insurance",
  "budgeting",
  "travel-planning",
  "git-version-control", // git-fundamentals is empty; canonical is git-version-control
];

interface SprintResult {
  slug: string;
  status: "published" | "skipped" | "failed";
  reason?: string;
  beforeWords?: number;
  afterWords?: number;
  beforeFacts?: number;
  afterFacts?: number;
  beforeCitations?: number;
  afterCitations?: number;
  packageId?: string;
}

function wordCount(text: string | null | undefined): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

async function snapshot(
  sb: ReturnType<typeof createClient>,
  topicId: string,
  packageId: string | null
) {
  const { data: trans } = await sb
    .from("topic_translations")
    .select("content")
    .eq("topic_id", topicId)
    .eq("language_code", "en")
    .maybeSingle();

  let facts = 0;
  let citations = 0;
  if (packageId) {
    const { data: pkg } = await sb
      .from("knowledge_packages")
      .select("fact_count")
      .eq("id", packageId)
      .maybeSingle();
    facts = pkg?.fact_count ?? 0;
    const { count } = await sb
      .from("knowledge_citations")
      .select("*", { count: "exact", head: true })
      .eq("package_id", packageId);
    citations = count ?? 0;
  }

  return { words: wordCount(trans?.content), facts, citations };
}

async function main() {
  clearGlossaryCache();
  mkdirSync("temp", { recursive: true });

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const results: SprintResult[] = [];

  for (const slug of FLAGSHIP_SLUGS) {
    console.log(`\n=== ${slug} ===`);

    const { data: topic } = await sb
      .from("topics")
      .select("id, slug")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (!topic) {
      results.push({ slug, status: "skipped", reason: "topic not published" });
      console.log("  SKIP: not published");
      continue;
    }

    const { data: pkg } = await sb
      .from("knowledge_packages")
      .select("id")
      .eq("topic_id", topic.id)
      .eq("status", "ready")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const before = await snapshot(sb, topic.id, pkg?.id ?? null);

    // Never re-assemble flagship pages that already have strong content
    const isStrong = before.words >= 1200 || before.facts >= 20;
    if (isStrong && pkg?.id) {
      await sb
        .from("knowledge_packages")
        .update({ last_verified_at: new Date().toISOString() })
        .eq("id", pkg.id);

      process.env.ALLOW_RENDER = "true";
      const renderResult = await renderPackage({
        packageId: pkg.id,
        format: "markdown",
        forceRerender: true,
      });
      if (renderResult.outputId) {
        await publishRenderedOutput(renderResult.outputId, "en");
      }
      const after = await snapshot(sb, topic.id, pkg.id);
      results.push({
        slug,
        status: "published",
        reason: "strong existing content — verified and re-rendered only",
        beforeWords: before.words,
        afterWords: after.words,
        beforeFacts: before.facts,
        afterFacts: after.facts,
        beforeCitations: before.citations,
        afterCitations: after.citations,
        packageId: pkg.id,
      });
      console.log(`  Strong content preserved: ${before.words} words, ${before.facts} facts`);
      continue;
    }

    let candidates = pkg?.id ? await rebuildCandidatesFromPackage(pkg.id) : [];
    const { candidates: topicCandidates } = await gatherCandidatesForTopic(topic.id);
    candidates = mergeCandidateSets(topicCandidates, candidates);

    if (candidates.length === 0) {
      // Still update last_verified_at and re-render existing package if present
      if (pkg?.id) {
        await sb
          .from("knowledge_packages")
          .update({ last_verified_at: new Date().toISOString() })
          .eq("id", pkg.id);

        process.env.ALLOW_RENDER = "true";
        const renderResult = await renderPackage({
          packageId: pkg.id,
          format: "markdown",
          forceRerender: true,
        });
        if (renderResult.outputId) {
          await publishRenderedOutput(renderResult.outputId, "en");
        }
        const after = await snapshot(sb, topic.id, pkg.id);
        results.push({
          slug,
          status: "published",
          reason: "no new candidates — re-rendered existing package",
          beforeWords: before.words,
          afterWords: after.words,
          beforeFacts: before.facts,
          afterFacts: after.facts,
          beforeCitations: before.citations,
          afterCitations: after.citations,
          packageId: pkg.id,
        });
        console.log(`  Re-render only: ${before.words} → ${after.words} words`);
      } else {
        results.push({ slug, status: "skipped", reason: "no package and no candidates" });
        console.log("  SKIP: no candidates");
      }
      continue;
    }

    try {
      const report = await assemble({
        slotId: null,
        topicId: topic.id,
        slug,
        candidates,
      });

      await sb
        .from("knowledge_packages")
        .update({ last_verified_at: new Date().toISOString() })
        .eq("id", report.packageId);

      process.env.ALLOW_RENDER = "true";
      const renderResult = await renderPackage({
        packageId: report.packageId,
        format: "markdown",
        forceRerender: true,
      });

      if (renderResult.outputId) {
        await publishRenderedOutput(renderResult.outputId, "en");
      }

      const after = await snapshot(sb, topic.id, report.packageId);

      results.push({
        slug,
        status: "published",
        beforeWords: before.words,
        afterWords: after.words,
        beforeFacts: before.facts,
        afterFacts: after.facts,
        beforeCitations: before.citations,
        afterCitations: after.citations,
        packageId: report.packageId,
      });

      console.log(`  Words: ${before.words} → ${after.words}`);
      console.log(`  Facts: ${before.facts} → ${after.facts}`);
      console.log(`  Citations: ${before.citations} → ${after.citations}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ slug, status: "failed", reason: msg });
      console.error(`  FAILED: ${msg}`);
    }
  }

  writeFileSync("temp/sprint1-results.json", JSON.stringify(results, null, 2));
  console.log("\n=== Sprint 1 complete ===");
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
