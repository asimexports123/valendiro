/**
 * @architecture-frozen — Feedly knowledge connector (fetch only).
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  KnowledgeConnector,
  RawFetchBatch,
  RegisteredKnowledgeSource,
} from "../types";

export interface FeedlyArticle {
  id: string;
  title: string;
  content: { content: string };
  summary: { content: string };
  originId: string;
  canonical: string[];
  canonicalUrl: string;
  alternate: Array<{ href: string; type: string }>;
  origin: { title: string; htmlUrl: string; streamId: string };
  published: number;
  updated: number;
  author: string;
}

interface FeedlyStreamResponse {
  id: string;
  title: string;
  direction: string;
  continuation: string;
  items: FeedlyArticle[];
}

export type { FeedlyStreamResponse };

interface FeedlyConfig {
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  userId: string;
}

export class FeedlyKnowledgeConnector implements KnowledgeConnector {
  readonly connector_type = "feedly";
  readonly connector_version = "1.0.0";

  private config: FeedlyConfig | null = null;
  private readonly FEEDLY_API_URL = "https://cloud.feedly.com/v3";

  async prepare(_source: RegisteredKnowledgeSource): Promise<void> {
    const supabase = createAdminClient();
    const { data: config } = await supabase.from("feedly_config").select("*").single();

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
    if (!this.config) throw new Error("Feedly not initialized");

    if (this.config.tokenExpiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
      return;
    }

    const response = await fetch("https://cloud.feedly.com/v3/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

    const supabase = createAdminClient();
    await supabase.from("feedly_config").update({
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

  async getSubscriptions(): Promise<Array<{ id: string }>> {
    const response = await this.makeRequest<{ subscriptions: Array<{ id: string }> }>(
      "/subscriptions"
    );
    return response.subscriptions;
  }

  async getStream(
    streamId: string,
    count: number = 100,
    continuation?: string
  ): Promise<FeedlyStreamResponse> {
    const params = new URLSearchParams({ count: count.toString(), ranked: "newest" });
    if (continuation) params.append("continuation", continuation);

    return this.makeRequest<FeedlyStreamResponse>(
      `/streams/${encodeURIComponent(streamId)}/contents?${params.toString()}`
    );
  }

  async fetchArticlesFromStream(streamId: string, maxArticles: number = 100): Promise<FeedlyArticle[]> {
    const articles: FeedlyArticle[] = [];
    let continuation: string | undefined;
    let fetchedCount = 0;

    while (fetchedCount < maxArticles) {
      const response = await this.getStream(
        streamId,
        Math.min(100, maxArticles - fetchedCount),
        continuation
      );
      articles.push(...response.items);
      fetchedCount += response.items.length;

      if (!response.continuation || fetchedCount >= maxArticles) break;
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

  async fetch(_source: RegisteredKnowledgeSource): Promise<RawFetchBatch> {
    const articles = await this.fetchAllArticles();
    const fetchedAt = new Date().toISOString();

    return {
      items: articles.map((article) => ({
        external_id: article.id,
        raw: article,
        fetched_at: fetchedAt,
      })),
    };
  }
}

export const feedlyKnowledgeConnector = new FeedlyKnowledgeConnector();
