/**
 * RSS Feed Connector for Discovery System
 * Fetches articles from RSS feeds for autonomous knowledge acquisition
 */

import { createAdminClient } from "@/lib/supabase/admin";
import Parser from "rss-parser";
import crypto from "crypto";

const parser = new Parser({
  timeout: 10000,
  customFields: {
    item: [
      ['guid', 'guid'],
      ['author', 'author'],
      ['pubDate', 'pubDate'],
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

export class RSSConnector {
  async fetchFeed(feedUrl: string): Promise<RSSArticle[]> {
    try {
      const feed = await parser.parseURL(feedUrl);
      return feed.items as RSSArticle[];
    } catch (error) {
      throw new Error(`Failed to fetch RSS feed from ${feedUrl}: ${error instanceof Error ? error.message : String(error)}`);
    }
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
    const publishedAt = article.isoDate || article.pubDate 
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

  async saveArticles(sourceId: string, articles: RSSArticle[]): Promise<{ saved: number; duplicates: number; errors: number }> {
    const supabase = createAdminClient();
    let saved = 0;
    let duplicates = 0;
    let errors = 0;

    for (const article of articles) {
      try {
        const normalized = this.normalizeArticle(article);
        
        // Check for duplicates using URL hash
        const urlHash = crypto.createHash('sha256').update(normalized.url).digest('hex');
        const { data: existing } = await supabase
          .from("article_deduplication")
          .select("id")
          .eq("url_hash", urlHash)
          .single();

        if (existing) {
          // Update last_seen_at and increment count
          const { data: current } = await supabase
            .from("article_deduplication")
            .select("occurrence_count")
            .eq("id", existing.id)
            .single();
          
          await supabase
            .from("article_deduplication")
            .update({
              last_seen_at: new Date().toISOString(),
              occurrence_count: (current?.occurrence_count || 0) + 1,
            })
            .eq("id", existing.id);
          duplicates++;
          continue;
        }

        // Insert into discovered_articles
        const { error: insertError } = await supabase
          .from("discovered_articles")
          .insert({
            source_id: sourceId,
            external_id: normalized.external_id,
            title: normalized.title,
            content: normalized.content,
            summary: normalized.summary,
            url: normalized.url,
            published_at: normalized.published_at,
            author: normalized.author,
            metadata: normalized.metadata,
            status: "pending",
          });

        if (insertError) {
          // Check if it's a unique constraint violation (duplicate)
          if (insertError.code === "23505") {
            duplicates++;
          } else {
            console.error("Failed to save article:", insertError);
            errors++;
          }
        } else {
          saved++;
        }

        // Insert into deduplication table
        const titleHash = crypto.createHash('sha256').update(normalized.title).digest('hex');
        const contentHash = normalized.content ? crypto.createHash('sha256').update(normalized.content).digest('hex') : null;
        
        await supabase
          .from("article_deduplication")
          .insert({
            url_hash: urlHash,
            title_hash: titleHash,
            content_hash: contentHash,
            url: normalized.url,
            title: normalized.title,
          });
      } catch (error) {
        console.error("Error processing article:", error);
        errors++;
      }
    }

    return { saved, duplicates, errors };
  }

  async updateSourceLastFetched(sourceId: string): Promise<void> {
    const supabase = createAdminClient();
    await supabase
      .from("discovery_system_sources")
      .update({
        last_fetched_at: new Date().toISOString(),
        error_count: 0,
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sourceId);
  }

  async updateSourceError(sourceId: string, error: string): Promise<void> {
    const supabase = createAdminClient();
    await supabase
      .from("discovery_system_sources")
      .update({
        error_count: await this.incrementErrorCount(sourceId),
        last_error: error,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sourceId);
  }

  private async incrementErrorCount(sourceId: string): Promise<number> {
    const supabase = createAdminClient();
    const { data: source } = await supabase
      .from("discovery_system_sources")
      .select("error_count")
      .eq("id", sourceId)
      .single();

    return (source?.error_count || 0) + 1;
  }
}

export async function createRSSConnector(): Promise<RSSConnector> {
  return new RSSConnector();
}
