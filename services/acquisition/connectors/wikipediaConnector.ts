/**
 * Wikipedia Connector (API-based)
 * 
 * Fetches knowledge from Wikipedia API
 * Uses MediaWiki API for structured data extraction
 */

import type { IConnector, ConnectorConfig, ConnectorResult } from "./connector";

export class WikipediaConnector implements IConnector {
  readonly sourceType = "wikipedia";
  private readonly baseUrl = "https://en.wikipedia.org/w/api.php";

  async connect(config: ConnectorConfig): Promise<ConnectorResult> {
    try {
      if (!this.validateSource(config)) {
        return {
          success: false,
          data: null,
          contentType: "json",
          sourceUrl: config.sourceUrl || "",
          error: "Invalid configuration: missing sourceUrl (article title or URL)",
          metadata: {
            retrievedAt: new Date().toISOString(),
            contentType: "application/json",
            size: 0,
          },
        };
      }

      const articleTitle = this.extractArticleTitle(config.sourceUrl!);
      const apiUrl = this.buildApiUrl(articleTitle);

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        data: data,
        contentType: "json",
        sourceUrl: config.sourceUrl!,
        error: null,
        metadata: {
          retrievedAt: new Date().toISOString(),
          contentType: "application/json",
          size: JSON.stringify(data).length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        contentType: "json",
        sourceUrl: config.sourceUrl || "",
        error: error.message,
        metadata: {
          retrievedAt: new Date().toISOString(),
          contentType: "application/json",
          size: 0,
        },
      };
    }
  }

  validateSource(config: ConnectorConfig): boolean {
    return !!config.sourceUrl && config.sourceType === "wikipedia";
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
