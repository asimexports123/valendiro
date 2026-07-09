/**
 * @architecture-frozen — Feedly knowledge source adapter (normalize only).
 */

import {
  KNOWLEDGE_ASSET_SCHEMA_VERSION,
  type KnowledgeAssetDraft,
  type KnowledgeSourceAdapter,
  type RawFetchItem,
  type RegisteredKnowledgeSource,
} from "../types";
import type { FeedlyArticle } from "../connectors/feedlyKnowledgeConnector";

export class FeedlyKnowledgeSourceAdapter implements KnowledgeSourceAdapter {
  readonly adapter_type = "feedly";
  readonly adapter_version = "1.0.0";

  normalizeArticle(article: FeedlyArticle): Omit<KnowledgeAssetDraft, "provenance" | "schema_version"> {
    const url = article.canonicalUrl || article.alternate[0]?.href || article.origin.htmlUrl;
    const publishedAt = article.published ? new Date(article.published).toISOString() : null;

    return {
      external_id: article.id,
      title: article.title,
      content: article.content?.content || article.summary?.content || "",
      summary: article.summary?.content || article.content?.content?.substring(0, 500) || "",
      url,
      published_at: publishedAt,
      author: article.author || article.origin?.title || "",
      metadata: {
        origin: article.origin,
        updated: article.updated ? new Date(article.updated).toISOString() : null,
        canonical: article.canonical,
      },
    };
  }

  normalize(raw: RawFetchItem, _source: RegisteredKnowledgeSource): KnowledgeAssetDraft {
    const article = raw.raw as FeedlyArticle;
    const base = this.normalizeArticle(article);
    return {
      schema_version: KNOWLEDGE_ASSET_SCHEMA_VERSION,
      ...base,
      provenance: {
        connector_type: "feedly",
        connector_version: "1.0.0",
        adapter_type: "feedly",
        adapter_version: "1.0.0",
      },
    };
  }
}

export const feedlyKnowledgeSourceAdapter = new FeedlyKnowledgeSourceAdapter();
