/**
 * Local Mock Connector
 * 
 * Produces Knowledge Packages identical to production connectors for testing
 * Activated via USE_MOCK_DATA=true environment variable
 */

import type { IConnector, ConnectorConfig, ConnectorResult, ConnectorHealth, ConnectorStatus } from "./connector";

export class LocalMockConnector implements IConnector {
  readonly sourceType = "local-mock";
  readonly version = "1.0.0";

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

      // Generate mock data identical to production connector output
      const mockData = this.generateMockData(config.sourceUrl!);
      const latency = Date.now() - startTime;

      this.health.lastSuccess = new Date().toISOString();
      this.health.latency = latency;

      return {
        status: "READY" as ConnectorStatus,
        data: mockData,
        contentType: "json",
        sourceUrl: config.sourceUrl!,
        error: null,
        metadata: {
          retrievedAt: new Date().toISOString(),
          contentType: "application/json",
          size: JSON.stringify(mockData).length,
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
    return !!config.sourceUrl && config.sourceType === "local-mock";
  }

  getHealth(): ConnectorHealth {
    return { ...this.health };
  }

  private generateMockData(sourceUrl: string): object {
    // Generate mock data that matches the structure of production connectors
    // This ensures switching between mock and production requires configuration only
    return {
      query: {
        pages: {
          [sourceUrl]: {
            title: sourceUrl,
            extract: "Mock knowledge content for testing purposes. This simulates the structure of Wikipedia API responses.",
          },
        },
      },
    };
  }
}
