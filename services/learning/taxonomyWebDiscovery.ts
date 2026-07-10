/**
 * Open-web crawler — searches the internet, keeps only what matches our taxonomy.
 *
 * Category → subcategory → topic drives search queries AND relevance scoring.
 * No fixed domain list required; crawler decides take vs skip per page.
 */

import { fetchPagesParallel, DEFAULT_TIMEOUT_MS, SEED_TIMEOUT_MS } from "./crawlerFastPath";
import { getPhase1SeedTopic } from "@/config/phase1SeedTopics";
import { getCategorySlugForActiveSubcategory } from "@/config/activeTaxonomy";

export interface TaxonomyDiscoveryInput {
  slug: string;
  title: string;
  categorySlug: string | null;
  subcategorySlug: string | null;
  subcategoryTitle?: string | null;
  primaryKeyword?: string | null;
}

export interface TaxonomyCrawledSource {
  url: string;
  title: string;
  text: string;
  authority: "official" | "encyclopedic" | "community";
  adapterName: string;
  relevanceScore?: number;
}

/** Site intent — what this topic page on Valendiro is about. */
export interface TaxonomyIntent {
  topicTitle: string;
  topicSlug: string;
  categorySlug: string | null;
  subcategorySlug: string | null;
  subcategoryLabel: string;
  keywords: string[];
  /** Core terms from slug — at least one should appear on accepted pages. */
  anchorTerms: string[];
  searchContext: string;
}

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "from", "about", "what", "how", "your", "that", "this",
  "are", "was", "will", "have", "has", "into", "when", "where", "which", "their", "guide",
  "explained", "basics", "fundamentals", "complete", "introduction", "overview",
]);

const SUBCATEGORY_CONTEXT: Record<string, string> = {
  programming: "programming software development",
  "web-development": "web development frontend backend",
  "artificial-intelligence": "artificial intelligence machine learning",
  investing: "investing personal finance USA",
  "mutual-funds": "mutual funds investing",
  "stock-market": "stock market investing trading",
  nutrition: "nutrition diet health",
  fitness: "fitness exercise training",
  "mental-health": "mental health wellness",
};

const BLOCKED_HOST_FRAGMENTS = [
  "facebook.com", "twitter.com", "x.com", "instagram.com", "pinterest.com",
  "tiktok.com", "youtube.com", "amazon.com", "ebay.com", "valendiro.com",
  "linkedin.com", "quora.com", "reddit.com",
];

const REJECT_PAGE_PATTERNS = [
  /add to cart/i, /buy now/i, /free shipping/i, /casino/i, /bet now/i,
  /live score/i, /horoscope/i, /coupon code/i, /download pdf free/i,
  /sign up for our newsletter/i,
];

const EDUCATIONAL_SIGNALS = [
  /tutorial|guide|explained|definition|overview|fundamentals|how to|step by step|learn/i,
];

function humanizeSlug(slug: string): string {
  return slug.replace(/-/g, " ");
}

function isBlockedUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return BLOCKED_HOST_FRAGMENTS.some((b) => host === b || host.endsWith(`.${b}`));
  } catch {
    return true;
  }
}

function parseDuckDuckGoLinks(html: string, max = 6): string[] {
  const urls: string[] = [];
  const linkRegex = /uddg=([^&"]+)/g;
  let match;
  while ((match = linkRegex.exec(html)) !== null && urls.length < max) {
    try {
      const decoded = decodeURIComponent(match[1]);
      if (decoded.startsWith("http") && !isBlockedUrl(decoded) && !urls.includes(decoded)) {
        urls.push(decoded);
      }
    } catch {
      /* skip */
    }
  }
  return urls;
}

/** Open web search — no site: filter. */
export async function searchOpenWeb(query: string, maxUrls = 5): Promise<string[]> {
  try {
    const res = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; ValendiroKnowledgeBot/1.0)" },
        signal: AbortSignal.timeout(12_000),
      }
    );
    if (!res.ok) return [];
    return parseDuckDuckGoLinks(await res.text(), maxUrls);
  } catch {
    return [];
  }
}

/** Build site intent from category › subcategory › topic. */
export function buildTaxonomyIntent(input: TaxonomyDiscoveryInput): TaxonomyIntent {
  const seed = getPhase1SeedTopic(input.slug);
  const subLabel =
    input.subcategoryTitle ?? humanizeSlug(input.subcategorySlug ?? "general");
  const categorySlug =
    input.categorySlug ??
    (input.subcategorySlug ? getCategorySlugForActiveSubcategory(input.subcategorySlug) : null);
  const searchContext =
    (input.subcategorySlug && SUBCATEGORY_CONTEXT[input.subcategorySlug]) ??
    "educational guide explained";

  const keywords = new Set<string>();
  const anchorTerms = new Set<string>();

  const addWords = (text: string, asAnchor = false) => {
    for (const w of text.toLowerCase().split(/\W+/)) {
      if (w.length <= 2 || STOP_WORDS.has(w)) continue;
      keywords.add(w);
      if (asAnchor && w.length > 3) anchorTerms.add(w);
    }
  };

  addWords(input.title, true);
  addWords(input.slug.replace(/-/g, " "), true);
  if (seed?.primaryKeyword) addWords(seed.primaryKeyword, true);
  if (input.primaryKeyword) addWords(input.primaryKeyword, true);
  addWords(subLabel);
  addWords(searchContext);

  return {
    topicTitle: input.title,
    topicSlug: input.slug,
    categorySlug,
    subcategorySlug: input.subcategorySlug,
    subcategoryLabel: subLabel,
    keywords: [...keywords],
    anchorTerms: [...anchorTerms],
    searchContext,
  };
}

/** Crawler decides: keep or reject a fetched page for this topic. */
export function scorePageForTaxonomy(
  page: { url: string; title: string; content: string },
  intent: TaxonomyIntent
): { score: number; pass: boolean; reason: string } {
  const combined = `${page.title}\n${page.content}`.slice(0, 6000);
  const lower = combined.toLowerCase();

  if (page.content.length < 600) {
    return { score: 0, pass: false, reason: "too thin" };
  }

  if (REJECT_PAGE_PATTERNS.some((p) => p.test(combined))) {
    return { score: 0, pass: false, reason: "commerce/news/spam pattern" };
  }

  let keywordHits = 0;
  for (const kw of intent.keywords) {
    if (lower.includes(kw)) keywordHits++;
  }
  const keywordOverlap = intent.keywords.length
    ? keywordHits / intent.keywords.length
    : 0;

  const anchorHit = intent.anchorTerms.some(
    (a) => lower.includes(a) || page.title.toLowerCase().includes(a)
  );

  const subWords = intent.subcategoryLabel.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  const subHit = subWords.some((w) => lower.includes(w));

  const eduHit = EDUCATIONAL_SIGNALS.some((p) => p.test(combined));

  let score = keywordOverlap * 0.5;
  if (anchorHit) score += 0.28;
  if (subHit) score += 0.12;
  if (eduHit) score += 0.08;

  try {
    const host = new URL(page.url).hostname.toLowerCase();
    if (host.endsWith(".gov") || host.includes("wikipedia.org")) score += 0.08;
    if (host.includes("developer.") || host.includes("docs.")) score += 0.06;
  } catch {
    /* ignore */
  }

  score = Math.min(score, 1);

  const pass = score >= 0.3 && anchorHit && keywordOverlap >= 0.08;

  return {
    score,
    pass,
    reason: pass
      ? `relevant (${Math.round(score * 100)}%)`
      : `off-topic (${Math.round(score * 100)}%, anchor=${anchorHit})`,
  };
}

function authorityForUrl(url: string): TaxonomyCrawledSource["authority"] {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("wikipedia.org")) return "encyclopedic";
    if (host.endsWith(".gov") || host.includes("docs.") || host.includes("developer.")) {
      return "official";
    }
  } catch {
    /* ignore */
  }
  return "community";
}

/** Search queries derived from our site taxonomy. */
export function buildTaxonomySearchQueries(input: TaxonomyDiscoveryInput): string[] {
  const intent = buildTaxonomyIntent(input);
  const queries = new Set<string>();
  queries.add(`${input.title} ${intent.subcategoryLabel} ${intent.searchContext}`);
  queries.add(`${humanizeSlug(input.slug)} ${intent.searchContext}`);
  if (intent.anchorTerms.length >= 2) {
    queries.add(`${intent.anchorTerms.slice(0, 3).join(" ")} explained guide`);
  }
  const seed = getPhase1SeedTopic(input.slug);
  if (seed?.primaryKeyword) {
    queries.add(`${seed.primaryKeyword} ${intent.searchContext}`);
  }
  return [...queries].filter((q) => q.trim().length > 10).slice(0, 4);
}

/**
 * Primary open-web discovery — search internet, fetch, score, keep only taxonomy-relevant pages.
 */
export async function discoverFromOpenWeb(
  input: TaxonomyDiscoveryInput,
  options?: { maxSources?: number; timeoutMs?: number }
): Promise<TaxonomyCrawledSource[]> {
  const maxSources = options?.maxSources ?? 6;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const intent = buildTaxonomyIntent(input);
  const queries = buildTaxonomySearchQueries(input);
  const seenUrls = new Set<string>();
  const urlQueue: string[] = [];

  for (const query of queries) {
    if (urlQueue.length >= maxSources * 3) break;
    const urls = await searchOpenWeb(query, 5);
    for (const u of urls) {
      if (!seenUrls.has(u)) {
        seenUrls.add(u);
        urlQueue.push(u);
      }
    }
  }

  if (urlQueue.length === 0) return [];

  const pages = await fetchPagesParallel(urlQueue.slice(0, maxSources * 2), {
    timeoutMs,
    concurrency: 4,
  });

  const scored: TaxonomyCrawledSource[] = [];
  for (const page of pages) {
    const { score, pass, reason } = scorePageForTaxonomy(page, intent);
    if (!pass) continue;
    scored.push({
      url: page.url,
      title: page.title,
      text: page.content,
      authority: authorityForUrl(page.url),
      adapterName: "open-web-crawler",
      relevanceScore: score,
    });
  }

  scored.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
  return scored.slice(0, maxSources);
}

/** @deprecated use discoverFromOpenWeb */
export async function discoverSourcesFromTaxonomy(
  input: TaxonomyDiscoveryInput,
  options?: { maxSources?: number; minCharsBeforeStop?: number }
): Promise<TaxonomyCrawledSource[]> {
  return discoverFromOpenWeb(input, {
    maxSources: options?.maxSources ?? 5,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  });
}

export function totalSourceChars(sources: TaxonomyCrawledSource[]): number {
  return sources.reduce((sum, s) => sum + s.text.length, 0);
}

export { SEED_TIMEOUT_MS };
