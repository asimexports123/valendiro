import { createClient } from "@/lib/supabase/server";
import { DemandSourceResult, ExternalTrendInput } from "./demandSources";

export interface DiscoveredKeyword {
  keyword: string;
  searchIntent: "informational" | "commercial" | "transactional" | "navigational";
  languageCode: string;
  category: string;
  volumeScore: number;
  trendScore: number;
  competitionScore: number;
  freshnessScore: number;
  source: string;
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

function detectIntent(keyword: string): DiscoveredKeyword["searchIntent"] {
  const lower = keyword.toLowerCase();
  if (/(buy|cheap|deal|price|discount|purchase|order|shop)/.test(lower)) return "transactional";
  if (/(best|top|review|compare|vs|versus|recommend)/.test(lower)) return "commercial";
  if (/(how to|what is|why|guide|tutorial|learn|meaning|definition)/.test(lower)) return "informational";
  return "informational";
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

    return suggestions.slice(0, 20).map((keyword: string) => {
      const scores = scoreFromKeyword(keyword);
      return {
        keyword,
        searchIntent: detectIntent(keyword),
        languageCode,
        category: detectCategory(keyword),
        volumeScore: scores.volume,
        trendScore: 50,
        competitionScore: scores.competition,
        freshnessScore: 60,
        source: "google_autocomplete",
      };
    });
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
    return keywords.map((keyword) => ({
      keyword,
      searchIntent: detectIntent(keyword),
      languageCode: "en",
      category: detectCategory(keyword),
      volumeScore: 70,
      trendScore: 70,
      competitionScore: 60,
      freshnessScore: 70,
      source: "google_trends",
    }));
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

    return items.slice(0, 30).map((item: { article: string; views: number }) => {
      const keyword = item.article.replace(/_/g, " ");
      const scores = scoreFromKeyword(keyword);
      return {
        keyword,
        searchIntent: "informational",
        languageCode,
        category: detectCategory(keyword),
        volumeScore: Math.min(100, Math.round(60 + Math.log10(item.views || 1) * 5)),
        trendScore: Math.min(100, Math.round(50 + Math.log10(item.views || 1) * 4)),
        competitionScore: scores.competition,
        freshnessScore: 80,
        source: "wikipedia_pageviews",
      };
    });
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
        results.push({
          keyword: title,
          searchIntent: detectIntent(title),
          languageCode,
          category: detectCategory(title),
          volumeScore: scores.volume,
          trendScore: 60,
          competitionScore: scores.competition,
          freshnessScore: 90,
          source: "reddit_discussions",
        });
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
  const supabase = await createClient();
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
          affiliatePotentialScore: k.searchIntent === "transactional" || k.searchIntent === "commercial" ? 80 : 30,
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
          metadata: { discovered_by: "external_demand_sources" },
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
