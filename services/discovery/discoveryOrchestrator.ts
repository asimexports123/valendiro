/**
 * Discovery Orchestrator
 *
 * End-to-end discovery flow:
 *   1. Fetch empty hub slots for a topic
 *   2. Run adapter to extract candidates
 *   3. Score candidates
 *   4. Deduplicate against existing
 *   5. Persist results (discovery_runs + discovery_candidates)
 *
 * Coverage-driven: starts from what's missing, not from external trends.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { DiscoveryAdapter, SlotInfo } from "./adapters";
import { StaticMockAdapter } from "./adapters";
import { WikipediaAdapter } from "./adapters/wikipediaAdapter";
import { DocsAdapter } from "./adapters/docsAdapter";
import { scoreCandidates, type ScoringConfig } from "./scoringEngine";
import { deduplicateCandidates } from "./deduplicationEngine";

export interface DiscoveryResult {
  runId: string;
  topicId: string;
  sourceId: string;
  slotsAnalyzed: number;
  candidatesFound: number;
  candidatesAccepted: number;
  candidatesRejected: number;
  candidatesDuplicate: number;
  durationMs: number;
  status: "completed" | "failed";
  error: string | null;
}

function getAdapter(adapterType: string, config?: Record<string, unknown>): DiscoveryAdapter {
  switch (adapterType) {
    case "static":
      return new StaticMockAdapter();
    case "wikipedia":
      return new WikipediaAdapter();
    case "docs":
      return new DocsAdapter({
        baseUrl: (config?.baseUrl as string) ?? "",
        indexPath: (config?.indexPath as string) ?? "/",
        name: (config?.name as string) ?? "Documentation",
      });
    default:
      return new StaticMockAdapter();
  }
}

export async function runDiscovery(
  topicId: string,
  sourceSlug: string,
  scoringConfig?: Partial<ScoringConfig>
): Promise<DiscoveryResult> {
  const supabase = createAdminClient();

  // 1. Validate source
  const { data: source, error: srcErr } = await supabase
    .from("discovery_sources")
    .select("id, adapter_type, config")
    .eq("slug", sourceSlug)
    .eq("status", "active")
    .single();

  if (srcErr || !source) {
    throw new Error(`Discovery source not found or inactive: ${sourceSlug}`);
  }

  // 2. Get topic info
  const { data: topic } = await supabase
    .from("topics")
    .select("id, slug, entity_type_id, topic_translations(title)")
    .eq("id", topicId)
    .single();

  if (!topic || !topic.entity_type_id) {
    throw new Error(`Topic not found or has no entity type: ${topicId}`);
  }

  const topicTitle = (topic.topic_translations as { title: string }[])?.[0]?.title ?? topic.slug;

  // 3. Create discovery run
  const { data: run } = await supabase
    .from("discovery_runs")
    .insert({
      source_id: source.id,
      topic_id: topicId,
      entity_type_id: topic.entity_type_id,
      status: "running",
    })
    .select("id")
    .single();

  if (!run) throw new Error("Failed to create discovery run");

  try {
    // 4. Fetch empty hub slots with translations
    const { data: emptySlots } = await supabase
      .from("hub_slots")
      .select(`
        id, slug,
        hub_slot_translations(title, description),
        hub_sections!inner(slug, hub_section_translations(name))
      `)
      .eq("topic_id", topicId)
      .eq("status", "empty");

    const slotInfos: SlotInfo[] = (emptySlots ?? []).map((s: any) => ({
      id: s.id,
      slug: s.slug,
      title: s.hub_slot_translations?.[0]?.title ?? s.slug,
      description: s.hub_slot_translations?.[0]?.description ?? "",
      sectionSlug: s.hub_sections?.slug ?? "",
      sectionName: s.hub_sections?.hub_section_translations?.[0]?.name ?? "",
    }));

    if (slotInfos.length === 0) {
      // No empty slots — nothing to discover
      await supabase.from("discovery_runs").update({
        status: "completed",
        slots_analyzed: 0,
        completed_at: new Date().toISOString(),
      }).eq("id", run.id);

      return {
        runId: run.id, topicId, sourceId: source.id,
        slotsAnalyzed: 0, candidatesFound: 0, candidatesAccepted: 0,
        candidatesRejected: 0, candidatesDuplicate: 0,
        durationMs: 0,
        status: "completed", error: null,
      };
    }

    // 5. Run adapter
    const startTime = Date.now();
    const adapter = getAdapter(source.adapter_type, source.config as Record<string, unknown>);
    const rawCandidates = await adapter.extract(topic.slug, topicTitle, slotInfos);

    // 6. Score
    const scored = scoreCandidates(rawCandidates, {
      relevanceWeight: 0.6,
      confidenceWeight: 0.4,
      acceptThreshold: 60,
      rejectThreshold: 30,
      ...scoringConfig,
    });

    // 7. Fetch existing candidate titles for dedup
    const { data: existingCandidates } = await supabase
      .from("discovery_candidates")
      .select("title")
      .eq("status", "accepted")
      .in("hub_slot_id", slotInfos.map((s) => s.id));

    const existingTitles = (existingCandidates ?? []).map((c: any) => c.title);
    const { candidates: deduped, duplicatesFound } = deduplicateCandidates(scored, existingTitles);

    // 8. Persist candidates
    let accepted = 0, rejected = 0;
    for (const candidate of deduped) {
      const status = candidate.decision === "accepted" ? "accepted"
        : candidate.decision === "rejected"
          ? (candidate.rejectionReason?.startsWith("Duplicate") ? "duplicate" : "rejected")
          : "pending";

      if (status === "accepted") accepted++;
      if (status === "rejected") rejected++;

      await supabase.from("discovery_candidates").insert({
        run_id: run.id,
        hub_slot_id: candidate.slotId,
        title: candidate.title,
        description: candidate.description,
        source_url: candidate.sourceUrl ?? candidate.attribution?.sourceUrl ?? null,
        relevance_score: candidate.relevanceScore,
        confidence_score: candidate.confidenceScore,
        status,
        rejection_reason: candidate.rejectionReason,
        metadata: {
          ...candidate.metadata,
          attribution: candidate.attribution ?? null,
          score_explanation: candidate.explanation ?? null,
        },
      });
    }

    // 9. Update run
    const durationMs = Date.now() - startTime;
    await supabase.from("discovery_runs").update({
      status: "completed",
      slots_analyzed: slotInfos.length,
      candidates_found: deduped.length,
      candidates_accepted: accepted,
      candidates_rejected: rejected,
      candidates_duplicate: duplicatesFound,
      completed_at: new Date().toISOString(),
      metadata: { duration_ms: durationMs },
    }).eq("id", run.id);

    return {
      runId: run.id, topicId, sourceId: source.id,
      slotsAnalyzed: slotInfos.length,
      candidatesFound: deduped.length,
      candidatesAccepted: accepted,
      candidatesRejected: rejected,
      candidatesDuplicate: duplicatesFound,
      durationMs,
      status: "completed", error: null,
    };

  } catch (err: any) {
    await supabase.from("discovery_runs").update({
      status: "failed",
      error_message: err.message,
      completed_at: new Date().toISOString(),
    }).eq("id", run.id);

    return {
      runId: run.id, topicId, sourceId: source.id,
      slotsAnalyzed: 0, candidatesFound: 0, candidatesAccepted: 0,
      candidatesRejected: 0, candidatesDuplicate: 0,
      durationMs: 0,
      status: "failed", error: err.message,
    };
  }
}
