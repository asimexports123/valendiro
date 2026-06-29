import { createClient } from "@/lib/supabase/server";
import {
  AffiliateConnector,
  AffiliateConnectorConfig,
  ConnectorResult,
  getConfiguredConnectors,
} from "./connectors/baseConnector";
import { GenericJsonConnector } from "./connectors/genericJsonConnector";
import { AmazonConnector } from "./connectors/amazonConnector";
import { CsvConnector } from "./connectors/csvConnector";
import { calculateProductScore } from "./productScoring";

export interface SyncEngineResult {
  imported: number;
  updated: number;
  errors: string[];
  networks: string[];
}

function createConnector(config: AffiliateConnectorConfig): AffiliateConnector {
  switch (config.network) {
    case "amazon":
      return new AmazonConnector(config);
    case "csv":
      return new CsvConnector(config);
    default:
      return new GenericJsonConnector(config);
  }
}

export async function runAffiliateSync(
  configs: AffiliateConnectorConfig[] = getConfiguredConnectors()
): Promise<SyncEngineResult> {
  const supabase = await createClient();
  const result: SyncEngineResult = { imported: 0, updated: 0, errors: [], networks: [] };

  for (const config of configs) {
    if (!config.enabled) continue;

    const connector = createConnector(config);
    const { products, error } = await connector.fetchProducts();
    if (error) {
      result.errors.push(`[${config.network}] ${error}`);
      continue;
    }

    result.networks.push(config.network);

    for (const product of products) {
      if (!product.title || !product.affiliate_url) continue;

      // Deduplicate by source_network + external_id or affiliate_url
      const { data: existing } = await supabase
        .from("affiliate_products")
        .select("id")
        .eq("source_network", product.source_network)
        .or(`external_id.eq.${product.external_id},product_url.eq.${product.affiliate_url}`)
        .maybeSingle();

      const score = calculateProductScore(product, [product.category, ...product.tags]);

      const basePayload = {
        merchant: product.merchant,
        product_url: product.affiliate_url,
        price: product.price,
        currency: "USD",
        image_url: product.image,
        category: product.category,
        tags: product.tags,
        conversion_score: score.overall,
        estimated_ctr: score.estimatedCtr,
        commission_rate: score.commissionPotential / 100,
        source_network: product.source_network,
        external_id: product.external_id,
        last_synced_at: new Date().toISOString(),
      };

      if (existing) {
        const { error: updateError } = await supabase
          .from("affiliate_products")
          .update(basePayload)
          .eq("id", existing.id);

        if (!updateError) result.updated++;
        else result.errors.push(updateError.message);

        // Update translation
        await supabase.from("affiliate_product_translations").upsert(
          {
            affiliate_product_id: existing.id,
            language_code: "en",
            name: product.title,
            description: product.description,
            call_to_action: "Check price",
          },
          { onConflict: "affiliate_product_id,language_code" }
        );
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("affiliate_products")
          .insert(basePayload)
          .select()
          .single();

        if (insertError) {
          result.errors.push(insertError.message);
          continue;
        }

        result.imported++;

        await supabase.from("affiliate_product_translations").insert({
          affiliate_product_id: inserted.id,
          language_code: "en",
          name: product.title,
          description: product.description,
          call_to_action: "Check price",
        });
      }
    }
  }

  return result;
}

export async function importAffiliateCsv(csvText: string, network = "csv", merchant = "Manual CSV") {
  const config: AffiliateConnectorConfig = {
    name: "Manual CSV",
    enabled: true,
    network,
    merchant,
    apiUrl: csvText,
  };
  return runAffiliateSync([config]);
}
