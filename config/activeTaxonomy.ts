/**
 * Phase 1 active taxonomy — narrow execution surface while full tree stays in DB.
 *
 * Categories: keep all 7 in database; nav + brain only use active subs below.
 * Extend by adding slugs when a branch reaches ~80% coverage.
 */

export const PHASE_1_ACTIVE_CATEGORY_SLUGS = [
  "technology",
  "personal-finance",
  "health-wellness",
] as const;

/** Technology: Programming, Web Development, AI */
export const PHASE_1_TECHNOLOGY_SUBCATEGORY_SLUGS = [
  "programming",
  "web-development",
  "artificial-intelligence",
] as const;

/** Personal Finance: Investing, Mutual Funds, Stock Market */
export const PHASE_1_PERSONAL_FINANCE_SUBCATEGORY_SLUGS = [
  "investing",
  "mutual-funds",
  "stock-market",
] as const;

/** Health & Wellness: Nutrition, Fitness, Mental Health */
export const PHASE_1_HEALTH_WELLNESS_SUBCATEGORY_SLUGS = [
  "nutrition",
  "fitness",
  "mental-health",
] as const;

export const PHASE_1_ACTIVE_SUBCATEGORY_SLUGS: readonly string[] = [
  ...PHASE_1_TECHNOLOGY_SUBCATEGORY_SLUGS,
  ...PHASE_1_PERSONAL_FINANCE_SUBCATEGORY_SLUGS,
  ...PHASE_1_HEALTH_WELLNESS_SUBCATEGORY_SLUGS,
];

const ACTIVE_SUB_SET = new Set(PHASE_1_ACTIVE_SUBCATEGORY_SLUGS);
const ACTIVE_CAT_SET = new Set<string>(PHASE_1_ACTIVE_CATEGORY_SLUGS);

export function isActiveSubcategorySlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return ACTIVE_SUB_SET.has(slug);
}

export function isActiveCategorySlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return ACTIVE_CAT_SET.has(slug);
}

/** Topic is in scope for brain publish / fuel gather when its subcategory is active. */
export function isTopicInActiveTaxonomy(
  categorySlug: string | null | undefined,
  subcategorySlug: string | null | undefined
): boolean {
  if (!isActiveCategorySlug(categorySlug)) return false;
  return isActiveSubcategorySlug(subcategorySlug);
}

export function filterActiveSubcategorySlugs<T extends { slug: string }>(subs: T[]): T[] {
  return subs.filter((s) => isActiveSubcategorySlug(s.slug));
}

export function filterNavCategories<T extends { slug: string; subcategories: { slug: string }[] }>(
  categories: T[]
): T[] {
  return categories
    .filter((c) => isActiveCategorySlug(c.slug))
    .map((c) => ({
      ...c,
      subcategories: filterActiveSubcategorySlugs(c.subcategories),
    }))
    .filter((c) => c.subcategories.length > 0);
}
