/**
 * Brain external fuel — feeding ONLY from the outside world.
 *
 * RSS, web crawl, Wikipedia, authority docs, gap-driven web search.
 * NEVER: Valendiro pages, rebuilt packages, or our own published content.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  KNOWLEDGE_ASSET_TABLE,
  rowToDiscoveredArticleLogical,
  type KnowledgeAssetRow,
} from "@/services/discovery/ingest/knowledgeAssetCompat";
import { isArchivedNewsAsset } from "@/services/admission/knowledgeAdmissionEngine";
import {
  isExternalWorldAdapter,
  isExternalWorldUrl,
  isValendiroOriginalAdapter,
} from "@/services/discovery/contentOriginPolicy";
import type { CatalogTopicTarget } from "./catalogHierarchy";
import { crawlCatalogTopicSources } from "@/services/learning/webKnowledgeSeeker";

export interface ExternalFuelBlock {
  text: string;
  url: string;
  adapterName: string;
  source: "live-crawl" | "rss-ingest" | "web-gather";
}

function adapterFromMetadata(meta: Record<string, unknown>): string {
  const raw =
    meta.adapter_name ??
    meta.adapterName ??
    (meta.provenance as Record<string, unknown> | undefined)?.adapter_type ??
    "";
  return String(raw);
}

/** Pull RSS / crawl assets linked to topic — external URLs only. */
async function loadExternalAssetsForTopic(topicId: string): Promise<ExternalFuelBlock[]> {
  const sb = createAdminClient();
  const blocks: ExternalFuelBlock[] = [];
  const seenUrls = new Set<string>();

  const { data: mappings } = await sb
    .from("discovered_article_topics")
    .select("discovered_article_id")
    .eq("topic_id", topicId);

  const assetIds = (mappings ?? []).map((m) => m.discovered_article_id);
  if (assetIds.length === 0) return blocks;

  const { data: assets } = await sb
    .from(KNOWLEDGE_ASSET_TABLE)
    .select("*")
    .in("id", assetIds)
    .in("status", ["accepted", "pending"]);

  for (const row of assets ?? []) {
    const article = rowToDiscoveredArticleLogical(row as KnowledgeAssetRow);
    const meta = (article.metadata ?? {}) as Record<string, unknown>;

    if (isArchivedNewsAsset(meta)) continue;
    if (isValendiroOriginalAdapter(adapterFromMetadata(meta))) continue;
    if (!isExternalWorldUrl(article.url)) continue;
    if (seenUrls.has(article.url)) continue;

    const text = (article.content || article.summary || "").trim();
    if (text.length < 120) continue;

    seenUrls.add(article.url);
    blocks.push({
      text,
      url: article.url,
      adapterName: adapterFromMetadata(meta) || "rss-connector",
      source: "rss-ingest",
    });
  }

  return blocks;
}

/** Live fetch from authority map, registry, Wikipedia for this catalog topic. */
async function liveCrawlForTopic(target: CatalogTopicTarget): Promise<ExternalFuelBlock[]> {
  const crawled = await crawlCatalogTopicSources({
    slug: target.slug,
    title: target.title,
    categorySlug: target.categorySlug,
    subcategorySlug: target.subcategorySlug,
  });

  return crawled.map((s) => ({
    text: s.text,
    url: s.url,
    adapterName: s.adapterName,
    source: "live-crawl" as const,
  }));
}

export interface ExternalFuelResult {
  blocks: ExternalFuelBlock[];
  texts: string[];
  sourceCount: number;
  liveCrawlCount: number;
  rssCount: number;
}

/**
 * Gather all brain fuel from the outside world for one topic.
 * Brain must never be fed from our own published pages or package rebuilds.
 */
export async function gatherExternalWorldFuel(
  target: CatalogTopicTarget
): Promise<ExternalFuelResult> {
  const merged: ExternalFuelBlock[] = [];
  const seenUrls = new Set<string>();

  const push = (block: ExternalFuelBlock) => {
    if (!isExternalWorldUrl(block.url)) return;
    if (block.source !== "live-crawl" && !isExternalWorldAdapter(block.adapterName)) return;
    if (block.text.length < 120) return;
    if (seenUrls.has(block.url)) return;
    seenUrls.add(block.url);
    merged.push(block);
  };

  for (const block of await liveCrawlForTopic(target)) {
    push(block);
  }

  for (const block of await loadExternalAssetsForTopic(target.topicId)) {
    push(block);
  }

  const texts = merged.map((b) => b.text).slice(0, 8);

  return {
    blocks: merged.slice(0, 8),
    texts,
    sourceCount: merged.length,
    liveCrawlCount: merged.filter((b) => b.source === "live-crawl").length,
    rssCount: merged.filter((b) => b.source === "rss-ingest").length,
  };
}
