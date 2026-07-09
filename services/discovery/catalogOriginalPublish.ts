/**
 * Publish original catalog content — internal brain rewrite (no LLM required).
 */

import { v4 as uuidv4 } from "uuid";
import { createAdminClient } from "@/lib/supabase/admin";
import { assemble } from "@/services/knowledge/assembler";
import type { CandidateInput } from "@/services/knowledge/types";
import { renderPackage } from "@/services/render/engine";
import { publishRenderedOutput } from "@/services/publish/service";
import { projectPackageToGraph } from "@/services/knowledge/graphService";
import {
  selectCatalogPublishTargets,
  type CatalogTopicTarget,
} from "./catalogHierarchy";
import { runCatalogBrain } from "./catalogBrain";
import { evaluateBrainQuality, MIN_FUEL_SOURCES } from "./brainQualityGate";
import { evaluateOriginality } from "./originalityGate";
import { evaluatePublishEligibility } from "@/services/knowledge/contentQualityGate";
import { gatherExternalWorldFuel } from "./brainExternalFuel";
import {
  isLlmAvailable,
  understandFuelForTopic,
  rewriteOriginalArticle,
} from "./originalContentWriter";

const VALENDIRO_ORIGIN = "https://valendiro.com";

export interface OriginalPublishResult {
  topicSlug: string;
  topicId: string;
  status: "published" | "skipped" | "failed";
  reason?: string;
  wordCount?: number;
  originalityOverlap?: number;
  rewriteEngine?: "brain" | "llm";
}

async function collectWorldFuel(target: CatalogTopicTarget): Promise<string[]> {
  const fuel = await gatherExternalWorldFuel(target);
  return fuel.texts;
}

async function rewriteWithBrainOrLlm(
  target: CatalogTopicTarget,
  fuelTexts: string[]
): Promise<{ markdown: string; engine: "brain" | "llm"; sectionsWritten?: number } | null> {
  const brain = runCatalogBrain(target, fuelTexts);
  if (brain) {
    const originality = evaluateOriginality(brain.markdown, fuelTexts);
    if (originality.pass && brain.quality.pass) {
      return {
        markdown: brain.markdown,
        engine: "brain",
        sectionsWritten: brain.sectionsWritten,
      };
    }
  }

  if (isLlmAvailable()) {
    const notes = await understandFuelForTopic(target, fuelTexts);
    if (notes.facts.length >= 8) {
      const markdown = await rewriteOriginalArticle(target, notes);
      const originality = evaluateOriginality(markdown, fuelTexts);
      const quality = evaluateBrainQuality(markdown);
      const eligibility = evaluatePublishEligibility({ content: markdown, qualityScoreRaw: 75 });
      if (originality.pass && quality.pass && eligibility.allowed) {
        return { markdown, engine: "llm" };
      }
    }
  }

  return null;
}

async function publishOriginalTopic(target: CatalogTopicTarget): Promise<OriginalPublishResult> {
  try {
    const fuelTexts = await collectWorldFuel(target);
    const totalFuelChars = fuelTexts.reduce((sum, t) => sum + t.length, 0);
    if (fuelTexts.length < MIN_FUEL_SOURCES && totalFuelChars < 3500) {
      return {
        topicSlug: target.slug,
        topicId: target.topicId,
        status: "skipped",
        reason: `insufficient external-world fuel (${fuelTexts.length}/${MIN_FUEL_SOURCES} sources, ${totalFuelChars} chars — need RSS/crawl from outside)`,
      };
    }

    const rewritten = await rewriteWithBrainOrLlm(target, fuelTexts);
    if (!rewritten) {
      return {
        topicSlug: target.slug,
        topicId: target.topicId,
        status: "skipped",
        reason: "brain rejected: not enough depth, originality, or quality for publish",
      };
    }

    const brainQuality = evaluateBrainQuality(rewritten.markdown);
    const publishGate = evaluatePublishEligibility({
      content: rewritten.markdown,
      qualityScoreRaw: brainQuality.pass ? 72 : 40,
      wordsBefore: target.wordCount > 0 ? target.wordCount : undefined,
    });

    if (!brainQuality.pass || !publishGate.allowed) {
      return {
        topicSlug: target.slug,
        topicId: target.topicId,
        status: "skipped",
        reason: [...brainQuality.reasons, ...publishGate.reasons].join("; ") || "quality gate failed",
      };
    }

    const originality = evaluateOriginality(rewritten.markdown, fuelTexts);
    if (!originality.pass) {
      return {
        topicSlug: target.slug,
        topicId: target.topicId,
        status: "skipped",
        reason: originality.reason,
        originalityOverlap: originality.maxOverlap,
      };
    }

    const topicUrl = `${VALENDIRO_ORIGIN}/en/topics/${target.slug}`;
    const candidate: CandidateInput = {
      id: uuidv4(),
      title: target.title,
      description: rewritten.markdown,
      sourceUrl: topicUrl,
      discoveryRunId: uuidv4(),
      adapterName: "valendiro-original",
      sourceSlug: "valendiro",
      sourceAuthority: "official",
      metadata: {
        content_origin: "valendiro-original",
        original: true,
        rewrite_engine: rewritten.engine,
        category_slug: target.categorySlug,
        subcategory_slug: target.subcategorySlug,
        pipeline: "standalone-brain",
        originality_overlap: originality.maxOverlap,
        brain_sections: rewritten.sectionsWritten,
      },
    };

    const report = await assemble({
      slotId: null,
      topicId: target.topicId,
      slug: target.slug,
      candidates: [candidate],
    });

    process.env.ALLOW_RENDER = "true";
    const renderResult = await renderPackage({
      packageId: report.packageId,
      format: "markdown",
      forceRerender: true,
      policyMode: "ingest",
    });

    if (!renderResult.outputId) {
      throw new Error("Render failed");
    }

    const pub = await publishRenderedOutput(renderResult.outputId, "en");
    if (!pub.success) {
      throw new Error(pub.error ?? "Publish failed");
    }

    await projectPackageToGraph(report.packageId, target.topicId, rewritten.markdown).catch(() => undefined);

    const sb = createAdminClient();
    await sb
      .from("knowledge_packages")
      .update({ last_verified_at: new Date().toISOString() })
      .eq("id", report.packageId);

    return {
      topicSlug: target.slug,
      topicId: target.topicId,
      status: "published",
      wordCount: rewritten.markdown.split(/\s+/).filter(Boolean).length,
      originalityOverlap: originality.maxOverlap,
      rewriteEngine: rewritten.engine,
    };
  } catch (err) {
    return {
      topicSlug: target.slug,
      topicId: target.topicId,
      status: "failed",
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function publishOriginalCatalogBatch(limit = 5): Promise<{
  processed: number;
  published: number;
  skipped: number;
  failed: number;
  results: OriginalPublishResult[];
}> {
  const targets = await selectCatalogPublishTargets(limit);
  const results: OriginalPublishResult[] = [];

  for (const target of targets) {
    results.push(await publishOriginalTopic(target));
  }

  return {
    processed: results.length,
    published: results.filter((r) => r.status === "published").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    failed: results.filter((r) => r.status === "failed").length,
    results,
  };
}
