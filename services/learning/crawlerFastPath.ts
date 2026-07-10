/**
 * Fast intelligent crawl utilities — cache, parallel fetch, Wikipedia fast path.
 * Used by webKnowledgeSeeker; no separate pipeline.
 */

const DEFAULT_TIMEOUT_MS = 12_000;
const SEED_TIMEOUT_MS = 8_000;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h in-process

interface CacheEntry {
  title: string;
  content: string;
  expiresAt: number;
}

const pageCache = new Map<string, CacheEntry>();

export function clearPageTextCache(): void {
  pageCache.clear();
}

function cacheGet(url: string): { title: string; content: string } | null {
  const hit = pageCache.get(url);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    pageCache.delete(url);
    return null;
  }
  return { title: hit.title, content: hit.content };
}

function cacheSet(url: string, title: string, content: string): void {
  pageCache.set(url, { title, content, expiresAt: Date.now() + CACHE_TTL_MS });
}

function wikiTitleFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("wikipedia.org")) return null;
    const title = decodeURIComponent(u.pathname.replace(/^\/wiki\//, ""));
    return title && title !== "Main_Page" ? title : null;
  } catch {
    return null;
  }
}

/** Wikipedia REST/API — fast path; returns null if extract too thin for Brain fuel. */
export async function fetchWikipediaExtractByTitle(
  title: string,
  timeoutMs = 10_000
): Promise<{ title: string; content: string; url: string } | null> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&redirects=1&prop=extracts&exintro=false&explaintext=true&exchars=40000&titles=${encodeURIComponent(title)}&format=json&origin=*`,
      { signal: AbortSignal.timeout(timeoutMs) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      query?: { pages?: Record<string, { title?: string; extract?: string; missing?: string }> };
    };
    const page = Object.values(data.query?.pages ?? {})[0];
    if (!page?.extract || page.extract.length < 1500 || page.missing) return null;
    const resolvedTitle = page.title ?? title;
    return {
      title: resolvedTitle,
      content: page.extract.slice(0, 20_000),
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(resolvedTitle.replace(/ /g, "_"))}`,
    };
  } catch {
    return null;
  }
}

export async function fetchHtmlPageText(
  url: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<{ title: string; content: string } | null> {
  const cached = cacheGet(url);
  if (cached) return cached;

  const wikiTitle = wikiTitleFromUrl(url);
  if (wikiTitle) {
    const wiki = await fetchWikipediaExtractByTitle(wikiTitle, timeoutMs);
    if (wiki && wiki.content.length >= 1500) {
      cacheSet(url, wiki.title, wiki.content);
      return { title: wiki.title, content: wiki.content };
    }
    // Thin API extract — fall through to HTML Readability for full article
  }

  try {
    const { Readability } = await import("@mozilla/readability");
    const { JSDOM } = await import("jsdom");

    const response = await fetch(url, {
      headers: {
        "User-Agent": "ValendiroKnowledgeBot/1.0 (+https://valendiro.com; educational knowledge acquisition)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(timeoutMs),
      redirect: "follow",
    });
    if (!response.ok) return null;

    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (article?.textContent && article.textContent.trim().length > 300) {
      const result = {
        title: article.title ?? url,
        content: article.textContent.trim().slice(0, 25_000),
      };
      cacheSet(url, result.title, result.content);
      return result;
    }

    const body = dom.window.document.body?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    if (body.length > 300) {
      const result = { title: dom.window.document.title ?? url, content: body.slice(0, 25_000) };
      cacheSet(url, result.title, result.content);
      return result;
    }
    return null;
  } catch {
    return null;
  }
}

export interface ParallelFetchOptions {
  timeoutMs?: number;
  /** Stop scheduling new fetches once total chars across results reach this. */
  earlyExitTotalChars?: number;
  /** Max concurrent in-flight requests. */
  concurrency?: number;
}

export interface FetchedPage {
  url: string;
  title: string;
  content: string;
}

/** Parallel page fetch with early exit when enough fuel is gathered. */
export async function fetchPagesParallel(
  urls: string[],
  options: ParallelFetchOptions = {}
): Promise<FetchedPage[]> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const earlyExitTotalChars = options.earlyExitTotalChars ?? 0;
  const concurrency = options.concurrency ?? 4;

  const results: FetchedPage[] = [];
  let totalChars = 0;
  let index = 0;

  async function worker(): Promise<void> {
    while (index < urls.length) {
      if (earlyExitTotalChars > 0 && totalChars >= earlyExitTotalChars) return;
      const url = urls[index++];
      const extracted = await fetchHtmlPageText(url, timeoutMs);
      if (!extracted) continue;
      results.push({ url, title: extracted.title, content: extracted.content });
      totalChars += extracted.content.length;
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, () => worker()));
  return results;
}

export function totalTextChars(pages: FetchedPage[]): number {
  return pages.reduce((sum, p) => sum + p.content.length, 0);
}

export { DEFAULT_TIMEOUT_MS, SEED_TIMEOUT_MS };
