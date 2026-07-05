/**
 * Wikipedia Connector (API-based)
 * 
 * Fetches knowledge from Wikipedia API
 * Uses MediaWiki API for structured data extraction
 */

import type { IConnector, ConnectorConfig, ConnectorResult, ConnectorHealth, ConnectorStatus } from "./connector";

export class WikipediaConnector implements IConnector {
  readonly sourceType = "wikipedia";
  readonly version = "1.0.0";
  private readonly baseUrl = "https://en.wikipedia.org/w/api.php";

  private health: ConnectorHealth = {
    available: true,
    lastSuccess: null,
    lastFailure: null,
    latency: 0,
    version: this.version,
    sourceType: this.sourceType,
  };

  async connect(config: ConnectorConfig): Promise<ConnectorResult> {
    const startTime = Date.now();

    try {
      if (!this.validateSource(config)) {
        const latency = Date.now() - startTime;
        this.health.lastFailure = new Date().toISOString();
        this.health.latency = latency;

        return {
          status: "PERMANENT_ERROR" as ConnectorStatus,
          data: null,
          contentType: "json",
          sourceUrl: config.sourceUrl || "",
          error: "Invalid configuration: missing sourceUrl (article title or URL)",
          metadata: {
            retrievedAt: new Date().toISOString(),
            contentType: "application/json",
            size: 0,
            latency,
          },
        };
      }

      const articleTitle = this.extractArticleTitle(config.sourceUrl!);
      const apiUrl = this.buildApiUrl(articleTitle);

      const response = await fetch(apiUrl);
      if (!response.ok) {
        const latency = Date.now() - startTime;
        this.health.lastFailure = new Date().toISOString();
        this.health.latency = latency;

        return {
          status: "RETRYABLE_ERROR" as ConnectorStatus,
          data: null,
          contentType: "json",
          sourceUrl: config.sourceUrl!,
          error: `HTTP ${response.status}: ${response.statusText}`,
          metadata: {
            retrievedAt: new Date().toISOString(),
            contentType: "application/json",
            size: 0,
            latency,
          },
        };
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      this.health.lastSuccess = new Date().toISOString();
      this.health.latency = latency;

      return {
        status: "READY" as ConnectorStatus,
        data: data,
        contentType: "json",
        sourceUrl: config.sourceUrl!,
        error: null,
        metadata: {
          retrievedAt: new Date().toISOString(),
          contentType: "application/json",
          size: JSON.stringify(data).length,
          latency,
        },
      };
    } catch (error: any) {
      const latency = Date.now() - startTime;
      this.health.lastFailure = new Date().toISOString();
      this.health.latency = latency;

      return {
        status: "RETRYABLE_ERROR" as ConnectorStatus,
        data: null,
        contentType: "json",
        sourceUrl: config.sourceUrl || "",
        error: error.message,
        metadata: {
          retrievedAt: new Date().toISOString(),
          contentType: "application/json",
          size: 0,
          latency,
        },
      };
    }
  }

  validateSource(config: ConnectorConfig): boolean {
    return !!config.sourceUrl && config.sourceType === "wikipedia";
  }

  getHealth(): ConnectorHealth {
    return { ...this.health };
  }

  private extractArticleTitle(sourceUrl: string): string {
    // Extract article title from Wikipedia URL
    // e.g., https://en.wikipedia.org/wiki/Python_(programming_language) -> Python_(programming_language)
    if (sourceUrl.includes("wikipedia.org/wiki/")) {
      const match = sourceUrl.match(/wiki\/([^?#]+)/);
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }
    // If it's just an article title, return as-is
    return sourceUrl;
  }

  private buildApiUrl(articleTitle: string): string {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      prop: "extracts|links|categories",
      exintro: "true",
      explaintext: "true",
      titles: articleTitle,
      pllimit: "500",
      cllimit: "500",
      origin: "*",
    });

    return `${this.baseUrl}?${params.toString()}`;
  }
}
