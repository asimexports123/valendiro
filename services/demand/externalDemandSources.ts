import { createAdminClient } from "@/lib/supabase/admin";
import { DemandSourceResult, ExternalTrendInput } from "./demandSources";
import { DemandIntent, DemandQualityScore, isPublishable, scoreDemandKeyword } from "./topicQualityEngine";

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

const DEFAULT_CATEGORIES = [
  "Technology", "Finance", "Home Improvement", "Health", "Education", "Travel",
  "Business", "AI", "Programming", "Legal", "Automotive", "General",
];

function detectCategory(keyword: string): string {
  const lower = keyword.toLowerCase();
  const map: Record<string, string[]> = {
    Technology: ["software", "app", "phone", "laptop", "tech", "computer", "gadget", "internet"],
    Finance: ["money", "invest", "loan", "credit", "stock", "crypto", "finance", "banking", "budget"],
    "Home Improvement": ["clean", "repair", "diy", "home", "garden", "kitchen", "bathroom", "furniture"],
    Health: ["health", "fitness", "diet", "workout", "medicine", "mental health", "nutrition"],
    Education: ["learn", "course", "study", "exam", "degree", "university", "school", "tutorial"],
    Travel: ["travel", "hotel", "flight", "vacation", "trip", "destination", "tourism"],
    Business: ["business", "startup", "marketing", "sales", "entrepreneur", "company"],
    AI: ["ai", "artificial intelligence", "machine learning", "chatgpt", "gpt", "llm"],
    Programming: ["code", "programming", "developer", "python", "javascript", "web development", "api"],
    Legal: ["law", "legal", "contract", "court", "lawyer", "tax", "regulation"],
    Automotive: ["car", "vehicle", "automotive", "driving", "engine", "motorcycle"],
  };

  for (const [category, keywords] of Object.entries(map)) {
    if (keywords.some((k) => lower.includes(k))) return category;
  }
  return "General";
}

function scoreKeyword(
  keyword: string,
  source: string,
  languageCode: string,
  baseVolume: number,
  baseTrend: number,
  baseCompetition: number,
  baseFreshness: number
): DiscoveredKeyword | null {
  const quality = scoreDemandKeyword(keyword);
  if (!isPublishable(quality)) return null;
  const targetKeyword = quality.knowledgeTopic || quality.normalizedKeyword;
  return {
    keyword: targetKeyword,
    searchIntent: quality.intent,
    languageCode,
    category: detectCategory(targetKeyword),
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

export async function fetchGoogleAutocomplete(seed: string, languageCode = "en"): Promise<DiscoveredKeyword[]> {
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
        return scoreKeyword(keyword, "google_autocomplete", languageCode, scores.volume, 50, scores.competition, 60);
      })
      .filter((k): k is DiscoveredKeyword => k !== null);
  } catch {
    return [];
  }
}

export async function fetchGoogleTrends(keywords: string[]): Promise<DiscoveredKeyword[]> {
  // Google Trends official API requires OAuth and is not free at scale.
  // This is a future-ready stub. Connect serpapi/google-trends-api here if needed.
  if (!process.env.GOOGLE_TRENDS_API_KEY) return [];

  try {
    // Placeholder for real Google Trends API integration.
    return keywords
      .map((keyword) => scoreKeyword(keyword, "google_trends", "en", 70, 70, 60, 70))
      .filter((k): k is DiscoveredKeyword => k !== null);
  } catch {
    return [];
  }
}

export async function fetchWikipediaPageviews(languageCode = "en"): Promise<DiscoveredKeyword[]> {
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
      .slice(0, 30)
      .map((item: { article: string; views: number }) => {
        const keyword = item.article.replace(/_/g, " ");
        const scores = scoreFromKeyword(keyword);
        return scoreKeyword(
          keyword,
          "wikipedia_pageviews",
          languageCode,
          Math.min(100, Math.round(60 + Math.log10(item.views || 1) * 5)),
          Math.min(100, Math.round(50 + Math.log10(item.views || 1) * 4)),
          scores.competition,
          80
        );
      })
      .filter((k): k is DiscoveredKeyword => k !== null);
  } catch {
    return [];
  }
}

export async function fetchRedditDiscussions(subreddits: string[] = ["technology", "personalfinance", "lifeprotips"], languageCode = "en"): Promise<DiscoveredKeyword[]> {
  const results: DiscoveredKeyword[] = [];
  for (const subreddit of subreddits.slice(0, 3)) {
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
        const scored = scoreKeyword(title, "reddit_discussions", languageCode, scores.volume, 60, scores.competition, 90);
        if (scored) results.push(scored);
      }
    } catch {
      continue;
    }
  }
  return results.slice(0, 30);
}

export async function captureAllExternalDemand(
  seedKeywords: string[] = ["how to", "best", "what is", "guide"]
): Promise<DemandSourceResult> {
  const supabase = createAdminClient();
  let inserted = 0;
  const errors: string[] = [];

  const sources: (() => Promise<DiscoveredKeyword[]>)[] = [
    () => Promise.all(seedKeywords.map((s) => fetchGoogleAutocomplete(s))).then((r) => r.flat()),
    () => fetchGoogleTrends(seedKeywords),
    () => fetchWikipediaPageviews(),
    () => fetchRedditDiscussions(),
  ];

  for (const source of sources) {
    try {
      const keywords = await source();
      for (const k of keywords) {
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
          category: k.category,
          freshness_score: k.freshnessScore,
          metadata: { discovered_by: "external_demand_sources", quality: k.quality },
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
