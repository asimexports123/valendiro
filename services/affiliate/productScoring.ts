import { createClient } from "@/lib/supabase/server";
import { AffiliateProductImport } from "@/lib/types";

export interface ProductScoreBreakdown {
  relevanceScore: number;
  estimatedCtr: number;
  commissionPotential: number;
  overall: number;
}

export function calculateProductScore(
  product: AffiliateProductImport,
  topicKeywords: string[] = []
): ProductScoreBreakdown {
  const lowerTitle = product.title.toLowerCase();
  const lowerTags = product.tags.map((t) => t.toLowerCase());
  const lowerCategory = product.category.toLowerCase();

  // Relevance: match product title/tags with topic keywords
  let relevanceScore = 0;
  if (topicKeywords.length > 0) {
    let matches = 0;
    for (const keyword of topicKeywords) {
      const lowerKeyword = keyword.toLowerCase();
      if (lowerTitle.includes(lowerKeyword) || lowerTags.some((t) => t.includes(lowerKeyword))) {
        matches++;
      }
    }
    relevanceScore = Math.min(100, (matches / topicKeywords.length) * 100);
  } else {
    // Default relevance when no topic context provided
    relevanceScore = 40;
  }

  // Estimated CTR: cheaper products with clear categories tend to convert better
  let estimatedCtr = 0.02;
  if (product.price !== null && product.price > 0 && product.price < 50) estimatedCtr += 0.03;
  if (lowerCategory.includes("best") || lowerCategory.includes("top")) estimatedCtr += 0.02;
  estimatedCtr = Math.min(0.15, estimatedCtr);

  // Commission potential: higher commission rate + price
  const price = product.price || 0;
  const commissionRate = 0.05; // default estimate if unknown
  const commissionPotential = Math.min(100, price * commissionRate * 10);

  const overall = relevanceScore * 0.4 + estimatedCtr * 100 * 0.3 + commissionPotential * 0.3;

  return {
    relevanceScore: Math.round(relevanceScore),
    estimatedCtr: Math.round(estimatedCtr * 10000) / 10000,
    commissionPotential: Math.round(commissionPotential),
    overall: Math.round(overall),
  };
}

export async function getTopicKeywordsForProduct(category: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("topics")
    .select("topic_translations(title)")
    .eq("topic_translations.language_code", "en")
    .limit(50);

  const keywords = new Set<string>();
  keywords.add(category.toLowerCase());
  for (const row of data || []) {
    const title = (row as any).topic_translations?.title as string;
    if (title) {
      title.split(/\s+/).forEach((word) => {
        if (word.length > 3) keywords.add(word.toLowerCase());
      });
    }
  }
  return Array.from(keywords);
}
