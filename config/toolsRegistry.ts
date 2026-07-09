/**
 * Interactive tools registry — calculators & quizzes mapped to subcategories.
 */

export type ToolKind = "calculator" | "quiz";

export interface CatalogTool {
  id: string;
  slug: string;
  kind: ToolKind;
  title: string;
  shortDescription: string;
  subcategorySlug: string;
  categorySlug: string;
  emoji: string;
}

export const CATALOG_TOOLS: CatalogTool[] = [
  {
    id: "sip-calculator",
    slug: "sip-calculator",
    kind: "calculator",
    title: "SIP Calculator",
    shortDescription:
      "Estimate how monthly mutual fund SIPs can grow with compounding over time.",
    subcategorySlug: "mutual-funds",
    categorySlug: "personal-finance",
    emoji: "📈",
  },
];

export function getToolsForSubcategory(subcategorySlug: string): CatalogTool[] {
  return CATALOG_TOOLS.filter((t) => t.subcategorySlug === subcategorySlug);
}

export function getToolBySlug(slug: string): CatalogTool | undefined {
  return CATALOG_TOOLS.find((t) => t.slug === slug);
}

export function toolPath(lang: string, toolSlug: string): string {
  return `/${lang}/tools/${toolSlug}`;
}
