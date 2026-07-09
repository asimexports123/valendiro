/**
 * @deprecated Use services/discovery/ingest — backward-compatible Feedly facade.
 */

import { feedlyKnowledgeConnector } from "@/services/discovery/ingest/connectors/feedlyKnowledgeConnector";
import { feedlyKnowledgeSourceAdapter } from "@/services/discovery/ingest/adapters/feedlyKnowledgeSourceAdapter";
import { persistDiscoveredArticleDrafts } from "@/services/discovery/ingest/persistDiscoveredArticleDrafts";
import {
  updateSourceError,
  updateSourceLastFetched,
} from "@/services/discovery/ingest/sourceLifecycle";

export type {
  FeedlyArticle,
  FeedlyStreamResponse,
} from "@/services/discovery/ingest/connectors/feedlyKnowledgeConnector";

export type FeedlyConfig = {
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  userId: string;
};

import type { FeedlyArticle } from "@/services/discovery/ingest/connectors/feedlyKnowledgeConnector";

export class FeedlyConnector {
  async initialize(): Promise<void> {
    await feedlyKnowledgeConnector.prepare({
      id: "legacy",
      source_type: "feedly",
      name: "",
      url: null,
      config: {},
      status: "active",
    });
  }

  async getSubscriptions(): Promise<Array<{ id: string }>> {
    await this.initialize();
    return feedlyKnowledgeConnector.getSubscriptions();
  }

  async getStream(streamId: string, count?: number, continuation?: string) {
    await this.initialize();
    return feedlyKnowledgeConnector.getStream(streamId, count, continuation);
  }

  async fetchArticlesFromStream(streamId: string, maxArticles?: number): Promise<FeedlyArticle[]> {
    await this.initialize();
    return feedlyKnowledgeConnector.fetchArticlesFromStream(streamId, maxArticles);
  }

  async fetchAllArticles(maxPerStream?: number): Promise<FeedlyArticle[]> {
    await this.initialize();
    return feedlyKnowledgeConnector.fetchAllArticles(maxPerStream);
  }

  normalizeArticle(article: FeedlyArticle) {
    const draft = feedlyKnowledgeSourceAdapter.normalizeArticle(article);
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
    articles: FeedlyArticle[]
  ): Promise<{ saved: number; duplicates: number; errors: number }> {
    const fetchedAt = new Date().toISOString();
    const drafts = articles.map((article) =>
      feedlyKnowledgeSourceAdapter.normalize(
        { external_id: article.id, raw: article, fetched_at: fetchedAt },
        {
          id: sourceId,
          source_type: "feedly",
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

export async function createFeedlyConnector(): Promise<FeedlyConnector> {
  const connector = new FeedlyConnector();
  await connector.initialize();
  return connector;
}
