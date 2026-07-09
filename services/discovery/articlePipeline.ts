/**
 * Knowledge asset intake pipeline (fuel layer).
 * Internet → admission → catalog topic link → store as fuel (no direct publish).
 * Publish happens only via catalogEnrichment after multi-source refinement.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { resolveArticleToCatalogTopics } from "@/services/discovery/topicResolver";
import { evaluateAdmission } from "@/services/admission/knowledgeAdmissionEngine";
import {
  expandArticleTopicChain,
  linkArticleToTopicChain,
} from "@/services/discovery/topicArticleChain";
import {
  KNOWLEDGE_ASSET_TABLE,
  rowToDiscoveredArticleLogical,
  validateKnowledgeAssetBeforeSave,
  type KnowledgeAssetRow,
} from "@/services/discovery/ingest/knowledgeAssetCompat";

const STUCK_PROCESSING_MS = 30 * 60 * 1000;
const BATCH_LIMIT = 25;

export interface ArticlePipelineResult {
  processed: number;
  published: number;
  failed: number;
  catalogMatches: number;
  deferred: number;
  rejected: number;
  archived: number;
  newTopics: number;
  errors: string[];
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
  rejected?: boolean;
  archived?: boolean;
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

  const assetValidation = validateKnowledgeAssetBeforeSave(row as KnowledgeAssetRow);
  if (!assetValidation.valid) {
    await sb
      .from(KNOWLEDGE_ASSET_TABLE)
      .update({
        status: "failed",
        rejection_reason: assetValidation.reason,
        processing_completed_at: new Date().toISOString(),
      })
      .eq("id", articleId);
    return { success: false, error: assetValidation.reason ?? "Invalid knowledge asset", rejected: true };
  }

  const article = rowToDiscoveredArticleLogical(row as KnowledgeAssetRow);

  await sb
    .from(KNOWLEDGE_ASSET_TABLE)
    .update({
      status: "processing",
      processing_started_at: new Date().toISOString(),
    })
    .eq("id", articleId);

  try {
    // ── Knowledge Admission Engine ──────────────────────────────────────────
    const admission = evaluateAdmission({
      title: article.title,
      content: article.content,
      summary: article.summary,
      url: article.url,
    });

    if (admission.action === "reject") {
      await sb
        .from(KNOWLEDGE_ASSET_TABLE)
        .update({
          status: "error",
          rejection_reason: `admission_reject: ${admission.reason}`,
          processing_completed_at: new Date().toISOString(),
          metadata: {
            ...(article.metadata ?? {}),
            admission_action: "reject",
            admission_reason: admission.reason,
            content_class: admission.contentClass,
          },
        })
        .eq("id", articleId);
      return { success: false, error: admission.reason, rejected: true };
    }

    const allMatches = await resolveArticleToCatalogTopics({
      title: article.title,
      content: article.content,
      summary: article.summary,
      url: article.url,
      admissionNewsScore: admission.newsScore,
      enrichmentHints: admission.enrichmentTopicHints,
    });

    const resolverCandidates = allMatches
      .filter((m) => m.confidence >= 0.3)
      .map((m) => ({
        topicId: m.topic.id,
        slug: m.topic.slug,
        title: m.topic.title,
        resolverConfidence: m.confidence,
      }));

    // Transient news — archive, optionally link as internal fuel only (no publish)
    if (admission.action === "archive_news" || (admission.enrichOnly && !admission.allowPublish)) {
      await linkAssetToTopics(
        articleId,
        allMatches.length > 0
          ? allMatches.slice(0, 2).map((m) => ({
              topicId: m.topic.id,
              confidence: m.confidence * 0.5,
              method: `admission_${m.method}`,
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
            archived_news: true,
            admission_action: admission.action,
            admission_reason: admission.reason,
            content_class: admission.contentClass,
            evergreen_score: admission.evergreenScore,
            news_score: admission.newsScore,
            title: article.title,
          },
        })
        .eq("id", articleId);

      return { success: true, catalogMatch: false, deferred: true, archived: true };
    }

    const chain = await expandArticleTopicChain(
      {
        title: article.title,
        content: article.content,
        summary: article.summary,
      },
      resolverCandidates,
      2
    );

    const allTopicLinks = [...chain.primaryLinks, ...chain.relatedLinks];

    if (allTopicLinks.length === 0) {
      await sb
        .from(KNOWLEDGE_ASSET_TABLE)
        .update({
          status: "error",
          rejection_reason: "no_relevant_catalog_topic",
          processing_completed_at: new Date().toISOString(),
          metadata: {
            ...(article.metadata ?? {}),
            rejected_reason: "Article does not match any catalog topic",
            resolver_candidates: resolverCandidates.length,
          },
        })
        .eq("id", articleId);
      return {
        success: false,
        error: "No relevant catalog topic for this article",
        rejected: true,
      };
    }

    await linkArticleToTopicChain(articleId, allTopicLinks);

    const catalogMatch = chain.primaryLinks.length > 0;

    await sb
      .from(KNOWLEDGE_ASSET_TABLE)
      .update({
        status: "accepted",
        processing_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          ...(article.metadata ?? {}),
          fuel_only: true,
          awaits_enrichment: true,
          catalog_match: catalogMatch,
          admission_action: admission.action,
          admission_reason: admission.reason,
          content_class: admission.contentClass,
          evergreen_score: admission.evergreenScore,
          news_score: admission.newsScore,
          title: article.title,
          linked_topic_count: allTopicLinks.length,
          primary_topic_id: chain.primaryTopicId,
          related_topic_count: chain.relatedLinks.length,
          chain_depth: chain.depthReached,
        },
      })
      .eq("id", articleId);

    return { success: true, catalogMatch, deferred: true };
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
    rejected: 0,
    archived: 0,
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
      if (outcome.archived) result.archived++;
      else if (outcome.deferred) result.deferred++;
      if (outcome.catalogMatch) result.catalogMatches++;
    } else {
      result.failed++;
      if (outcome.rejected) result.rejected++;
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
