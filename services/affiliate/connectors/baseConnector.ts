import { AffiliateProductImport } from "@/lib/types";

export interface AffiliateConnectorConfig {
  name: string;
  enabled: boolean;
  network: string;
  apiUrl?: string;
  apiKey?: string;
  merchant?: string;
  commissionRate?: number;
  headers?: Record<string, string>;
}

export interface ConnectorResult {
  products: AffiliateProductImport[];
  error: string | null;
}

export abstract class AffiliateConnector {
  constructor(public config: AffiliateConnectorConfig) {}

  abstract fetchProducts(): Promise<ConnectorResult>;

  protected normalizeProduct(input: Record<string, unknown>, sourceNetwork: string): AffiliateProductImport {
    const title = String(input.title || input.name || "").trim();
    const description = String(input.description || input.summary || "").trim();
    const price = typeof input.price === "number" ? input.price : parseFloat(String(input.price || "0")) || null;
    const image = input.image_url ? String(input.image_url) : input.image ? String(input.image) : null;
    const affiliateUrl = String(input.affiliate_url || input.url || input.link || "").trim();
    const merchant = String(input.merchant || this.config.merchant || sourceNetwork).trim();
    const category = String(input.category || "General").trim();
    const tags = Array.isArray(input.tags)
      ? input.tags.map((t) => String(t).toLowerCase())
      : String(input.tags || "")
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);
    const externalId = String(input.external_id || input.id || input.sku || affiliateUrl).trim();

    return {
      title,
      description,
      price,
      image,
      affiliate_url: affiliateUrl,
      merchant,
      category,
      tags,
      conversion_score: 0,
      source_network: sourceNetwork,
      external_id: externalId,
    };
  }
}

export function getConfiguredConnectors(): AffiliateConnectorConfig[] {
  const configs: AffiliateConnectorConfig[] = [];

  // Generic JSON API endpoints from env var: URL|network|merchant|commissionRate;URL2|...
  const apiUrls = process.env.AFFILIATE_API_URLS || "";
  if (apiUrls) {
    for (const entry of apiUrls.split(";")) {
      const parts = entry.split("|").map((s) => s.trim());
      if (parts[0]) {
        configs.push({
          name: parts[1] || "Generic API",
          enabled: true,
          network: parts[1] || "generic",
          apiUrl: parts[0],
          merchant: parts[2] || parts[1] || "generic",
          commissionRate: parseFloat(parts[3] || "0") || 0,
        });
      }
    }
  }

  // Amazon PA-API stub (disabled by default until credentials are added)
  if (process.env.AMAZON_ACCESS_KEY && process.env.AMAZON_SECRET_KEY) {
    configs.push({
      name: "Amazon PA-API",
      enabled: true,
      network: "amazon",
      apiKey: process.env.AMAZON_ACCESS_KEY,
      merchant: "Amazon",
      commissionRate: 0.03,
    });
  }

  return configs;
}
