import { createClient } from "@/lib/supabase/server";
import { AffiliateProduct, AffiliateProductTranslation } from "@/lib/types";

export interface RelevantProduct {
  id: string;
  name: string;
  description: string | null;
  affiliate_url: string;
  price: number | null;
  image_url: string | null;
  call_to_action: string | null;
  conversion_score: number;
  relevance_score: number;
}

export async function findRelevantProducts(
  title: string,
  maxProducts = 3
): Promise<RelevantProduct[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("affiliate_products")
    .select("*, affiliate_product_translations(*)")
    .eq("affiliate_product_translations.language_code", "en")
    .order("conversion_score", { ascending: false })
    .limit(100);

  if (!data || data.length === 0) return [];

  const lowerTitle = title.toLowerCase();
  const titleWords = lowerTitle.split(/\s+/).filter((w) => w.length > 3);

  const scored = (data as (AffiliateProduct & { affiliate_product_translations: AffiliateProductTranslation[] })[])
    .map((product) => {
      const translation = product.affiliate_product_translations[0];
      if (!translation) return null;

      const name = translation.name.toLowerCase();
      const description = (translation.description || "").toLowerCase();
      const category = (product.category || "").toLowerCase();
      const tags = product.tags || [];

      let matches = 0;
      for (const word of titleWords) {
        if (name.includes(word) || description.includes(word) || category.includes(word) || tags.some((t) => t.includes(word))) {
          matches++;
        }
      }

      const relevanceScore = Math.min(100, matches * 20 + product.conversion_score * 0.2);
      if (relevanceScore < 15) return null;

      const relevant: RelevantProduct = {
        id: product.id,
        name: translation.name,
        description: translation.description,
        affiliate_url: product.product_url,
        price: product.price,
        image_url: product.image_url,
        call_to_action: translation.call_to_action || "Check price",
        conversion_score: product.conversion_score,
        relevance_score: relevanceScore,
      };
      return relevant;
    })
    .filter((p): p is RelevantProduct => p !== null);

  return scored
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, maxProducts);
}
