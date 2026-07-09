/**
 * @architecture-frozen — RSS knowledge source adapter (normalize only).
 */

import {
  KNOWLEDGE_ASSET_SCHEMA_VERSION,
  type KnowledgeAssetDraft,
  type KnowledgeSourceAdapter,
  type RawFetchItem,
  type RegisteredKnowledgeSource,
} from "../types";
import type { RSSArticle } from "../connectors/rssKnowledgeConnector";

export class RssKnowledgeSourceAdapter implements KnowledgeSourceAdapter {
  readonly adapter_type = "rss";
  readonly adapter_version = "1.0.0";

  normalizeArticle(article: RSSArticle): Omit<KnowledgeAssetDraft, "provenance" | "schema_version"> {
    const publishedAt =
      article.isoDate || article.pubDate
        ? new Date(article.isoDate || article.pubDate).toISOString()
        : null;

    return {
      external_id: article.guid || article.link,
      title: article.title || "Untitled",
      content: article.content || article.contentSnippet || "",
      summary: article.contentSnippet || article.content?.substring(0, 500) || "",
      url: article.link,
      published_at: publishedAt,
      author: article.author || "",
      metadata: {
        guid: article.guid,
        pubDate: article.pubDate,
      },
    };
  }

  normalize(raw: RawFetchItem, _source: RegisteredKnowledgeSource): KnowledgeAssetDraft {
    const article = raw.raw as RSSArticle;
    const base = this.normalizeArticle(article);
    return {
      schema_version: KNOWLEDGE_ASSET_SCHEMA_VERSION,
      ...base,
      provenance: {
        connector_type: "rss",
        connector_version: "1.0.0",
        adapter_type: "rss",
        adapter_version: "1.0.0",
      },
    };
  }
}

export const rssKnowledgeSourceAdapter = new RssKnowledgeSourceAdapter();
