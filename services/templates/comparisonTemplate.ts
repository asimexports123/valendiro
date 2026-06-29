import { TemplateData, TemplatedArticle } from "./articleTemplateEngine";
import { generateMetaTitle, generateMetaDescription, renderProductBlock } from "./articleTemplateEngine";

export function buildComparisonArticle(data: TemplateData, generatedAt: string): TemplatedArticle {
  const entities = data.entities || [];
  const keywords = data.keywords || [data.title.toLowerCase(), "comparison"];
  const products = data.products || [];

  const comparisonOptions = products.length > 0
    ? products.slice(0, 3).map((p, index) => ({
        name: p.name,
        description: p.description ?? `A popular option for ${data.title.toLowerCase()}.`,
        cta: p.call_to_action || "View details",
        url: p.affiliate_url,
        price: p.price,
      }))
    : entities.map((e) => ({ name: e.name, description: e.description ?? "Description to be added." }));

  const sections = [
    `# ${data.title}: Comparison Guide`,
    "",
    data.description ?? `This comparison guide helps you understand the differences and choose the right option for ${data.title}.`,
    "",
    "## Comparison Overview",
    "We compare the top options based on key features, use cases, and value.",
    "",
    "## Options Compared",
    ...(comparisonOptions.length > 0
      ? comparisonOptions.map((e, index) => [
          `### Option ${index + 1}: ${e.name}`,
          "",
          e.description,
          "",
          "- **Pros:** Pros to be added.",
          "- **Cons:** Cons to be added.",
          "- **Best for:** Use case to be added.",
          (e as any).url ? `[${(e as any).cta}](${(e as any).url})` : "",
          "",
        ]).flat()
      : ["No options to compare yet. Add entities or affiliate products to populate this section."]),
    "",
    renderProductBlock(products, 3),
    "",
    "## Which One Should You Choose?",
    "Choose the option that best matches your needs. Consider budget, features, and long-term value.",
    "",
    "## Final Recommendation",
    `Based on the comparison, we recommend the best option for most users. Update this section as more data becomes available.`,
  ];

  const content = sections.join("\n");
  const excerpt = content.slice(0, 250).trim();

  return {
    title: `${data.title} - Comparison`,
    excerpt,
    content,
    metaTitle: generateMetaTitle(`${data.title} - Comparison`),
    metaDescription: generateMetaDescription(data.title, data.description),
    keywords,
    languageCode: data.languageCode,
    generatedAt,
  };
}
