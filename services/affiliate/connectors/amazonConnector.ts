import { AffiliateConnector, AffiliateConnectorConfig, ConnectorResult } from "./baseConnector";

export class AmazonConnector extends AffiliateConnector {
  constructor(config: AffiliateConnectorConfig) {
    super(config);
  }

  async fetchProducts(): Promise<ConnectorResult> {
    if (!this.config.enabled) {
      return { products: [], error: null };
    }

    // Amazon Product Advertising API requires signed requests and is not free.
    // This is a stub for future integration. Implement HMAC signing here when credentials are ready.
    return {
      products: [],
      error: "Amazon PA-API integration is a stub. Add HMAC signing and ASIN search logic.",
    };
  }
}
