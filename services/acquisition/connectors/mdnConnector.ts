/**
 * Phase 36: MDN (Mozilla Developer Network) Connector
 * 
 * Authoritative source for JavaScript, CSS, HTML documentation
 * Implements existing IConnector interface
 */

import type { IConnector, ConnectorConfig, ConnectorResult, ConnectorHealth, ConnectorStatus } from "./connector";

export class MDNConnector implements IConnector {
  readonly sourceType = "mdn";
  readonly version = "1.0.0";
  private readonly baseUrl = "https://developer.mozilla.org/en-US/docs";

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
          error: "Invalid configuration: missing sourceUrl",
          metadata: {
            retrievedAt: new Date().toISOString(),
            contentType: "application/json",
            size: 0,
            latency,
          },
        };
      }

      // Build MDN API URL
      const apiUrl = this.buildApiUrl(config.sourceUrl!);

      // Fetch from MDN API
      const response = await fetch(apiUrl, {
        headers: {
          "User-Agent": "Valendiro-Knowledge-OS/1.0",
        },
      });

      if (!response.ok) {
        const latency = Date.now() - startTime;
        this.health.lastFailure = new Date().toISOString();
        this.health.latency = latency;

        const status = response.status >= 500 ? "RETRYABLE_ERROR" as ConnectorStatus : "PERMANENT_ERROR" as ConnectorStatus;

        return {
          status,
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
          contentType: response.headers.get("content-type") || "application/json",
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
    return config.sourceType === "mdn" as any && !!config.sourceUrl;
  }

  getHealth(): ConnectorHealth {
    return { ...this.health };
  }

  private buildApiUrl(sourceUrl: string): string {
    // Convert MDN documentation URL to API URL
    // Example: /en-US/docs/Web/JavaScript/Guide/Functions -> /api/v1/en-US/docs/Web/JavaScript/Guide/Functions
    const path = sourceUrl.replace(this.baseUrl, "");
    return `https://developer.mozilla.org${path}`;
  }
}
