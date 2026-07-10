/**
 * Brain external fuel — feeding ONLY from the outside world.
 *
 * RSS, web crawl, Wikipedia, authority docs, gap-driven web search.
 * NEVER: Valendiro pages, rebuilt packages, or our own published content.
 *
 * Quality rule: volume alone is not enough. Brain needs at least one
 * definition-bearing source (typically encyclopedic) so the reader’s
 * first question (“What is X?”) can be answered from fuel — not tutorial noise.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  KNOWLEDGE_ASSET_TABLE,
  rowToDiscoveredArticleLogical,
  type KnowledgeAssetRow,
} from "@/services/discovery/ingest/knowledgeAssetCompat";
import { isArchivedNewsAsset } from "@/services/admission/knowledgeAdmissionEngine";
import {
  isExternalWorldAdapter,
  isExternalWorldUrl,
  isValendiroOriginalAdapter,
} from "@/services/discovery/contentOriginPolicy";
import type { CatalogTopicTarget } from "./catalogHierarchy";
import { crawlCatalogTopicSources, getAuthorityUrlsForBrainFuel } from "@/services/learning/webKnowledgeSeeker";
import { fetchWikipediaExtractByTitle, fetchHtmlPageText } from "@/services/learning/crawlerFastPath";
import { getPhase1SeedTopic, PHASE_1_SEED_SLUG_SET } from "@/config/phase1SeedTopics";
import { shortTopicLabel } from "@/services/content/topicHeading";

export interface ExternalFuelBlock {
  text: string;
  url: string;
  adapterName: string;
  source: "live-crawl" | "rss-ingest" | "web-gather";
}

function adapterFromMetadata(meta: Record<string, unknown>): string {
  const raw =
    meta.adapter_name ??
    meta.adapterName ??
    (meta.provenance as Record<string, unknown> | undefined)?.adapter_type ??
    "";
  return String(raw);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Topic noun hints used to detect a true “What is X?” sentence in fuel. */
function topicDefinitionHints(target: CatalogTopicTarget): string[] {
  const seed = getPhase1SeedTopic(target.slug);
  const label = shortTopicLabel(target.title);
  const hints = new Set<string>();

  const add = (raw: string | null | undefined) => {
    if (!raw?.trim()) return;
    const clean = raw.replace(/\?$/u, "").trim();
    hints.add(clean);
    hints.add(clean.replace(/\s+fundamentals$/i, "").trim());
    hints.add(clean.replace(/\s+explained$/i, "").trim());
    hints.add(clean.replace(/^what is\s+/i, "").trim());
    for (const part of clean.split(/[\s/-]+/)) {
      if (part.length >= 3 && !/^(the|and|for|with|from)$/i.test(part)) hints.add(part);
    }
  };

  add(target.title);
  add(label);
  add(seed?.primaryKeyword ?? null);
  add(target.slug.replace(/-/g, " "));
  add(target.slug.replace(/-fundamentals$/, "").replace(/-/g, " "));

  return [...hints].filter((h) => h.length >= 2).slice(0, 12);
}

/**
 * True when fuel contains at least one sentence that defines the topic
 * (topic noun as subject of is/are/means/refers to/defined as).
 * Generic — no topic-specific templates.
 */
export function fuelHasDefinitionSignal(texts: string[], topicHints: string[]): boolean {
  const sample = texts.join("\n\n").slice(0, 100_000);
  if (!sample.trim()) return false;

  for (const hint of topicHints) {
    const h = escapeRegExp(hint);
    const subjectDef = new RegExp(
      `(?:^|[.\\n?!]\\s*)(?:an?|the)\\s+${h}\\s+(?:is|are|refers to|defined as|means)\\b|(?:^|[.\\n?!]\\s*)${h}\\s+(?:is|are|refers to|defined as|means)\\b`,
      "i"
    );
    if (subjectDef.test(sample)) return true;
  }

  // Encyclopedic genre signal: “X is a/an … language|system|method|…”
  if (
    /\b(?:is|are)\s+(?:a|an|the)\b[\s\S]{0,60}\b(?:language|system|method|process|fund|insurance|pattern|protocol|framework|technique|practice|approach|standard)\b/i.test(
      sample
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Teaching-shaped fuel coverage — calculator input must include more than a definition.
 * What + (Why or How) + (Where or How) ≈ enough to teach without chipakna.
 */
export interface TeachingFuelCoverage {
  hasWhat: boolean;
  hasWhy: boolean;
  hasHow: boolean;
  hasWhere: boolean;
  dimensions: number;
  pass: boolean;
  missing: string[];
}

export function assessTeachingFuelCoverage(texts: string[]): TeachingFuelCoverage {
  const sample = texts.join("\n\n").slice(0, 120_000);
  const hasWhat =
    /\b(is|are|refers to|defined as|means)\s+(a|an|the)\b/i.test(sample) ||
    /\b(is|are)\s+(?:the|a|an)\s+\w+/i.test(sample);
  const hasWhy =
    /\b(because|purpose|helps|enables|allows|solves|matters|designed to|in order to|so that)\b/i.test(
      sample
    );
  const hasHow =
    /\b(works by|works when|process|mechanism|consists of|composed of|step|through|by using|operates)\b/i.test(
      sample
    );
  const hasWhere =
    /\b(used in|used for|for example|such as|including|application|in practice|real.?world)\b/i.test(
      sample
    );

  const missing: string[] = [];
  if (!hasWhat) missing.push("what");
  if (!hasWhy) missing.push("why");
  if (!hasHow) missing.push("how");
  if (!hasWhere) missing.push("where");

  const dimensions = [hasWhat, hasWhy, hasHow, hasWhere].filter(Boolean).length;
  // Need definition + at least one motivation/mechanism + preferably where — min: what + (why|how)
  const pass = hasWhat && (hasWhy || hasHow) && dimensions >= 3;

  return { hasWhat, hasWhy, hasHow, hasWhere, dimensions, pass, missing };
}

function isEncyclopedicBlock(block: ExternalFuelBlock): boolean {
  const host = (() => {
    try {
      return new URL(block.url).hostname.toLowerCase();
    } catch {
      return "";
    }
  })();
  return (
    host.includes("wikipedia.org") ||
    block.adapterName.includes("wikipedia") ||
    block.adapterName === "encyclopedia-ingest"
  );
}

/** Prefer encyclopedic / definition-bearing blocks first for composition. */
function prioritizeDefinitionalFuel(blocks: ExternalFuelBlock[]): ExternalFuelBlock[] {
  const encyclopedic = blocks.filter(isEncyclopedicBlock);
  const rest = blocks.filter((b) => !isEncyclopedicBlock(b));
  return [...encyclopedic, ...rest];
}

/** Pull RSS / crawl assets linked to topic — external URLs only. */
async function loadExternalAssetsForTopic(topicId: string): Promise<ExternalFuelBlock[]> {
  const sb = createAdminClient();
  const blocks: ExternalFuelBlock[] = [];
  const seenUrls = new Set<string>();

  const { data: mappings } = await sb
    .from("discovered_article_topics")
    .select("discovered_article_id")
    .eq("topic_id", topicId);

  const assetIds = (mappings ?? []).map((m) => m.discovered_article_id);
  if (assetIds.length === 0) return blocks;

  const { data: assets } = await sb
    .from(KNOWLEDGE_ASSET_TABLE)
    .select("*")
    .in("id", assetIds)
    .in("status", ["accepted", "pending"]);

  for (const row of assets ?? []) {
    const article = rowToDiscoveredArticleLogical(row as KnowledgeAssetRow);
    const meta = (article.metadata ?? {}) as Record<string, unknown>;

    if (isArchivedNewsAsset(meta)) continue;
    if (isValendiroOriginalAdapter(adapterFromMetadata(meta))) continue;
    if (!isExternalWorldUrl(article.url)) continue;
    if (seenUrls.has(article.url)) continue;

    const text = (article.content || article.summary || "").trim();
    if (text.length < 120) continue;

    seenUrls.add(article.url);
    blocks.push({
      text,
      url: article.url,
      adapterName: adapterFromMetadata(meta) || "rss-connector",
      source: "rss-ingest",
    });
  }

  return blocks;
}

/** Live fetch — authority + Wikipedia first; full open-web crawl only if still thin. */
async function liveCrawlForTopic(target: CatalogTopicTarget): Promise<ExternalFuelBlock[]> {
  const blocks: ExternalFuelBlock[] = [];
  const seen = new Set<string>();
  const push = (b: ExternalFuelBlock) => {
    if (!b.url || seen.has(b.url) || b.text.length < 120) return;
    seen.add(b.url);
    blocks.push(b);
  };

  // Fast path: known authority URLs (Wikipedia API preferred)
  const authorityList = getAuthorityUrlsForBrainFuel(target.slug);
  const orderedAuth = [
    ...authorityList.filter((a) => a.url.includes("wikipedia.org")),
    ...authorityList.filter((a) => !a.url.includes("wikipedia.org")),
  ];
  for (const auth of orderedAuth.slice(0, 4)) {
    try {
      if (auth.url.includes("wikipedia.org")) {
        const title = decodeURIComponent(new URL(auth.url).pathname.replace(/^\/wiki\//, ""));
        const extracted = await fetchWikipediaExtractByTitle(title, 8_000);
        if (extracted && extracted.content.length >= 500) {
          push({
            text: extracted.content,
            url: extracted.url,
            adapterName: "wikipedia-api",
            source: "live-crawl",
          });
        }
      } else {
        const page = await fetchHtmlPageText(auth.url, 8_000);
        if (page && page.content.length >= 500) {
          push({
            text: page.content,
            url: auth.url,
            adapterName: "authority-map",
            source: "live-crawl",
          });
        }
      }
    } catch {
      /* continue */
    }
    if (blocks.length >= 2) break;
  }

  // Full catalog crawl only when authority path was thin (may hit open web)
  if (blocks.length < 2) {
    const seed = getPhase1SeedTopic(target.slug);
    const crawled = await crawlCatalogTopicSources({
      slug: target.slug,
      title: target.title,
      categorySlug: target.categorySlug,
      subcategorySlug: target.subcategorySlug,
      subcategoryTitle: target.subcategoryTitle,
      primaryKeyword: seed?.primaryKeyword ?? null,
    });
    for (const s of crawled) {
      push({
        text: s.text,
        url: s.url,
        adapterName: s.adapterName,
        source: "live-crawl",
      });
    }
  }

  return blocks;
}

/**
 * Fast encyclopedic top-up via Wikipedia API (reuses crawlerFastPath helper).
 * Generic queries from title/slug/keyword — not topic-specific templates.
 */
async function fetchEncyclopedicDefinitionFuel(
  target: CatalogTopicTarget,
  excludeUrls: Set<string> = new Set()
): Promise<ExternalFuelBlock[]> {
  const seed = getPhase1SeedTopic(target.slug);
  const queries = [
    shortTopicLabel(target.title),
    seed?.primaryKeyword,
    target.title.replace(/^what is\s+/i, "").replace(/\?$/u, ""),
    target.slug.replace(/-fundamentals$/, "").replace(/-/g, " "),
    target.slug.replace(/-/g, " "),
  ].filter((q): q is string => Boolean(q && q.trim().length >= 2));

  const out: ExternalFuelBlock[] = [];
  const tried = new Set<string>();

  for (const q of queries) {
    const key = q.toLowerCase().trim();
    if (tried.has(key)) continue;
    tried.add(key);

    try {
      const searchRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=3&namespace=0&format=json&origin=*`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!searchRes.ok) continue;
      const searchData = (await searchRes.json()) as [string, string[], string[], string[]];
      const titles = searchData[1] ?? [];

      for (const title of titles) {
        const extracted = await fetchWikipediaExtractByTitle(title, 10_000);
        if (!extracted || extracted.content.length < 1500) continue;
        if (excludeUrls.has(extracted.url) || out.some((b) => b.url === extracted.url)) continue;

        out.push({
          text: extracted.content,
          url: extracted.url,
          adapterName: "wikipedia-api",
          source: "web-gather",
        });
        // Prefer one strong definition page per query; collect up to 2 total
        if (out.length >= 2) return out;
      }
    } catch {
      /* try next query */
    }
  }

  return out;
}

/**
 * When only one source exists, pull a second distinct encyclopedic page
 * so Brain always has >=2 external texts (definition + supporting context).
 */
async function ensureSecondFuelSource(
  target: CatalogTopicTarget,
  merged: ExternalFuelBlock[],
  seenUrls: Set<string>
): Promise<ExternalFuelBlock[]> {
  if (merged.length >= 2) return [];

  const extras = await fetchEncyclopedicDefinitionFuel(target, seenUrls);
  return extras.filter((b) => !seenUrls.has(b.url));
}

export interface ExternalFuelResult {
  blocks: ExternalFuelBlock[];
  texts: string[];
  sourceCount: number;
  liveCrawlCount: number;
  rssCount: number;
  hasDefinitionSignal: boolean;
  encyclopedicCount: number;
  teachingCoverage: TeachingFuelCoverage;
}

/**
 * Gather all brain fuel from the outside world for one topic.
 * Brain must never be fed from our own published pages or package rebuilds.
 *
 * Fuel-first supply line (CEO):
 * 1. Live crawler / authority / Wikipedia — definition-ready fuel for this topic
 * 2. Cached DB / RSS as supplement only
 * 3. Encyclopedic top-up until “What is X?” + teaching coverage (why/how/where)
 * 4. If fuel still cannot teach, publish path must skip — Brain must not chipak
 */
export async function gatherExternalWorldFuel(
  target: CatalogTopicTarget
): Promise<ExternalFuelResult> {
  const merged: ExternalFuelBlock[] = [];
  const seenUrls = new Set<string>();
  const hints = topicDefinitionHints(target);

  const minSources = 2;
  const minChars = PHASE_1_SEED_SLUG_SET.has(target.slug) ? 2500 : 3500;

  const push = (block: ExternalFuelBlock) => {
    if (!isExternalWorldUrl(block.url)) return;
    if (block.source !== "live-crawl" && block.source !== "web-gather" && !isExternalWorldAdapter(block.adapterName)) {
      return;
    }
    if (block.text.length < 120) return;
    if (seenUrls.has(block.url)) return;
    seenUrls.add(block.url);
    merged.push(block);
  };

  // 1. PRIMARY — crawler / authority / Wikipedia for this topic (fuel ready for Brain)
  for (const block of await liveCrawlForTopic(target)) {
    push(block);
  }

  // 2. Encyclopedic top-up until definition signal exists
  let hasDef = fuelHasDefinitionSignal(
    merged.map((b) => b.text),
    hints
  );
  if (!hasDef || !merged.some(isEncyclopedicBlock)) {
    for (const wiki of await fetchEncyclopedicDefinitionFuel(target, seenUrls)) {
      push(wiki);
    }
    hasDef = fuelHasDefinitionSignal(
      merged.map((b) => b.text),
      hints
    );
  }

  // 3. SUPPLEMENT — cached RSS/DB (never the only gate; never blocks crawl)
  for (const block of await loadExternalAssetsForTopic(target.topicId)) {
    push(block);
  }

  // 4. Hard minimum: >=2 sources + chars + definition; keep crawling if thin
  const chars = () => merged.reduce((s, b) => s + b.text.length, 0);
  const teachingOk = () => assessTeachingFuelCoverage(merged.map((b) => b.text)).pass;
  if (merged.length < minSources || chars() < minChars || !hasDef || !teachingOk()) {
    for (const wiki of await fetchEncyclopedicDefinitionFuel(target, seenUrls)) {
      push(wiki);
    }
    if (merged.length < 2) {
      for (const extra of await ensureSecondFuelSource(target, merged, seenUrls)) {
        push(extra);
      }
    }
    const authorityList = getAuthorityUrlsForBrainFuel(target.slug);
    for (const auth of authorityList) {
      if (merged.length >= minSources && chars() >= minChars && teachingOk()) break;
      if (seenUrls.has(auth.url)) continue;
      try {
        if (auth.url.includes("wikipedia.org")) {
          const title = decodeURIComponent(new URL(auth.url).pathname.replace(/^\/wiki\//, ""));
          const extracted = await fetchWikipediaExtractByTitle(title, 8_000);
          if (extracted && extracted.content.length >= 500) {
            push({
              text: extracted.content,
              url: extracted.url,
              adapterName: "wikipedia-api",
              source: "web-gather",
            });
          }
        } else {
          const page = await fetchHtmlPageText(auth.url, 8_000);
          if (page && page.content.length >= 500) {
            push({
              text: page.content,
              url: auth.url,
              adapterName: "authority-map",
              source: "live-crawl",
            });
          }
        }
      } catch {
        /* continue */
      }
    }
  }

  const ordered = prioritizeDefinitionalFuel(merged).slice(0, 8);
  const texts = ordered.map((b) => b.text);
  const teachingCoverage = assessTeachingFuelCoverage(texts);

  return {
    blocks: ordered,
    texts,
    sourceCount: ordered.length,
    liveCrawlCount: ordered.filter((b) => b.source === "live-crawl" || b.source === "web-gather").length,
    rssCount: ordered.filter((b) => b.source === "rss-ingest").length,
    hasDefinitionSignal: fuelHasDefinitionSignal(texts, hints),
    encyclopedicCount: ordered.filter(isEncyclopedicBlock).length,
    teachingCoverage,
  };
}
