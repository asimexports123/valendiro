import { SupportedLanguage } from "@/lib/types";
import { buildInformationalArticle } from "./informationalTemplate";
import { buildFAQArticle } from "./faqTemplate";
import { buildComparisonArticle } from "./comparisonTemplate";
import { buildAffiliateArticle } from "./affiliateTemplate";

export type ArticleTemplateType = "informational" | "faq" | "comparison" | "affiliate";

export interface AffiliateProductTemplateBlock {
  name: string;
  description: string | null;
  affiliate_url: string;
  price: number | null;
  image_url: string | null;
  call_to_action: string | null;
}

export interface TemplateData {
  title: string;
  description?: string | null;
  languageCode: SupportedLanguage;
  keywords?: string[];
  relatedTopics?: { slug: string; title: string }[];
  relatedQuestions?: { question_text: string; answer?: string }[];
  entities?: { name: string; description?: string }[];
  sections?: Record<string, string[]>;
  products?: AffiliateProductTemplateBlock[];
}

export interface TemplatedArticle {
  title: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  languageCode: SupportedLanguage;
  generatedAt: string;
}

export function generateArticleFromTemplate(
  templateType: ArticleTemplateType,
  data: TemplateData
): TemplatedArticle {
  const generatedAt = new Date().toISOString();

  switch (templateType) {
    case "faq":
      return buildFAQArticle(data, generatedAt);
    case "comparison":
      return buildComparisonArticle(data, generatedAt);
    case "affiliate":
      return buildAffiliateArticle(data, generatedAt);
    case "informational":
    default:
      return buildInformationalArticle(data, generatedAt);
  }
}

export function renderProductBlock(products: AffiliateProductTemplateBlock[] | undefined, maxProducts = 3): string {
  if (!products || products.length === 0) return "";

  const selected = products.slice(0, maxProducts);
  const lines = ["\n\n## Recommended picks\n"];

  for (const product of selected) {
    const priceText = product.price ? `$${product.price.toFixed(2)}` : "";
    const cta = product.call_to_action || "Check it out";
    lines.push(`- **${product.name}**${priceText ? ` — ${priceText}` : ""}`);
    if (product.description) {
      lines.push(`  ${product.description}`);
    }
    lines.push(`  [${cta}](${product.affiliate_url})\n`);
  }

  lines.push("*Affiliate links used. We may earn a commission at no extra cost to you.*\n");
  return lines.join("\n");
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

export function generateMetaTitle(title: string): string {
  return title.length <= 60 ? title : `${title.slice(0, 57)}...`;
}

export function generateMetaDescription(title: string, description?: string | null): string {
  const base = description ? `${title}: ${description}` : title;
  return base.length <= 160 ? base : `${base.slice(0, 157)}...`;
}
