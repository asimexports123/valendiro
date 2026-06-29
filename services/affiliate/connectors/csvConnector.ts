import { AffiliateConnector, AffiliateConnectorConfig, ConnectorResult } from "./baseConnector";

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

export class CsvConnector extends AffiliateConnector {
  constructor(config: AffiliateConnectorConfig & { csvText?: string }) {
    super(config as AffiliateConnectorConfig);
  }

  async fetchProducts(): Promise<ConnectorResult> {
    const csvText = this.config.apiUrl || "";
    if (!csvText) {
      return { products: [], error: "No CSV data provided" };
    }

    try {
      const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
      if (lines.length < 2) {
        return { products: [], error: "CSV must have header and at least one row" };
      }

      const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
      const products = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        const row: Record<string, unknown> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });

        if (!row.title && !row.name) continue;

        // Normalize tags if provided as comma-separated string
        if (row.tags && typeof row.tags === "string") {
          row.tags = row.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
        }

        products.push(this.normalizeProduct(row, this.config.network || "csv"));
      }

      return { products, error: null };
    } catch (err) {
      return { products: [], error: err instanceof Error ? err.message : "CSV parse error" };
    }
  }
}

export function parseAffiliateCsv(csvText: string, network = "csv", merchant = "Manual CSV") {
  const connector = new CsvConnector({
    name: "Manual CSV",
    enabled: true,
    network,
    merchant,
    apiUrl: csvText,
  });
  return connector.fetchProducts();
}
