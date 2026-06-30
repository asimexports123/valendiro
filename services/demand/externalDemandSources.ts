import { createAdminClient } from "@/lib/supabase/admin";
import { DemandSourceResult, ExternalTrendInput } from "./demandSources";
import { fetchStackOverflowQuestions, fetchGitHubTrending, detectInternalContentGaps } from "./additionalDemandSources";
import { DemandIntent, DemandQualityScore, isPublishable, scoreDemandKeyword } from "./topicQualityEngine";
import {
  getActiveCategories,
  getAllActiveSeedQueries,
  getAllActiveSubreddits,
  detectCategoryFromKeyword,
  type CategoryDefinition,
} from "./categoryConfig";

export interface DiscoveredKeyword {
  keyword: string;
  searchIntent: DemandIntent;
  languageCode: string;
  category: string;
  volumeScore: number;
  trendScore: number;
  competitionScore: number;
  freshnessScore: number;
  source: string;
  qualityScore: number;
  evergreenScore: number;
  quality: DemandQualityScore;
}

// Category detection is now fully delegated to categoryConfig.ts
// This ensures a single source of truth driven by DB settings

function scoreKeyword(
  keyword: string,
  source: string,
  languageCode: string,
  baseVolume: number,
  baseTrend: number,
  baseCompetition: number,
  baseFreshness: number,
  activeCategories: CategoryDefinition[]
): DiscoveredKeyword | null {
  const quality = scoreDemandKeyword(keyword);
  if (!isPublishable(quality)) return null;
  const targetKeyword = quality.knowledgeTopic || quality.normalizedKeyword;
  const categoryMatch = detectCategoryFromKeyword(targetKeyword, activeCategories);
  return {
    keyword: targetKeyword,
    searchIntent: quality.intent,
    languageCode,
    category: categoryMatch.label,
    volumeScore: baseVolume,
    trendScore: baseTrend,
    competitionScore: baseCompetition,
    freshnessScore: baseFreshness,
    source,
    qualityScore: quality.qualityScore,
    evergreenScore: quality.evergreenScore,
    quality,
  };
}

function scoreFromKeyword(keyword: string): { volume: number; competition: number } {
  const words = keyword.split(/\s+/).length;
  const volume = Math.max(20, Math.min(95, 80 - words * 8 + keyword.length * 0.5));
  const competition = Math.max(20, Math.min(90, 30 + words * 10));
  return { volume: Math.round(volume), competition: Math.round(competition) };
}

export async function fetchGoogleAutocomplete(
  seed: string,
  languageCode = "en",
  activeCategories?: CategoryDefinition[]
): Promise<DiscoveredKeyword[]> {
  const cats = activeCategories ?? await getActiveCategories();
  try {
    const endpoint = `https://suggestqueries.google.com/complete/search?client=firefox&hl=${languageCode}&q=${encodeURIComponent(seed)}`;
    const response = await fetch(endpoint, { next: { revalidate: 0 } });
    if (!response.ok) return [];

    const data = await response.json();
    const suggestions = Array.isArray(data) ? data[1] || [] : [];
    if (!Array.isArray(suggestions)) return [];

    return suggestions
      .slice(0, 20)
      .map((keyword: string) => {
        const scores = scoreFromKeyword(keyword);
        return scoreKeyword(keyword, "google_autocomplete", languageCode, scores.volume, 50, scores.competition, 60, cats);
      })
      .filter((k): k is DiscoveredKeyword => k !== null);
  } catch {
    return [];
  }
}

export async function fetchGoogleTrends(
  keywords: string[],
  activeCategories?: CategoryDefinition[]
): Promise<DiscoveredKeyword[]> {
  if (!process.env.GOOGLE_TRENDS_API_KEY) return [];
  const cats = activeCategories ?? await getActiveCategories();
  try {
    return keywords
      .map((keyword) => scoreKeyword(keyword, "google_trends", "en", 70, 70, 60, 70, cats))
      .filter((k): k is DiscoveredKeyword => k !== null);
  } catch {
    return [];
  }
}

export async function fetchWikipediaPageviews(languageCode = "en"): Promise<DiscoveredKeyword[]> {
  // Wikipedia trending is mostly news/celebrity — we intentionally limit this source
  // by running every keyword through category detection and rejecting out-of-scope ones.
  const cats = await getActiveCategories();
  try {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");

    const endpoint = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/${languageCode}.wikipedia.org/all-access/${year}/${month}/${day}`;
    const response = await fetch(endpoint, { next: { revalidate: 86400 } });
    if (!response.ok) return [];

    const data = await response.json();
    const items = data.items?.[0]?.articles || [];
    if (!Array.isArray(items)) return [];

    return items
      .slice(0, 50)
      .map((item: { article: string; views: number }) => {
        const keyword = item.article.replace(/_/g, " ");
        // Pre-filter: only keep if it matches an active V1 category
        const match = detectCategoryFromKeyword(keyword, cats);
        if (!match.inScope) return null;
        const scores = scoreFromKeyword(keyword);
        return scoreKeyword(
          keyword,
          "wikipedia_pageviews",
          languageCode,
          Math.min(100, Math.round(60 + Math.log10(item.views || 1) * 5)),
          Math.min(100, Math.round(50 + Math.log10(item.views || 1) * 4)),
          scores.competition,
          80,
          cats
        );
      })
      .filter((k): k is DiscoveredKeyword => k !== null);
  } catch {
    return [];
  }
}

export async function fetchRedditDiscussions(
  subreddits?: string[],
  languageCode = "en"
): Promise<DiscoveredKeyword[]> {
  // Use active-category subreddits from config, not a hardcoded list
  const cats = await getActiveCategories();
  const activeSubreddits = subreddits ?? (await getAllActiveSubreddits()).map((s) => s.subreddit);
  const results: DiscoveredKeyword[] = [];

  for (const subreddit of activeSubreddits.slice(0, 10)) {
    try {
      const endpoint = `https://www.reddit.com/r/${subreddit}/hot.json?limit=10`;
      const response = await fetch(endpoint, {
        headers: { "User-Agent": "KnowledgeOS-DemandBot/1.0" },
        next: { revalidate: 86400 },
      });
      if (!response.ok) continue;

      const data = await response.json();
      const posts = data.data?.children || [];
      if (!Array.isArray(posts)) continue;

      for (const post of posts) {
        const title = post.data?.title as string;
        if (!title || title.length > 120) continue;
        const scores = scoreFromKeyword(title);
        const scored = scoreKeyword(title, "reddit_discussions", languageCode, scores.volume, 60, scores.competition, 90, cats);
        if (scored) results.push(scored);
      }
    } catch {
      continue;
    }
  }
  return results.slice(0, 50);
}

export async function captureAllExternalDemand(): Promise<DemandSourceResult> {
  const supabase = createAdminClient();
  let inserted = 0;
  const errors: string[] = [];

  // Load active categories + their seed queries from DB config
  const cats = await getActiveCategories();
  const seedEntries = await getAllActiveSeedQueries();
  const seedKeywords = seedEntries.map((s) => s.query);

  // Run additional structured sources in parallel before the keyword loop
  const [soResult, ghResult, gapResult] = await Promise.allSettled([
    fetchStackOverflowQuestions("en"),
    fetchGitHubTrending("en"),
    detectInternalContentGaps("en"),
  ]);
  if (soResult.status === "fulfilled") inserted += soResult.value.inserted;
  else errors.push(`Stack Overflow: ${soResult.reason}`);
  if (ghResult.status === "fulfilled") inserted += ghResult.value.inserted;
  else errors.push(`GitHub Trending: ${ghResult.reason}`);
  if (gapResult.status === "fulfilled") inserted += gapResult.value.inserted;
  else errors.push(`Internal gaps: ${gapResult.reason}`);

  const sources: (() => Promise<DiscoveredKeyword[]>)[] = [
    () => Promise.all(seedKeywords.slice(0, 20).map((s) => fetchGoogleAutocomplete(s, "en", cats))).then((r) => r.flat()),
    () => fetchGoogleTrends(seedKeywords, cats),
    () => fetchWikipediaPageviews(),
    () => fetchRedditDiscussions(undefined, "en"),
  ];

  for (const source of sources) {
    try {
      const keywords = await source();
      for (const k of keywords) {
        // Determine if keyword is in-scope for active categories
        const categoryMatch = detectCategoryFromKeyword(k.keyword, cats);

        const input: ExternalTrendInput = {
          keyword: k.keyword,
          volumeScore: k.volumeScore,
          trendScore: k.trendScore,
          seasonalScore: 50,
          affiliatePotentialScore: k.quality.commercialIntent >= 60 ? 80 : 30,
          competitionScore: k.competitionScore,
          source: k.source,
          signalType: "trend",
          languageCode: k.languageCode as any,
        };

        const { error } = await supabase.from("demand_signals").insert({
          signal_type: input.signalType,
          source: input.source,
          keyword: input.keyword,
          language_code: input.languageCode ?? "en",
          volume_score: input.volumeScore,
          trend_score: input.trendScore,
          seasonal_score: input.seasonalScore,
          affiliate_potential_score: input.affiliatePotentialScore,
          competition_score: input.competitionScore,
          search_intent: k.searchIntent,
          category: categoryMatch.label,
          freshness_score: k.freshnessScore,
          metadata: {
            discovered_by: "external_demand_sources",
            quality: k.quality,
            in_scope: categoryMatch.inScope,
            category_slug: categoryMatch.slug,
            matched_keyword: categoryMatch.matchedKeyword,
          },
        });

        if (!error) inserted++;
        else errors.push(error.message);
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "Unknown external demand error");
    }
  }

  return { inserted, error: errors.length > 0 ? errors.join("; ") : null };
}
