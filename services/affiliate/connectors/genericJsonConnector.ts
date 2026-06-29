import { AffiliateConnector, AffiliateConnectorConfig, ConnectorResult } from "./baseConnector";

export class GenericJsonConnector extends AffiliateConnector {
  constructor(config: AffiliateConnectorConfig) {
    super(config);
  }

  async fetchProducts(): Promise<ConnectorResult> {
    if (!this.config.enabled || !this.config.apiUrl) {
      return { products: [], error: null };
    }

    try {
      const headers: Record<string, string> = {
        Accept: "application/json",
        ...this.config.headers,
      };
      if (this.config.apiKey) {
        headers.Authorization = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(this.config.apiUrl, {
        method: "GET",
        headers,
        next: { revalidate: 0 },
      });

      if (!response.ok) {
        return { products: [], error: `HTTP ${response.status}: ${response.statusText}` };
      }

      const data = await response.json();
      const rawItems = Array.isArray(data) ? data : data.products || data.items || data.data || [];
      if (!Array.isArray(rawItems)) {
        return { products: [], error: "Unexpected response format: expected array of products" };
      }

      const products = rawItems
        .filter((item) => item && (item.title || item.name))
        .map((item) => this.normalizeProduct(item, this.config.network));

      return { products, error: null };
    } catch (err) {
      return { products: [], error: err instanceof Error ? err.message : "Unknown error" };
    }
  }
}
