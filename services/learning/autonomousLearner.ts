/**
 * Autonomous Learner — the self-improving knowledge engine.
 *
 * Category → Subcategory → Topic
 * For each weak topic: identify gaps → search web → acquire → verify → merge → republish if improved.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { assemble } from "@/services/knowledge/assembler";
import {
  gatherCandidatesForTopic,
  rebuildCandidatesFromPackage,
  mergeCandidateSets,
} from "@/services/knowledge/multiSourceGatherer";
import { renderPackage } from "@/services/render/engine";
import { archivePackage } from "@/services/knowledge/packageService";
import { computeKnowledgePackageMetrics } from "@/services/knowledge/knowledgePackageMetrics";
import { prioritizeWeakestTopics, type PrioritizedTopic } from "./topicPriorityService";
import { seekKnowledgeForGaps } from "./webKnowledgeSeeker";
import {
  evaluateQualityImprovement,
  type QualitySnapshot,
} from "./qualityRegressionGate";

export interface LearnResult {
  topicSlug: string;
  status: "improved" | "skipped_excellent" | "skipped_no_evidence" | "rejected_regression" | "failed";
  reason: string;
  gapsClosed?: string[];
  before?: { richness: number; words: number; facts: number };
  after?: { richness: number; words: number; facts: number };
}

export interface AutonomousLearnerRunResult {
  topicsEvaluated: number;
  topicsSkippedExcellent: number;
  topicsImproved: number;
  topicsRejected: number;
  topicsFailed: number;
  results: LearnResult[];
}

async function snapshotPackage(
  packageId: string,
  topicId: string
): Promise<QualitySnapshot | null> {
  const sb = createAdminClient();

  const { data: facts } = await sb
    .from("knowledge_facts")
    .select("statement, fact_type, confidence, tags, domain")
    .eq("package_id", packageId);

  const { data: citations } = await sb
    .from("knowledge_citations")
    .select("id, source_name, source_url, adapter_name, source_authority")
    .eq("package_id", packageId);

  const { data: rels } = await sb
    .from("knowledge_relationships")
    .select("relationship_type")
    .eq("package_id", packageId);

  const { data: trans } = await sb
    .from("topic_translations")
    .select("content")
    .eq("topic_id", topicId)
    .eq("language_code", "en")
    .maybeSingle();

  if (!facts?.length) return null;

  const metrics = computeKnowledgePackageMetrics({
    facts: facts.map((f) => ({
      statement: f.statement,
      normalizedStatement: f.statement.toLowerCase(),
      factType: f.fact_type,
      confidence: f.confidence,
      domain: f.domain,
      scope: "contextual" as const,
      tags: f.tags ?? [],
      evidences: [],
      provenances: [],
    })),
    relationships: (rels ?? []).map((_, i) => ({
      sourceIndex: i,
      targetIndex: i + 1,
      type: "related_to" as const,
      sourceLevel: "fact" as const,
      targetLevel: "fact" as const,
      strength: "moderate" as const,
      explanation: "",
      bidirectional: true,
    })),
    citations: (citations ?? []).map((c) => ({
      candidateId: c.id,
      sourceName: c.source_name,
      sourceUrl: c.source_url,
      adapterName: c.adapter_name,
      extractionMethod: "",
      sourceAuthority: (c.source_authority as "official" | "encyclopedic" | "community") ?? "community",
    })),
    conflicts: [],
  });

  return {
    packageId,
    wordCount: (trans?.content ?? "").trim().split(/\s+/).filter(Boolean).length,
    metrics,
  };
}

async function learnTopic(topic: PrioritizedTopic): Promise<LearnResult> {
  const { gapReport } = topic;

  if (gapReport.isExcellent) {
    return { topicSlug: topic.slug, status: "skipped_excellent", reason: "Topic meets excellence thresholds" };
  }

  // Acquire evidence for known gaps
  const acquired = await seekKnowledgeForGaps(gapReport);
  const { candidates: existing } = await gatherCandidatesForTopic(topic.topicId);
  const rebuilt = gapReport.packageId
    ? await rebuildCandidatesFromPackage(gapReport.packageId)
    : [];
  const allCandidates = mergeCandidateSets(
    mergeCandidateSets(existing, rebuilt),
    acquired
  );

  if (acquired.length === 0 && existing.length === 0 && rebuilt.length === 0) {
    return {
      topicSlug: topic.slug,
      status: "skipped_no_evidence",
      reason: `No evidence found for gaps: ${gapReport.gaps.slice(0, 2).map((g) => g.detail).join("; ")}`,
    };
  }

  const beforeSnapshot = gapReport.packageId
    ? await snapshotPackage(gapReport.packageId, topic.topicId)
    : null;

  try {
    const report = await assemble({
      slotId: null,
      topicId: topic.topicId,
      slug: topic.slug,
      candidates: allCandidates,
    });

    let afterSnapshot = await snapshotPackage(report.packageId, topic.topicId);
    if (!afterSnapshot) {
      return {
        topicSlug: topic.slug,
        status: "failed",
        reason: "Assembly produced package with no facts",
      };
    }

    const decision = evaluateQualityImprovement(beforeSnapshot, afterSnapshot);

    if (!decision.improved) {
      await archivePackage(report.packageId);
      if (gapReport.packageId) {
        const sb = createAdminClient();
        await sb
          .from("knowledge_packages")
          .update({ status: "ready" })
          .eq("id", gapReport.packageId);
      }

      return {
        topicSlug: topic.slug,
        status: "rejected_regression",
        reason: decision.reason,
        before: beforeSnapshot
          ? {
              richness: beforeSnapshot.metrics.knowledgeRichness,
              words: beforeSnapshot.wordCount,
              facts: beforeSnapshot.metrics.factCount,
            }
          : undefined,
        after: {
          richness: afterSnapshot.metrics.knowledgeRichness,
          words: afterSnapshot.wordCount,
          facts: afterSnapshot.metrics.factCount,
        },
      };
    }

    // Quality improved — render only; publish deferred to Brain cron
    process.env.ALLOW_RENDER = "true";
    await renderPackage({
      packageId: report.packageId,
      format: "markdown",
      forceRerender: true,
      policyMode: "ingest",
    });

    const sb = createAdminClient();
    await sb
      .from("knowledge_packages")
      .update({ last_verified_at: new Date().toISOString() })
      .eq("id", report.packageId);

    // Re-read after publish for accurate word count
    afterSnapshot = (await snapshotPackage(report.packageId, topic.topicId)) ?? afterSnapshot;

    return {
      topicSlug: topic.slug,
      status: "improved",
      reason: `Acquired ${acquired.length} source(s); ${decision.reason}; publish deferred to Brain pipeline`,
      gapsClosed: gapReport.gaps.slice(0, 3).map((g) => g.detail),
      before: beforeSnapshot
        ? {
            richness: beforeSnapshot.metrics.knowledgeRichness,
            words: beforeSnapshot.wordCount,
            facts: beforeSnapshot.metrics.factCount,
          }
        : undefined,
      after: {
        richness: afterSnapshot.metrics.knowledgeRichness,
        words: afterSnapshot.wordCount,
        facts: afterSnapshot.metrics.factCount,
      },
    };
  } catch (err) {
    return {
      topicSlug: topic.slug,
      status: "failed",
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Learn a single topic by slug (for targeted/proof runs). */
export async function learnTopicBySlug(slug: string): Promise<LearnResult> {
  const { analyzePackageGaps } = await import("./packageGapAnalyzer");
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const sb = createAdminClient();
  const { data: topic } = await sb
    .from("topics")
    .select("id, slug")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!topic) {
    return { topicSlug: slug, status: "failed", reason: "Topic not found or not published" };
  }

  const gapReport = await analyzePackageGaps(topic.id);
  return learnTopic({
    topicId: topic.id,
    slug: topic.slug,
    title: gapReport.title,
    categorySlug: gapReport.categorySlug,
    subcategorySlug: gapReport.subcategorySlug,
    weaknessScore: gapReport.weaknessScore,
    gapReport,
  });
}

function tally(results: LearnResult[]): Omit<AutonomousLearnerRunResult, "results"> {
  return {
    topicsEvaluated: results.length,
    topicsSkippedExcellent: results.filter((r) => r.status === "skipped_excellent").length,
    topicsImproved: results.filter((r) => r.status === "improved").length,
    topicsRejected: results.filter((r) => r.status === "rejected_regression").length,
    topicsFailed: results.filter((r) => r.status === "failed").length,
  };
}

/** Run one autonomous learning cycle — weakest topics first. */
export async function runAutonomousLearner(options?: {
  topicLimit?: number;
  /** Prefer these slugs among the weak queue (still skip excellent). */
  preferSlugs?: string[];
  /** Learn only these slugs (ignore global ranking). */
  onlySlugs?: string[];
}): Promise<AutonomousLearnerRunResult> {
  const topicLimit = options?.topicLimit ?? 10;

  if (options?.onlySlugs?.length) {
    const results: LearnResult[] = [];
    for (const slug of options.onlySlugs.slice(0, topicLimit)) {
      results.push(await learnTopicBySlug(slug));
    }
    return { ...tally(results), results };
  }

  let queue = await prioritizeWeakestTopics(Math.max(topicLimit * 3, 30));

  if (options?.preferSlugs?.length) {
    const prefer = new Set(options.preferSlugs);
    queue = [
      ...queue.filter((t) => prefer.has(t.slug)),
      ...queue.filter((t) => !prefer.has(t.slug)),
    ];
  }

  queue = queue.slice(0, topicLimit);

  const results: LearnResult[] = [];
  for (const topic of queue) {
    results.push(await learnTopic(topic));
  }

  return { ...tally(results), results };
}
