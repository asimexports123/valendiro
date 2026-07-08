/**
 * Catalog Enrichment — re-assembles thin existing topics using accumulated discovery assets.
 *
 * This is the "pour fuel into the Ferrari" loop: internet content already mapped to topics
 * gets synthesized into richer knowledge packages without creating orphan pages.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { assemble } from "@/services/knowledge/assembler";
import {
  gatherCandidatesForTopic,
  rebuildCandidatesFromPackage,
  mergeCandidateSets,
} from "@/services/knowledge/multiSourceGatherer";
import { renderPackage } from "@/services/render/engine";
import { publishRenderedOutput } from "@/services/publish/service";
import { findThinTopics } from "./topicResolver";
import { isArchivedNewsAsset } from "@/services/admission/knowledgeAdmissionEngine";

export interface EnrichmentResult {
  topicSlug: string;
  topicId: string;
  status: "enriched" | "skipped" | "failed";
  reason?: string;
  beforeWords?: number;
  afterWords?: number;
  candidateCount?: number;
}

const MIN_CANDIDATES = 1;
const STRONG_WORD_THRESHOLD = 2500;

export async function enrichTopic(topicId: string, slug: string): Promise<EnrichmentResult> {
  const sb = createAdminClient();

  const { data: trans } = await sb
    .from("topic_translations")
    .select("content")
    .eq("topic_id", topicId)
    .eq("language_code", "en")
    .maybeSingle();

  const beforeWords = (trans?.content ?? "").trim().split(/\s+/).filter(Boolean).length;

  if (beforeWords >= STRONG_WORD_THRESHOLD) {
    return { topicSlug: slug, topicId, status: "skipped", reason: "already comprehensive", beforeWords };
  }

  const { data: pkg } = await sb
    .from("knowledge_packages")
    .select("id")
    .eq("topic_id", topicId)
    .eq("status", "ready")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { candidates: mapped } = await gatherCandidatesForTopic(topicId);
  const evergreenCandidates = mapped.filter(
    (c) => !isArchivedNewsAsset(c.metadata as Record<string, unknown>)
  );
  const rebuilt = pkg?.id ? await rebuildCandidatesFromPackage(pkg.id) : [];
  const candidates = mergeCandidateSets(evergreenCandidates, rebuilt);

  if (candidates.length < MIN_CANDIDATES) {
    return {
      topicSlug: slug,
      topicId,
      status: "skipped",
      reason: mapped.length > 0 ? "only archived news candidates — skipped" : "no discovery candidates mapped",
      beforeWords,
      candidateCount: 0,
    };
  }

  // Never degrade strong packages — only enrich if we'd add sources
  if (beforeWords >= 1200 && mapped.length === 0) {
    await sb
      .from("knowledge_packages")
      .update({ last_verified_at: new Date().toISOString() })
      .eq("id", pkg!.id);
    return {
      topicSlug: slug,
      topicId,
      status: "skipped",
      reason: "strong content, no new sources",
      beforeWords,
      candidateCount: candidates.length,
    };
  }

  try {
    const report = await assemble({
      slotId: null,
      topicId,
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
      policyMode: "ingest",
    });

    if (renderResult.outputId) {
      await publishRenderedOutput(renderResult.outputId, "en");
    }

    const { data: afterTrans } = await sb
      .from("topic_translations")
      .select("content")
      .eq("topic_id", topicId)
      .eq("language_code", "en")
      .maybeSingle();

    const afterWords = (afterTrans?.content ?? "").trim().split(/\s+/).filter(Boolean).length;

    return {
      topicSlug: slug,
      topicId,
      status: "enriched",
      beforeWords,
      afterWords,
      candidateCount: candidates.length,
    };
  } catch (err) {
    return {
      topicSlug: slug,
      topicId,
      status: "failed",
      reason: err instanceof Error ? err.message : String(err),
      beforeWords,
      candidateCount: candidates.length,
    };
  }
}

export async function enrichThinCatalog(limit = 20): Promise<{
  processed: number;
  enriched: number;
  skipped: number;
  failed: number;
  results: EnrichmentResult[];
}> {
  const thin = await findThinTopics(limit);
  const results: EnrichmentResult[] = [];

  for (const topic of thin) {
    const outcome = await enrichTopic(topic.id, topic.slug);
    results.push(outcome);
  }

  return {
    processed: results.length,
    enriched: results.filter((r) => r.status === "enriched").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    failed: results.filter((r) => r.status === "failed").length,
    results,
  };
}
