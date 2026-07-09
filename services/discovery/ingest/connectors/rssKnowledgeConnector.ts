/**
 * @architecture-frozen — RSS knowledge connector (fetch only).
 */

import Parser from "rss-parser";
import type {
  KnowledgeConnector,
  RawFetchBatch,
  RegisteredKnowledgeSource,
} from "./types";

const parser = new Parser({
  timeout: 10000,
  customFields: {
    item: [
      ["guid", "guid"],
      ["author", "author"],
      ["pubDate", "pubDate"],
    ],
  },
});

export interface RSSArticle {
  guid: string;
  title: string;
  content: string;
  contentSnippet: string;
  link: string;
  pubDate: string;
  author: string;
  isoDate: string;
}

export class RssKnowledgeConnector implements KnowledgeConnector {
  readonly connector_type = "rss";
  readonly connector_version = "1.0.0";

  async fetchFeed(feedUrl: string): Promise<RSSArticle[]> {
    const feed = await parser.parseURL(feedUrl);
    return feed.items as RSSArticle[];
  }

  async fetch(source: RegisteredKnowledgeSource): Promise<RawFetchBatch> {
    const feedUrl = source.url;
    if (!feedUrl) {
      throw new Error(`RSS source ${source.id} has no url configured`);
    }

    const articles = await this.fetchFeed(feedUrl);
    const fetchedAt = new Date().toISOString();

    return {
      items: articles.map((article) => ({
        external_id: article.guid || article.link,
        raw: article,
        fetched_at: fetchedAt,
      })),
    };
  }
}

export const rssKnowledgeConnector = new RssKnowledgeConnector();
