import { TemplateData, TemplatedArticle } from "./articleTemplateEngine";
import { generateMetaTitle, generateMetaDescription } from "./articleTemplateEngine";

export function buildAffiliateArticle(data: TemplateData, generatedAt: string): TemplatedArticle {
  const entities = data.entities || [];
  const keywords = data.keywords || [data.title.toLowerCase(), "best", "review"];
  const products = data.products || [];

  const productBlocks = products.slice(0, 3).map((product, index) => [
    `### ${index + 1}. ${product.name}`,
    "",
    product.description ?? "A solid option in this category.",
    "",
    `- **Price:** ${product.price ? `$${product.price.toFixed(2)}` : "Check price"}`,
    `- **Best for:** ${data.title.toLowerCase()}`,
    "",
    `[${product.call_to_action || "View on store"}](${product.affiliate_url})`,
    "",
  ]).flat();

  const sections = [
    `# Best ${data.title}`,
    "",
    data.description ?? `We researched and selected the best options for ${data.title}. This guide includes honest reviews and recommendations.`,
    "",
    "## Top Picks",
    "",
    ...(products.length > 0
      ? productBlocks
      : entities.length > 0
      ? entities.map((e, index) => [
          `### ${index + 1}. ${e.name}`,
          "",
          e.description ?? "Product overview to be added.",
          "",
          "- **Why we recommend it:** Reason to be added.",
          "- **Key features:** Features to be added.",
          "- **Best for:** Target audience to be added.",
          "",
        ]).flat()
      : ["No product recommendations available yet. Add affiliate products to populate this section."]),
    "",
    "## Buying Guide",
    `What to look for when choosing ${data.title}. Focus on value, reliability, features, and customer reviews.`,
    "",
    "## Our Verdict",
    `The best overall pick for most users is the top option listed above. We update recommendations as new products become available.`,
    "",
    "## Affiliate Disclosure",
    "This article contains affiliate links. We may earn a commission when you purchase through our recommendations, at no extra cost to you.",
  ];

  const content = sections.join("\n");
  const excerpt = content.slice(0, 250).trim();

  return {
    title: `Best ${data.title}`,
    excerpt,
    content,
    metaTitle: generateMetaTitle(`Best ${data.title} - Top Picks`),
    metaDescription: generateMetaDescription(data.title, data.description),
    keywords,
    languageCode: data.languageCode,
    generatedAt,
  };
}
