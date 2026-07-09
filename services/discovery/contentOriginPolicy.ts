/**
 * Content origin policy — when to show external sources on public pages.
 *
 * encyclopedia  → Wikipedia / encyclopedic ingest → show source links
 * valendiro-original → crawl → understand → rewrite → NO external source on page
 */

export type ContentOrigin = "encyclopedia" | "valendiro-original" | "external-reference";

export const ORIGIN_ADAPTERS: Record<ContentOrigin, string[]> = {
  encyclopedia: ["wikipedia-api", "wikipedia-connector", "encyclopedia-ingest"],
  "valendiro-original": ["valendiro-original", "catalog-rewrite"],
  "external-reference": ["rss-connector", "authority-map", "registry-fetch"],
};

export function isValendiroOriginalAdapter(adapterName: string | null | undefined): boolean {
  if (!adapterName) return false;
  return ORIGIN_ADAPTERS["valendiro-original"].includes(adapterName);
}

export function isEncyclopediaAdapter(adapterName: string | null | undefined): boolean {
  if (!adapterName) return false;
  return ORIGIN_ADAPTERS.encyclopedia.includes(adapterName);
}

/** Hide external RSS/docs citations — only encyclopedia sources show on public pages. */
export function filterCitationsForPublicDisplay<
  T extends { adapterName: string | null; sourceUrl: string | null }
>(citations: T[]): T[] {
  if (citations.length === 0) return citations;

  return citations.filter((c) => {
    if (isValendiroOriginalAdapter(c.adapterName)) return false;
    if (isEncyclopediaAdapter(c.adapterName)) return true;
    return false;
  });
}

export function contentOriginFromAdapter(adapterName: string | null | undefined): ContentOrigin {
  if (isValendiroOriginalAdapter(adapterName)) return "valendiro-original";
  if (isEncyclopediaAdapter(adapterName)) return "encyclopedia";
  return "external-reference";
}

/** Adapters whose text may feed the brain (outside world only — never our own pages). */
export const BRAIN_FEED_ADAPTERS = new Set([
  ...ORIGIN_ADAPTERS.encyclopedia,
  ...ORIGIN_ADAPTERS["external-reference"],
  "catalog-fuel-gather",
  "web-gap-seeker",
  "duckduckgo-search",
]);

export function isExternalWorldAdapter(adapterName: string | null | undefined): boolean {
  if (!adapterName) return false;
  if (isValendiroOriginalAdapter(adapterName)) return false;
  return BRAIN_FEED_ADAPTERS.has(adapterName) || adapterName.includes("rss") || adapterName.includes("wikipedia");
}

export function isExternalWorldUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("valendiro.com")) return false;
    if (host === "localhost" || host.startsWith("127.")) return false;
    return true;
  } catch {
    return false;
  }
}
