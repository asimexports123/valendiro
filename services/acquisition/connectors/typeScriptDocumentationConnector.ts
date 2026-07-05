/**
 * Production Source Integration Roadmap - Phase A
 * TypeScript Documentation Connector
 * 
 * Authoritative source for TypeScript language
 * Implements existing IConnector interface with health, retries, rate limiting
 */

import type { IConnector, ConnectorConfig, ConnectorResult, ConnectorHealth, ConnectorStatus } from "./connector";

export class TypeScriptDocumentationConnector implements IConnector {
  readonly sourceType = "typescript-docs";
  readonly version = "1.0.0";
  private readonly baseUrl = "https://www.typescriptlang.org/docs";
  private readonly maxRetries = 3;
  private readonly rateLimitDelay = 1000;
  private lastRequestTime = 0;

  private health: ConnectorHealth = {
    available: true,
    lastSuccess: null,
    lastFailure: null,
    latency: 0,
    version: this.version,
    sourceType: this.sourceType,
  };

  async connect(config: ConnectorConfig): Promise<ConnectorResult> {
    await this.enforceRateLimit();
    return this.connectWithRetry(config, 0);
  }

  private async connectWithRetry(config: ConnectorConfig, attempt: number): Promise<ConnectorResult> {
    const startTime = Date.now();

    try {
      if (!this.validateSource(config)) {
        const latency = Date.now() - startTime;
        this.health.lastFailure = new Date().toISOString();
        this.health.latency = latency;

        return {
          status: "PERMANENT_ERROR" as ConnectorStatus,
          data: null,
          contentType: "html",
          sourceUrl: config.sourceUrl || "",
          error: "Invalid configuration: missing sourceUrl",
          metadata: {
            retrievedAt: new Date().toISOString(),
            contentType: "text/html",
            size: 0,
            latency,
          },
        };
      }

      const response = await fetch(config.sourceUrl!, {
        headers: {
          "User-Agent": "Valendiro-Knowledge-OS/1.0",
        },
      });

      if (!response.ok) {
        const latency = Date.now() - startTime;
        this.health.lastFailure = new Date().toISOString();
        this.health.latency = latency;

        const status = response.status >= 500 ? "RETRYABLE_ERROR" as ConnectorStatus : "PERMANENT_ERROR" as ConnectorStatus;

        if (status === "RETRYABLE_ERROR" && attempt < this.maxRetries) {
          await this.delay(1000 * (attempt + 1));
          return this.connectWithRetry(config, attempt + 1);
        }

        return {
          status,
          data: null,
          contentType: "html",
          sourceUrl: config.sourceUrl!,
          error: `HTTP ${response.status}: ${response.statusText}`,
          metadata: {
            retrievedAt: new Date().toISOString(),
            contentType: "text/html",
            size: 0,
            latency,
          },
        };
      }

      const html = await response.text();
      const latency = Date.now() - startTime;

      this.health.lastSuccess = new Date().toISOString();
      this.health.latency = latency;

      return {
        status: "READY" as ConnectorStatus,
        data: html,
        contentType: "html",
        sourceUrl: config.sourceUrl!,
        error: null,
        metadata: {
          retrievedAt: new Date().toISOString(),
          contentType: response.headers.get("content-type") || "text/html",
          size: html.length,
          latency,
        },
      };
    } catch (error: any) {
      const latency = Date.now() - startTime;
      this.health.lastFailure = new Date().toISOString();
      this.health.latency = latency;

      if (attempt < this.maxRetries) {
        await this.delay(1000 * (attempt + 1));
        return this.connectWithRetry(config, attempt + 1);
      }

      return {
        status: "RETRYABLE_ERROR" as ConnectorStatus,
        data: null,
        contentType: "html",
        sourceUrl: config.sourceUrl || "",
        error: error.message,
        metadata: {
          retrievedAt: new Date().toISOString(),
          contentType: "text/html",
          size: 0,
          latency,
        },
      };
    }
  }

  validateSource(config: ConnectorConfig): boolean {
    return config.sourceType === "typescript-docs" as any && !!config.sourceUrl;
  }

  getHealth(): ConnectorHealth {
    return { ...this.health };
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await this.delay(this.rateLimitDelay - timeSinceLastRequest);
    }
    
    this.lastRequestTime = Date.now();
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
