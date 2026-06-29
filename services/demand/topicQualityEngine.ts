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
  const normalized = keyword.trim().replace(/\s+/g, " ");
  const block = isBlocked(normalized);
  const intent = block.blocked ? "blocked" : detectIntent(normalized);
  const evergreen = calculateEvergreenScore(normalized, intent);
  const knowledgeTopic = mapToKnowledgeTopic(normalized);
  const educational =
    intent === "educational" || intent === "how_to" || intent === "reference" ? 80 : intent === "problem_solving" ? 70 : 40;
  const commercial =
    intent === "buying_intent" || intent === "commercial_investigation" || intent === "comparison" ? 80 : 30;
  const problemSolving = intent === "problem_solving" || intent === "how_to" ? 80 : 50;
  const knowledgeGap = knowledgeTopic ? 60 : 40;
  const topicalAuthority =
    intent === "educational" || intent === "how_to" || intent === "comparison" || intent === "problem_solving" ? 70 : 40;
  const quality = Math.round(
    evergreen * 0.25 +
      educational * 0.2 +
      commercial * 0.15 +
      problemSolving * 0.15 +
      knowledgeGap * 0.1 +
      topicalAuthority * 0.15
  );
  return {
    intent,
    evergreenScore: evergreen,
    educationalValue: educational,
    commercialIntent: commercial,
    problemSolvingValue: problemSolving,
    knowledgeGapScore: knowledgeGap,
    topicalAuthorityScore: topicalAuthority,
    qualityScore: quality,
    blockedReason: block.blocked ? block.reason : null,
    normalizedKeyword: normalized,
    knowledgeTopic,
  };
}

export function isPublishable(score: DemandQualityScore, qualityThreshold = 50): boolean {
  return !score.blockedReason && score.qualityScore >= qualityThreshold && score.evergreenScore >= 30;
}
