import { runKeywordResearch, type KeywordResearchResult } from "./keywordResearchEngine";

export type DemandIntent =
  | "informational"
  | "educational"
  | "how_to"
  | "buying_intent"
  | "commercial_investigation"
  | "comparison"
  | "problem_solving"
  | "reference"
  | "news"
  | "entertainment"
  | "blocked";

// Re-export so callers can use the full research result
export type { KeywordResearchResult } from "./keywordResearchEngine";
export { runKeywordResearch } from "./keywordResearchEngine";

export interface DemandQualityScore {
  intent: DemandIntent;
  evergreenScore: number;
  educationalValue: number;
  commercialIntent: number;
  problemSolvingValue: number;
  knowledgeGapScore: number;
  topicalAuthorityScore: number;
  qualityScore: number;
  blockedReason: string | null;
  normalizedKeyword: string;
  knowledgeTopic: string | null;
  entityConfidence: "high" | "medium" | "low";
}

// Known unambiguous entities — can be published with confidence
const HIGH_CONFIDENCE_ENTITIES = new Set([
  "als", "amyotrophic lateral sclerosis", "cern", "nasa", "who", "nhs", "fbi", "cia", "irs",
  "photosynthesis", "mitosis", "dna", "rna", "gravity", "evolution", "democracy", "capitalism",
  "blockchain", "machine learning", "artificial intelligence", "neural network",
  "climate change", "global warming", "inflation", "recession", "compound interest",
  "vitamin d", "cortisol", "hantavirus", "tuberculosis", "diabetes", "alzheimer",
  "javascript", "python", "typescript", "react", "nodejs", "sql", "linux", "kubernetes",
  "guitar capo", "capo", "tuner", "chord", "arpeggio",
  "strunk and white", "the elements of style",
]);

// Patterns that indicate multi-word, intent-clear queries (inherently less ambiguous)
function assessEntityConfidence(keyword: string): "high" | "medium" | "low" {
  const lower = keyword.toLowerCase().trim();
  const wordCount = lower.split(/\s+/).length;

  if (HIGH_CONFIDENCE_ENTITIES.has(lower)) return "high";

  // Multi-word queries with clear intent prefix are medium confidence
  if (wordCount >= 3) return "medium";

  // Two-word queries: usually specific enough
  if (wordCount === 2) return "medium";

  // Single-word queries without a known entity are inherently ambiguous
  if (wordCount === 1) return "low";

  return "medium";
}

const BLOCKED_PATTERNS = [
  /^special:/i,
  /^wikipedia:/i,
  /^main page$/i,
  /^featured/i,
  /^search$/i,
  /^\.xxx$/i,
  /death/i,
  /obituary/i,
  /breaking news/i,
  /just died/i,
  /gossip/i,
  /scandal/i,
  /leaked/i,
  /nude/i,
  /^\d{4}$/,
  /near me/i,
  /\bopen now\b/i,
  /\bhours\b/i,
  /\blocation\b/i,
  /\bdirections\b/i,
  /^best buy$/i,
  /\brestaurant(s)?\b/i,
  /\bgerrymandering\b/i,
  /\belection\b/i,
  /\bpolitics\b/i,
  /\bpolitician\b/i,
  /\bworld cup \d{4}\b/i,
  /\bfifa \d{4}\b/i,
  /\bsuper bowl \d{4}\b/i,
  /\boscars \d{4}\b/i,
  /\bawards \d{4}\b/i,
  /\b\d{4} \w+ (championship|cup|league|season)\b/i,
  /\bbet awards\b/i,
  /^my ip$/i,
  /what is my/i,
];

const CELEBRITY_NAMES = new Set([
  "shakira",
  "cristiano ronaldo",
  "ronaldo",
  "messi",
  "beyonce",
  "taylor swift",
  "kim kardashian",
  "kanye west",
  "brad pitt",
  "angelina jolie",
  "tom cruise",
  "leonardo dicaprio",
  "kylie jenner",
  "donald trump",
  "joe biden",
  "narendra modi",
]);

const KNOWLEDGE_TOPIC_MAP: Record<string, string> = {
  shakira: "Latin Pop Music",
  "cristiano ronaldo": "Football Training",
  ronaldo: "Football Training",
  messi: "Football Training",
  "house of the dragon": "Fantasy Literature",
  "game of thrones": "Fantasy Literature",
  "stranger things": "TV Production",
  "the witcher": "Fantasy Literature",
  "breaking bad": "TV Production",
};

const HIGH_EVERGREEN_KEYWORDS = [
  "how to",
  "best",
  "guide",
  "tutorial",
  "comparison",
  "compare",
  "vs",
  "versus",
  "faq",
  "what is",
  "definition",
  "meaning",
  "maintenance",
  "safety tips",
  "troubleshooting",
  "beginner",
  "learn",
  "course",
  "study",
  "exam",
  "degree",
];

const LOW_EVERGREEN_KEYWORDS = [
  "news",
  "breaking",
  "today",
  "latest",
  "update",
  "now",
  "just",
  "died",
  "death",
  "obituary",
  "celebrity",
  "gossip",
  "scandal",
  "leaked",
  "viral",
  "trending",
  "meme",
  "tiktok",
  "twitter",
  "x post",
  "reddit thread",
];

function isBlocked(keyword: string): { blocked: boolean; reason: string | null } {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(keyword)) {
      return { blocked: true, reason: `Blocked pattern: ${pattern.source}` };
    }
  }
  return { blocked: false, reason: null };
}

function detectIntent(keyword: string): DemandIntent {
  const lower = keyword.toLowerCase();
  if (lower.includes("how to") || lower.includes("how do") || lower.includes("tutorial")) return "how_to";
  if (lower.includes("best") || lower.includes("top") || lower.includes("review") || lower.includes("rating")) return "commercial_investigation";
  if (lower.includes("compare") || lower.includes("vs") || lower.includes("versus")) return "comparison";
  if (lower.includes("buy") || lower.includes("price") || lower.includes("cost") || lower.includes("deal")) return "buying_intent";
  if (lower.includes("problem") || lower.includes("fix") || lower.includes("error") || lower.includes("troubleshoot")) return "problem_solving";
  if (lower.includes("what is") || lower.includes("definition") || lower.includes("meaning") || lower.includes("reference")) return "reference";
  if (lower.includes("news") || lower.includes("breaking") || lower.includes("latest")) return "news";
  if (lower.includes("learn") || lower.includes("course") || lower.includes("education") || lower.includes("study")) return "educational";
  if (CELEBRITY_NAMES.has(lower)) return "entertainment";
  return "informational";
}

function calculateEvergreenScore(keyword: string, intent: DemandIntent): number {
  const lower = keyword.toLowerCase();
  let score = 50;
  for (const kw of HIGH_EVERGREEN_KEYWORDS) if (lower.includes(kw)) score += 15;
  for (const kw of LOW_EVERGREEN_KEYWORDS) if (lower.includes(kw)) score -= 25;
  if (intent === "educational" || intent === "how_to" || intent === "reference" || intent === "comparison") score += 15;
  if (intent === "news" || intent === "entertainment") score -= 30;
  if (intent === "buying_intent" || intent === "commercial_investigation") score += 5;
  return Math.max(0, Math.min(100, score));
}

function mapToKnowledgeTopic(keyword: string): string | null {
  const lower = keyword.toLowerCase();
  if (KNOWLEDGE_TOPIC_MAP[lower]) return KNOWLEDGE_TOPIC_MAP[lower];
  const knowledgeDomains = ["music", "football", "health", "finance", "technology", "science", "history", "programming", "travel", "business"];
  if (knowledgeDomains.some((d) => lower.includes(d))) return null;
  return null;
}

export function scoreDemandKeyword(keyword: string): DemandQualityScore {
  const research = runKeywordResearch(keyword);
  const normalized = research.normalizedKeyword;

  // Map new intent to legacy DemandIntent
  const intentMap: Record<string, DemandIntent> = {
    informational: "informational",
    educational: "educational",
    how_to: "how_to",
    commercial: "buying_intent",
    buying_guide: "commercial_investigation",
    comparison: "comparison",
    local: "blocked",
    news: "news",
    entertainment: "entertainment",
    blocked: "blocked",
  };
  const intent: DemandIntent = intentMap[research.searchIntent] ?? "informational";

  const knowledgeTopic = research.detectedEntity;
  const entityConfidence = research.entityConfidence;

  return {
    intent,
    evergreenScore: research.evergreenScore,
    educationalValue: intent === "educational" || intent === "how_to" || intent === "reference" ? 80 : 40,
    commercialIntent: research.businessValueScore,
    problemSolvingValue: intent === "problem_solving" || intent === "how_to" ? 80 : 50,
    knowledgeGapScore: research.knowledgeGapScore,
    topicalAuthorityScore: research.rankingOpportunityScore,
    qualityScore: research.finalDecisionScore,
    blockedReason: research.decision === "reject" ? research.decisionReason : null,
    normalizedKeyword: normalized,
    knowledgeTopic,
    entityConfidence,
  };
}

export function isPublishable(score: DemandQualityScore): boolean {
  if (score.blockedReason) return false;
  if (score.qualityScore < 58) return false;
  if (score.evergreenScore < 30) return false;
  if (score.intent === "news" || score.intent === "entertainment" || score.intent === "blocked") return false;
  if (score.entityConfidence === "low") return false;
  return true;
}
