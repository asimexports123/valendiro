/**
 * @deprecated Use services/discovery/ingest — backward-compatible RSS facade.
 * Fetch → RssKnowledgeConnector | Normalize → RssKnowledgeSourceAdapter | Persist → ingest layer
 */

import {
  rssKnowledgeConnector,
  type RSSArticle,
} from "@/services/discovery/ingest/connectors/rssKnowledgeConnector";
import { rssKnowledgeSourceAdapter } from "@/services/discovery/ingest/adapters/rssKnowledgeSourceAdapter";
import { persistDiscoveredArticleDrafts } from "@/services/discovery/ingest/persistDiscoveredArticleDrafts";
import {
  updateSourceError,
  updateSourceLastFetched,
} from "@/services/discovery/ingest/sourceLifecycle";

export type { RSSArticle };

export class RSSConnector {
  async fetchFeed(feedUrl: string): Promise<RSSArticle[]> {
    return rssKnowledgeConnector.fetchFeed(feedUrl);
  }

  async fetchMultipleFeeds(feedUrls: string[]): Promise<Map<string, RSSArticle[]>> {
    const results = new Map<string, RSSArticle[]>();

    const fetchPromises = feedUrls.map(async (url) => {
      try {
        const articles = await this.fetchFeed(url);
        results.set(url, articles);
      } catch (error) {
        console.error(`Failed to fetch feed ${url}:`, error);
        results.set(url, []);
      }
    });

    await Promise.all(fetchPromises);
    return results;
  }

  normalizeArticle(article: RSSArticle) {
    const draft = rssKnowledgeSourceAdapter.normalizeArticle(article);
    return {
      external_id: draft.external_id,
      title: draft.title,
      content: draft.content,
      summary: draft.summary,
      url: draft.url,
      published_at: draft.published_at,
      author: draft.author,
      metadata: draft.metadata,
    };
  }

  async saveArticles(
    sourceId: string,
    articles: RSSArticle[]
  ): Promise<{ saved: number; duplicates: number; errors: number }> {
    const fetchedAt = new Date().toISOString();
    const drafts = articles.map((article) =>
      rssKnowledgeSourceAdapter.normalize(
        {
          external_id: article.guid || article.link,
          raw: article,
          fetched_at: fetchedAt,
        },
        {
          id: sourceId,
          source_type: "rss",
          name: "",
          url: null,
          config: {},
          status: "active",
        }
      )
    );
    return persistDiscoveredArticleDrafts(sourceId, drafts);
  }

  async updateSourceLastFetched(sourceId: string): Promise<void> {
    return updateSourceLastFetched(sourceId);
  }

  async updateSourceError(sourceId: string, error: string): Promise<void> {
    return updateSourceError(sourceId, error);
  }
}

export async function createRSSConnector(): Promise<RSSConnector> {
  return new RSSConnector();
}
