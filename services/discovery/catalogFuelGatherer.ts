/**
 * Catalog Fuel Gatherer — gap-driven web crawl for weak topics (fuel only, no publish).
 * Step 3a of the canonical discovery-pipeline.
 */

import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  prioritizeWeakestTopics,
  type PrioritizedTopic,
} from "@/services/learning/topicPriorityService";
import {
  seekKnowledgeForGaps,
  crawlCatalogTopicSources,
} from "@/services/learning/webKnowledgeSeeker";
import { linkArticleToTopicChain } from "@/services/discovery/topicArticleChain";
import {
  KNOWLEDGE_ASSET_TABLE,
  draftToKnowledgeAssetInsert,
} from "@/services/discovery/ingest/knowledgeAssetCompat";
import {
  KNOWLEDGE_ASSET_SCHEMA_VERSION,
  type KnowledgeAssetDraft,
} from "@/services/discovery/ingest/types";
import type { CandidateInput } from "@/services/knowledge/types";

export interface CatalogFuelGatherResult {
  topicsProcessed: number;
  fuelGathered: number;
  duplicates: number;
  skipped: number;
  errors: number;
  topicResults: Array<{
    topicSlug: string;
    saved: number;
    duplicates: number;
    errors: number;
  }>;
}

const CATALOG_FUEL_SOURCE_TYPE = "catalog-fuel-gather";
const MAX_FUEL_PER_TOPIC = 6;

async function ensureCatalogFuelSourceId(): Promise<string> {
  const sb = createAdminClient();
  const { data: existing } = await sb
    .from("discovery_system_sources")
    .select("id")
    .eq("source_type", CATALOG_FUEL_SOURCE_TYPE)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await sb
    .from("discovery_system_sources")
    .insert({
      source_type: CATALOG_FUEL_SOURCE_TYPE,
      name: "Catalog Fuel Gather",
      url: null,
      config: { pipeline: "catalog-fuel-gather" },
      status: "active",
      fetch_interval_minutes: 0,
    })
    .select("id")
    .single();

  if (error || !created) {
    throw new Error(`Failed to ensure catalog fuel source: ${error?.message}`);
  }
  return created.id;
}

interface FuelEntry {
  url: string;
  title: string;
  content: string;
  adapterName: string;
  sourceAuthority: CandidateInput["sourceAuthority"];
}

function candidateToFuelEntry(c: CandidateInput): FuelEntry | null {
  if (!c.sourceUrl || !c.description || c.description.length < 100) return null;
  return {
    url: c.sourceUrl,
    title: c.title,
    content: c.description,
    adapterName: c.adapterName,
    sourceAuthority: c.sourceAuthority,
  };
}

async function linkExistingFuelToTopic(
  url: string,
  topic: PrioritizedTopic
): Promise<void> {
  const sb = createAdminClient();
  const { data: asset } = await sb
    .from(KNOWLEDGE_ASSET_TABLE)
    .select("id")
    .eq("url", url)
    .maybeSingle();

  if (asset?.id) {
    await linkArticleToTopicChain(asset.id, [
      { topicId: topic.topicId, confidence: 0.85, method: "catalog-fuel-gather" },
    ]);
  }
}

async function persistFuelEntry(
  sourceId: string,
  topic: PrioritizedTopic,
  entry: FuelEntry
): Promise<"saved" | "duplicate" | "error"> {
  const sb = createAdminClient();
  const urlHash = crypto.createHash("sha256").update(entry.url).digest("hex");

  const { data: existing } = await sb
    .from("article_deduplication")
    .select("id")
    .eq("url_hash", urlHash)
    .maybeSingle();

  if (existing) {
    await linkExistingFuelToTopic(entry.url, topic);
    return "duplicate";
  }

  const draft: KnowledgeAssetDraft = {
    schema_version: KNOWLEDGE_ASSET_SCHEMA_VERSION,
    external_id: urlHash.slice(0, 32),
    title: entry.title,
    content: entry.content,
    summary: entry.content.slice(0, 300),
    url: entry.url,
    published_at: null,
    author: "",
    metadata: {
      fuel_only: true,
      pipeline: "catalog-fuel-gather",
      topic_slug: topic.slug,
      topic_id: topic.topicId,
      adapter_name: entry.adapterName,
      source_authority: entry.sourceAuthority,
      weakness_score: topic.weaknessScore,
    },
    provenance: {
      connector_type: CATALOG_FUEL_SOURCE_TYPE,
      connector_version: "1.0.0",
      adapter_type: entry.adapterName,
      adapter_version: "1.0.0",
    },
  };

  const row = draftToKnowledgeAssetInsert(sourceId, draft);
  row.status = "accepted";
  row.processing_completed_at = new Date().toISOString();
  row.metadata = {
    ...(row.metadata ?? {}),
    fuel_only: true,
    pipeline: "catalog-fuel-gather",
    awaits_enrichment: false,
  };

  const { data: inserted, error } = await sb
    .from(KNOWLEDGE_ASSET_TABLE)
    .insert(row)
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      await linkExistingFuelToTopic(entry.url, topic);
      return "duplicate";
    }
    console.error(`[CatalogFuelGatherer] Insert failed for ${entry.url}:`, error);
    return "error";
  }

  const titleHash = crypto.createHash("sha256").update(entry.title).digest("hex");
  const contentHash = crypto.createHash("sha256").update(entry.content).digest("hex");
  await sb.from("article_deduplication").insert({
    url_hash: urlHash,
    title_hash: titleHash,
    content_hash: contentHash,
    url: entry.url,
    title: entry.title,
  });

  if (inserted?.id) {
    await linkArticleToTopicChain(inserted.id, [
      { topicId: topic.topicId, confidence: 0.85, method: "catalog-fuel-gather" },
    ]);
  }

  return "saved";
}

async function gatherFuelForTopic(
  sourceId: string,
  topic: PrioritizedTopic
): Promise<{ saved: number; duplicates: number; errors: number }> {
  const entries: FuelEntry[] = [];
  const seenUrls = new Set<string>();

  const push = (entry: FuelEntry | null) => {
    if (!entry || seenUrls.has(entry.url)) return;
    if (entry.content.length < 100) return;
    seenUrls.add(entry.url);
    entries.push(entry);
  };

  const crawled = await crawlCatalogTopicSources({
    slug: topic.slug,
    title: topic.title,
    categorySlug: topic.categorySlug,
    subcategorySlug: topic.subcategorySlug,
  });
  for (const s of crawled) {
    push({
      url: s.url,
      title: s.title,
      content: s.text,
      adapterName: s.adapterName,
      sourceAuthority: s.authority,
    });
  }

  const acquired = await seekKnowledgeForGaps(topic.gapReport);
  for (const c of acquired) push(candidateToFuelEntry(c));

  let saved = 0;
  let duplicates = 0;
  let errors = 0;

  for (const entry of entries.slice(0, MAX_FUEL_PER_TOPIC)) {
    const result = await persistFuelEntry(sourceId, topic, entry);
    if (result === "saved") saved++;
    else if (result === "duplicate") duplicates++;
    else errors++;
  }

  return { saved, duplicates, errors };
}

/** Gap-driven fuel gather for weak catalog topics — persist only, never publish. */
export async function gatherCatalogFuelForWeakTopics(
  options: { topicLimit?: number } = {}
): Promise<CatalogFuelGatherResult> {
  const topicLimit = options.topicLimit ?? 5;
  const sourceId = await ensureCatalogFuelSourceId();
  const topics = await prioritizeWeakestTopics(topicLimit);

  const result: CatalogFuelGatherResult = {
    topicsProcessed: 0,
    fuelGathered: 0,
    duplicates: 0,
    skipped: 0,
    errors: 0,
    topicResults: [],
  };

  for (const topic of topics) {
    if (topic.gapReport.isExcellent) {
      result.skipped++;
      continue;
    }

    try {
      const topicResult = await gatherFuelForTopic(sourceId, topic);
      result.topicsProcessed++;
      result.fuelGathered += topicResult.saved;
      result.duplicates += topicResult.duplicates;
      result.errors += topicResult.errors;
      result.topicResults.push({
        topicSlug: topic.slug,
        ...topicResult,
      });
    } catch (err) {
      result.errors++;
      console.error(`[CatalogFuelGatherer] Failed for ${topic.slug}:`, err);
    }
  }

  return result;
}
