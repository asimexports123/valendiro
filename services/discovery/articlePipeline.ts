/**
 * Canonical knowledge asset pipeline.
 * Internet → resolve to catalog topic → assemble → render → publish → graph
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { assemble } from "@/services/knowledge/assembler";
import type { AssemblyInput, CandidateInput } from "@/services/knowledge/types";
import { gatherCandidatesForTopic, mergeCandidateSets } from "@/services/knowledge/multiSourceGatherer";
import { renderPackage, markOutputPublished } from "@/services/render/engine";
import { publishRenderedOutput } from "@/services/publish/service";
import { projectPackageToGraph } from "@/services/knowledge/graphService";
import { resolvePrimaryTopic, resolveArticleToCatalogTopics } from "@/services/discovery/topicResolver";
import {
  KNOWLEDGE_ASSET_TABLE,
  rowToDiscoveredArticleLogical,
  type KnowledgeAssetRow,
} from "@/services/discovery/ingest/knowledgeAssetCompat";
import { v4 as uuidv4 } from "uuid";

const STUCK_PROCESSING_MS = 30 * 60 * 1000;
const BATCH_LIMIT = 25;
/** Minimum confidence to publish — below this, store mapping only (fuel the catalog, don't spawn junk pages). */
const CATALOG_PUBLISH_THRESHOLD = 0.5;

export interface ArticlePipelineResult {
  processed: number;
  published: number;
  failed: number;
  catalogMatches: number;
  deferred: number;
  newTopics: number;
  errors: string[];
}

interface DiscoveredArticle {
  id: string;
  source_id: string;
  title: string;
  content: string | null;
  summary: string | null;
  url: string;
  status: string;
  processing_started_at: string | null;
  metadata: Record<string, unknown> | null;
}

function buildCandidate(article: DiscoveredArticle, sourceName: string): CandidateInput {
  const text = article.content || article.summary || article.title;
  return {
    id: uuidv4(),
    title: article.title,
    description: text,
    sourceUrl: article.url,
    discoveryRunId: article.id,
    adapterName: "rss-connector",
    sourceSlug: sourceName,
    sourceAuthority: "community",
    metadata: article.metadata,
  };
}

async function linkAssetToTopics(
  articleId: string,
  topicIds: { topicId: string; confidence: number; method: string }[]
): Promise<void> {
  const sb = createAdminClient();
  for (const { topicId, confidence, method } of topicIds) {
    await sb.from("discovered_article_topics").upsert(
      {
        discovered_article_id: articleId,
        topic_id: topicId,
        confidence,
        mapping_method: method,
      },
      { onConflict: "discovered_article_id,topic_id" }
    );
  }
}

export async function processDiscoveredArticle(articleId: string): Promise<{
  success: boolean;
  error?: string;
  catalogMatch?: boolean;
  deferred?: boolean;
}> {
  const sb = createAdminClient();

  const { data: row, error: fetchError } = await sb
    .from(KNOWLEDGE_ASSET_TABLE)
    .select("*")
    .eq("id", articleId)
    .single();

  if (fetchError || !row) {
    return { success: false, error: fetchError?.message ?? "Article not found" };
  }

  const article = rowToDiscoveredArticleLogical(row as KnowledgeAssetRow);

  const { data: source } = await sb
    .from("discovery_system_sources")
    .select("name")
    .eq("id", article.source_id)
    .maybeSingle();

  const sourceName = source?.name ?? "rss";

  await sb
    .from(KNOWLEDGE_ASSET_TABLE)
    .update({
      status: "processing",
      processing_started_at: new Date().toISOString(),
    })
    .eq("id", articleId);

  try {
    const candidate = buildCandidate(article as DiscoveredArticle, sourceName);

    // Resolve to existing catalog topic instead of always creating orphan drafts
    const primaryMatch = await resolvePrimaryTopic({
      title: article.title,
      content: article.content,
      summary: article.summary,
    });

    const allMatches = await resolveArticleToCatalogTopics({
      title: article.title,
      content: article.content,
      summary: article.summary,
      url: article.url,
    });

    let topicId: string;
    let slug: string;
    let catalogMatch = false;

    if (primaryMatch && primaryMatch.confidence >= CATALOG_PUBLISH_THRESHOLD) {
      topicId = primaryMatch.topic.id;
      slug = primaryMatch.topic.slug;
      catalogMatch = true;
    } else {
      // No catalog match — store fuel for future enrichment, do NOT spawn orphan news pages
      await linkAssetToTopics(
        articleId,
        allMatches.length > 0
          ? allMatches.map((m) => ({
              topicId: m.topic.id,
              confidence: m.confidence,
              method: m.method,
            }))
          : []
      );

      await sb
        .from(KNOWLEDGE_ASSET_TABLE)
        .update({
          status: "accepted",
          processing_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            ...(article.metadata ?? {}),
            deferred: true,
            reason: "no_catalog_match",
            title: article.title,
          },
        })
        .eq("id", articleId);

      return { success: true, catalogMatch: false, deferred: true };
    }

    // Link asset to all matched catalog topics for multi-source enrichment
    await linkAssetToTopics(
      articleId,
      allMatches.length > 0
        ? allMatches.map((m) => ({
            topicId: m.topic.id,
            confidence: m.confidence,
            method: m.method,
          }))
        : [{ topicId, confidence: 1.0, method: "canonical_pipeline" }]
    );

    const { candidates: topicCandidates } = await gatherCandidatesForTopic(topicId);
    const allCandidates = mergeCandidateSets(topicCandidates, [candidate]);

    const assemblyInput: AssemblyInput = {
      slotId: null,
      topicId,
      slug,
      candidates: allCandidates,
    };

    const report = await assemble(assemblyInput);

    if (!report.packageId) {
      throw new Error("Assembly did not produce a package");
    }

    process.env.ALLOW_RENDER = "true";
    const renderResult = await renderPackage({
      packageId: report.packageId,
      format: "markdown",
      forceRerender: true,
      policyMode: "ingest",
    });

    if (!renderResult.outputId) {
      throw new Error("Render did not produce an output");
    }

    if (renderResult.status === "published") {
      await markOutputPublished(renderResult.outputId);
    }

    const pubResult = await publishRenderedOutput(renderResult.outputId, "en");
    if (!pubResult.success) {
      throw new Error(pubResult.error ?? "Publication failed");
    }

    await projectPackageToGraph(
      report.packageId,
      topicId,
      article.content || article.summary || article.title
    ).catch((graphErr) => {
      console.warn(`[ArticlePipeline] Graph projection non-fatal:`, graphErr);
    });

    await sb
      .from(KNOWLEDGE_ASSET_TABLE)
      .update({
        status: "accepted",
        processing_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", articleId);

    await sb
      .from("knowledge_extraction_queue")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        topic_id: topicId,
      })
      .eq("discovered_article_id", articleId)
      .eq("status", "pending");

    return { success: true, catalogMatch };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[ArticlePipeline] Failed for ${articleId}:`, message);

    await sb
      .from(KNOWLEDGE_ASSET_TABLE)
      .update({
        status: "error",
        rejection_reason: message,
        processing_completed_at: new Date().toISOString(),
      })
      .eq("id", articleId);

    return { success: false, error: message };
  }
}

export async function processArticlePipelineBatch(
  limit = BATCH_LIMIT
): Promise<ArticlePipelineResult> {
  const sb = createAdminClient();
  const result: ArticlePipelineResult = {
    processed: 0,
    published: 0,
    failed: 0,
    catalogMatches: 0,
    deferred: 0,
    newTopics: 0,
    errors: [],
  };

  const stuckThreshold = new Date(Date.now() - STUCK_PROCESSING_MS).toISOString();

  const { data: pending } = await sb
    .from(KNOWLEDGE_ASSET_TABLE)
    .select("id")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);

  const { data: stuck } = await sb
    .from(KNOWLEDGE_ASSET_TABLE)
    .select("id")
    .eq("status", "processing")
    .lt("processing_started_at", stuckThreshold)
    .order("created_at", { ascending: true })
    .limit(Math.max(0, limit - (pending?.length ?? 0)));

  const articleIds = [...(pending ?? []), ...(stuck ?? [])].map((a) => a.id);

  for (const articleId of articleIds) {
    result.processed++;
    const outcome = await processDiscoveredArticle(articleId);
    if (outcome.success) {
      if (outcome.deferred) result.deferred++;
      else result.published++;
      if (outcome.catalogMatch) result.catalogMatches++;
    } else {
      result.failed++;
      if (outcome.error) {
        result.errors.push(`${articleId}: ${outcome.error}`);
      }
    }
  }

  return result;
}

export async function recoverStuckArticles(): Promise<number> {
  const sb = createAdminClient();
  const stuckThreshold = new Date(Date.now() - STUCK_PROCESSING_MS).toISOString();

  const { data } = await sb
    .from(KNOWLEDGE_ASSET_TABLE)
    .update({ status: "pending", processing_started_at: null })
    .eq("status", "processing")
    .lt("processing_started_at", stuckThreshold)
    .select("id");

  return data?.length ?? 0;
}
