import { createClient } from "@/lib/supabase/server";
import { AffiliateProduct, AffiliateProductTranslation, KnowledgeObjectType, SupportedLanguage } from "@/lib/types";

export interface AffiliateOptimizationResult {
  optimized: number;
  newLinks: number;
  errors: string[];
}

export interface AffiliatePlacement {
  productId: string;
  placement: "inline" | "sidebar" | "footer";
  contextScore: number;
  reason: string;
}

export async function runAffiliateRevenueOptimization(limit = 50): Promise<AffiliateOptimizationResult> {
  const supabase = await createClient();
  const result: AffiliateOptimizationResult = { optimized: 0, newLinks: 0, errors: [] };

  const { data: products, error } = await supabase
    .from("affiliate_products")
    .select("*, affiliate_product_translations(*)")
    .eq("affiliate_product_translations.language_code", "en")
    .order("conversion_score", { ascending: false })
    .limit(200);

  if (error || !products) {
    result.errors.push(error?.message || "No affiliate products found");
    return result;
  }

  const { data: opportunities } = await supabase.rpc("get_affiliate_opportunities", { limit_count: limit });
  if (!opportunities) return result;

  for (const opp of opportunities) {
    const objectId = opp.object_id as string;
    const objectType = opp.object_type as KnowledgeObjectType;
    const languageCode = opp.language_code as SupportedLanguage;
    const content = opp.content as string;

    const { count: existingCount } = await supabase
      .from("affiliate_object_links")
      .select("*", { count: "exact", head: true })
      .eq("object_id", objectId)
      .eq("object_type", objectType);

    if ((existingCount ?? 0) >= 3) continue;

    const placements = findBestPlacements(content, products as any[], objectType, 3 - (existingCount ?? 0));
    if (placements.length === 0) continue;

    for (const placement of placements) {
      const { data: existing } = await supabase
        .from("affiliate_object_links")
        .select("id")
        .eq("object_id", objectId)
        .eq("object_type", objectType)
        .eq("affiliate_product_id", placement.productId)
        .maybeSingle();

      if (!existing) {
        const { error: insertError } = await supabase.from("affiliate_object_links").insert({
          object_id: objectId,
          object_type: objectType,
          affiliate_product_id: placement.productId,
          placement: placement.placement,
        });
        if (insertError) result.errors.push(insertError.message);
        else result.newLinks++;
      }

      await supabase.from("affiliate_conversions").upsert(
        {
          affiliate_product_id: placement.productId,
          object_id: objectId,
          object_type: objectType,
          language_code: languageCode,
          clicks: 0,
          estimated_revenue: 0,
          conversion_rate: 0,
        },
        { onConflict: "affiliate_product_id,object_id,object_type,language_code" }
      );
    }

    result.optimized++;
  }

  return result;
}

function findBestPlacements(
  content: string,
  products: (AffiliateProduct & { affiliate_product_translations: AffiliateProductTranslation[] })[],
  _objectType: KnowledgeObjectType,
  maxProducts: number
): AffiliatePlacement[] {
  const lower = content.toLowerCase();
  const placements: AffiliatePlacement[] = [];

  for (const product of products) {
    const translation = product.affiliate_product_translations[0];
    if (!translation) continue;

    const name = translation.name.toLowerCase();
    const description = (translation.description || "").toLowerCase();
    const keywords = [...name.split(" "), ...description.split(" ")].filter((k) => k.length > 3);

    let matches = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) matches++;
    }

    const contextScore = Math.min(100, matches * 15 + product.conversion_score * 0.3);
    if (contextScore < 20) continue;

    const placement: AffiliatePlacement["placement"] = contextScore >= 60 ? "inline" : contextScore >= 40 ? "sidebar" : "footer";
    placements.push({
      productId: product.id,
      placement,
      contextScore,
      reason: `Context match ${Math.round(contextScore)} + conversion ${product.conversion_score}`,
    });
  }

  return placements
    .sort((a, b) => b.contextScore - a.contextScore)
    .slice(0, maxProducts);
}

export async function estimateRevenue(days = 30): Promise<{ total: number; byProduct: Record<string, number> }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("affiliate_conversions")
    .select("affiliate_product_id, estimated_revenue")
    .gte("recorded_at", new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

  let total = 0;
  const byProduct: Record<string, number> = {};
  for (const row of data || []) {
    const revenue = row.estimated_revenue ?? 0;
    total += revenue;
    byProduct[row.affiliate_product_id] = (byProduct[row.affiliate_product_id] || 0) + revenue;
  }
  return { total, byProduct };
}
