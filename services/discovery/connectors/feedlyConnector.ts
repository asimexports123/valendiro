/**
 * Feedly Connector for Discovery System
 * Fetches articles from Feedly API for autonomous knowledge acquisition
 */

import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export interface FeedlyArticle {
  id: string;
  title: string;
  content: {
    content: string;
  };
  summary: {
    content: string;
  };
  originId: string;
  canonical: string[];
  canonicalUrl: string;
  alternate: Array<{
    href: string;
    type: string;
  }>;
  origin: {
    title: string;
    htmlUrl: string;
    streamId: string;
  };
  published: number;
  updated: number;
  author: string;
}

export interface FeedlyStreamResponse {
  id: string;
  title: string;
  direction: string;
  continuation: string;
  items: FeedlyArticle[];
}

export interface FeedlyConfig {
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  userId: string;
}

export class FeedlyConnector {
  private config: FeedlyConfig | null = null;
  private readonly FEEDLY_API_URL = "https://cloud.feedly.com/v3";

  async initialize(): Promise<void> {
    const supabase = createAdminClient();
    const { data: config } = await supabase
      .from("feedly_config")
      .select("*")
      .single();

    if (!config) {
      throw new Error("Feedly configuration not found. Please configure Feedly credentials.");
    }

    this.config = {
      accessToken: config.access_token,
      refreshToken: config.refresh_token,
      tokenExpiresAt: new Date(config.token_expires_at),
      userId: config.user_id,
    };
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.config) {
      throw new Error("Feedly not initialized");
    }

    // Check if token needs refresh
    if (this.config.tokenExpiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
      return; // Token is still valid
    }

    // Refresh token using Feedly OAuth2
    const response = await fetch("https://cloud.feedly.com/v3/auth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: this.config.refreshToken,
        client_id: process.env.FEEDLY_CLIENT_ID,
        client_secret: process.env.FEEDLY_CLIENT_SECRET,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh Feedly access token");
    }

    const data = await response.json();
    this.config.accessToken = data.access_token;
    this.config.tokenExpiresAt = new Date(Date.now() + data.expires_in * 1000);

    // Update in database
    const supabase = createAdminClient();
    await supabase
      .from("feedly_config")
      .update({
        access_token: this.config.accessToken,
        token_expires_at: this.config.tokenExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      });
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    await this.refreshAccessToken();

    const response = await fetch(`${this.FEEDLY_API_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.config!.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Feedly API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getSubscriptions(): Promise<any[]> {
    const response = await this.makeRequest<{ subscriptions: any[] }>("/subscriptions");
    return response.subscriptions;
  }

  async getStream(streamId: string, count: number = 100, continuation?: string): Promise<FeedlyStreamResponse> {
    const params = new URLSearchParams({
      count: count.toString(),
      ranked: "newest",
    });

    if (continuation) {
      params.append("continuation", continuation);
    }

    return this.makeRequest<FeedlyStreamResponse>(
      `/streams/${encodeURIComponent(streamId)}/contents?${params.toString()}`
    );
  }

  async fetchArticlesFromStream(streamId: string, maxArticles: number = 100): Promise<FeedlyArticle[]> {
    const articles: FeedlyArticle[] = [];
    let continuation: string | undefined;
    let fetchedCount = 0;

    while (fetchedCount < maxArticles) {
      const response = await this.getStream(streamId, Math.min(100, maxArticles - fetchedCount), continuation);
      articles.push(...response.items);
      fetchedCount += response.items.length;

      if (!response.continuation || fetchedCount >= maxArticles) {
        break;
      }

      continuation = response.continuation;
    }

    return articles;
  }

  async fetchAllArticles(maxPerStream: number = 100): Promise<FeedlyArticle[]> {
    const subscriptions = await this.getSubscriptions();
    const allArticles: FeedlyArticle[] = [];

    for (const subscription of subscriptions) {
      try {
        const articles = await this.fetchArticlesFromStream(subscription.id, maxPerStream);
        allArticles.push(...articles);
      } catch (error) {
        console.error(`Failed to fetch from stream ${subscription.id}:`, error);
      }
    }

    return allArticles;
  }

  normalizeArticle(article: FeedlyArticle) {
    const url = article.canonicalUrl || article.alternate[0]?.href || article.origin.htmlUrl;
    const publishedAt = article.published ? new Date(article.published).toISOString() : null;

    return {
      external_id: article.id,
      title: article.title,
      content: article.content?.content || article.summary?.content || "",
      summary: article.summary?.content || article.content?.content?.substring(0, 500) || "",
      url: url,
      published_at: publishedAt,
      author: article.author || article.origin?.title || "",
      metadata: {
        origin: article.origin,
        updated: article.updated ? new Date(article.updated).toISOString() : null,
        canonical: article.canonical,
      },
    };
  }

  async saveArticles(sourceId: string, articles: FeedlyArticle[]): Promise<{ saved: number; duplicates: number; errors: number }> {
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

export async function createFeedlyConnector(): Promise<FeedlyConnector> {
  const connector = new FeedlyConnector();
  await connector.initialize();
  return connector;
}
