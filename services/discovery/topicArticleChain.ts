/**
 * Article → Topic → Related Topics chain.
 *
 * When an article matches a catalog topic, expand to genuinely connected topics
 * (graph + subcategory) and link fuel only where relevance still passes.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getConnectedTopics } from "@/services/knowledge/connectedTopics";
import {
  scoreArticleToTopic,
  isPrimaryMatch,
  isRelatedMatch,
  type ArticleRelevanceInput,
} from "./topicArticleRelevance";

export interface TopicLink {
  topicId: string;
  confidence: number;
  method: string;
}

export interface ChainExpansionResult {
  primaryTopicId: string | null;
  primaryLinks: TopicLink[];
  relatedLinks: TopicLink[];
  topicsVisited: number;
  depthReached: number;
}

async function loadTopicMeta(topicId: string): Promise<{
  id: string;
  slug: string;
  title: string;
  subcategoryId: string | null;
} | null> {
  const sb = createAdminClient();
  const { data } = await sb
    .from("topics")
    .select("id, slug, subcategory_id, topic_translations(title)")
    .eq("id", topicId)
    .eq("topic_translations.language_code", "en")
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    slug: data.slug,
    title: data.topic_translations?.[0]?.title ?? data.slug,
    subcategoryId: data.subcategory_id,
  };
}

async function ensureTopicInternalLink(sourceTopicId: string, targetTopicId: string): Promise<void> {
  const sb = createAdminClient();
  const { data: existing } = await sb
    .from("internal_links")
    .select("id")
    .eq("source_topic_id", sourceTopicId)
    .eq("target_topic_id", targetTopicId)
    .eq("link_type", "related")
    .maybeSingle();

  if (existing) return;

  await sb.from("internal_links").insert({
    source_topic_id: sourceTopicId,
    target_topic_id: targetTopicId,
    link_type: "related",
    relevance_score: 0.75,
    status: "active",
  });
}

/**
 * Article matched to catalog topic(s) → expand to related topics (BFS, max depth).
 */
export async function expandArticleTopicChain(
  article: ArticleRelevanceInput,
  candidateMatches: { topicId: string; slug: string; title: string; resolverConfidence: number }[],
  maxDepth = 2
): Promise<ChainExpansionResult> {
  const primaryLinks: TopicLink[] = [];
  const relatedLinks: TopicLink[] = [];
  const seenTopicIds = new Set<string>();

  const scored = candidateMatches
    .map((m) => ({
      ...m,
      relevance: scoreArticleToTopic(article, m.slug, m.title),
    }))
    .filter((m) => m.relevance.pass)
    .sort((a, b) => b.relevance.score - a.relevance.score);

  const primary = scored.find((m) => isPrimaryMatch(m.relevance));
  if (!primary) {
    return {
      primaryTopicId: null,
      primaryLinks: [],
      relatedLinks: [],
      topicsVisited: 0,
      depthReached: 0,
    };
  }

  primaryLinks.push({
    topicId: primary.topicId,
    confidence: Math.min(1, primary.relevance.score * 0.9 + primary.resolverConfidence * 0.1),
    method: "relevance_primary",
  });
  seenTopicIds.add(primary.topicId);

  const queue: { topicId: string; depth: number }[] = [{ topicId: primary.topicId, depth: 0 }];
  let depthReached = 0;

  while (queue.length > 0) {
    const current = queue.shift()!;
    depthReached = Math.max(depthReached, current.depth);
    if (current.depth >= maxDepth) continue;

    const meta = await loadTopicMeta(current.topicId);
    if (!meta) continue;

    const connected = await getConnectedTopics(meta.id, meta.slug, meta.subcategoryId, 8);

    for (const related of connected) {
      if (seenTopicIds.has(related.id)) continue;

      const relevance = scoreArticleToTopic(article, related.slug, related.title);
      if (!isRelatedMatch(relevance)) continue;

      const isSecondaryPrimary = isPrimaryMatch(relevance);
      const link: TopicLink = {
        topicId: related.id,
        confidence: relevance.score * (isSecondaryPrimary ? 0.85 : 0.65),
        method: isSecondaryPrimary ? "relevance_primary" : "chain_related",
      };

      if (isSecondaryPrimary) {
        primaryLinks.push(link);
      } else {
        relatedLinks.push(link);
      }

      seenTopicIds.add(related.id);
      await ensureTopicInternalLink(primary.topicId, related.id);

      if (current.depth + 1 < maxDepth) {
        queue.push({ topicId: related.id, depth: current.depth + 1 });
      }
    }
  }

  return {
    primaryTopicId: primary.topicId,
    primaryLinks,
    relatedLinks,
    topicsVisited: seenTopicIds.size,
    depthReached,
  };
}

export async function linkArticleToTopicChain(
  articleId: string,
  links: TopicLink[]
): Promise<void> {
  const sb = createAdminClient();
  for (const link of links) {
    await sb.from("discovered_article_topics").upsert(
      {
        discovered_article_id: articleId,
        topic_id: link.topicId,
        confidence: link.confidence,
        mapping_method: link.method,
      },
      { onConflict: "discovered_article_id,topic_id" }
    );
  }
}
