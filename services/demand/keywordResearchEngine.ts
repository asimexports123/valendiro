/**
 * Keyword Research & Ranking Decision Engine
 *
 * Every keyword passes through this engine before any content is created.
 * The engine produces a structured KeywordResearchResult with scores across
 * 9 dimensions and a single finalDecisionScore that gates publishing.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type SearchIntent =
  | "informational"
  | "educational"
  | "how_to"
  | "commercial"
  | "buying_guide"
  | "comparison"
  | "local"
  | "news"
  | "entertainment"
  | "blocked";

export type EntityConfidenceLevel = "high" | "medium" | "low";
export type PublishDecision = "publish" | "backlog" | "reject";
export type CompetitionLevel = "low" | "medium" | "high" | "very_high";

export interface KeywordResearchResult {
  keyword: string;
  normalizedKeyword: string;

  // Dimension scores (0–100)
  searchDemandScore: number;
  competitionScore: number;
  rankingOpportunityScore: number;
  evergreenScore: number;
  businessValueScore: number;
  knowledgeGapScore: number;
  entityConfidenceScore: number;

  // Derived fields
  searchIntent: SearchIntent;
  entityConfidence: EntityConfidenceLevel;
  competitionLevel: CompetitionLevel;
  detectedEntity: string | null;

  // Penalties
  newsPenalty: number;
  celebrityPenalty: number;
  localPenalty: number;

  // Final decision
  finalDecisionScore: number;
  decision: PublishDecision;
  decisionReason: string;

  // For admin report
  breakdown: Record<string, number | string>;
}

// ─── Data: Known Entities ─────────────────────────────────────────────────────

const KNOWN_ENTITIES: Record<string, { label: string; confidence: EntityConfidenceLevel; businessValue: number }> = {
  // Medical
  "als": { label: "ALS (Amyotrophic Lateral Sclerosis)", confidence: "high", businessValue: 60 },
  "amyotrophic lateral sclerosis": { label: "ALS (Amyotrophic Lateral Sclerosis)", confidence: "high", businessValue: 60 },
  "alzheimer": { label: "Alzheimer's Disease", confidence: "high", businessValue: 65 },
  "alzheimers disease": { label: "Alzheimer's Disease", confidence: "high", businessValue: 65 },
  "diabetes": { label: "Diabetes", confidence: "high", businessValue: 70 },
  "hantavirus": { label: "Hantavirus", confidence: "high", businessValue: 55 },
  "cortisol": { label: "Cortisol (stress hormone)", confidence: "high", businessValue: 65 },
  "tuberculosis": { label: "Tuberculosis", confidence: "high", businessValue: 60 },
  "vitamin d": { label: "Vitamin D", confidence: "high", businessValue: 75 },
  "vitamin d deficiency": { label: "Vitamin D Deficiency", confidence: "high", businessValue: 75 },

  // Science / Education
  "cern": { label: "CERN (European Organization for Nuclear Research)", confidence: "high", businessValue: 55 },
  "nasa": { label: "NASA", confidence: "high", businessValue: 55 },
  "photosynthesis": { label: "Photosynthesis", confidence: "high", businessValue: 60 },
  "mitosis": { label: "Mitosis", confidence: "high", businessValue: 60 },
  "dna": { label: "DNA (Deoxyribonucleic Acid)", confidence: "high", businessValue: 60 },
  "rna": { label: "RNA (Ribonucleic Acid)", confidence: "high", businessValue: 60 },
  "evolution": { label: "Evolution (Biology)", confidence: "high", businessValue: 55 },
  "gravity": { label: "Gravity (Physics)", confidence: "high", businessValue: 55 },
  "climate change": { label: "Climate Change", confidence: "high", businessValue: 60 },
  "global warming": { label: "Global Warming", confidence: "high", businessValue: 60 },

  // Finance / Economics
  "inflation": { label: "Inflation (Economics)", confidence: "high", businessValue: 80 },
  "recession": { label: "Economic Recession", confidence: "high", businessValue: 75 },
  "compound interest": { label: "Compound Interest", confidence: "high", businessValue: 85 },
  "index fund": { label: "Index Fund", confidence: "high", businessValue: 90 },
  "index funds": { label: "Index Funds", confidence: "high", businessValue: 90 },
  "etf": { label: "ETF (Exchange-Traded Fund)", confidence: "high", businessValue: 90 },
  "roth ira": { label: "Roth IRA", confidence: "high", businessValue: 90 },
  "dollar cost averaging": { label: "Dollar Cost Averaging", confidence: "high", businessValue: 85 },
  "credit score": { label: "Credit Score", confidence: "high", businessValue: 85 },

  // Technology / Programming
  "javascript": { label: "JavaScript (programming language)", confidence: "high", businessValue: 85 },
  "python": { label: "Python (programming language)", confidence: "high", businessValue: 85 },
  "typescript": { label: "TypeScript", confidence: "high", businessValue: 85 },
  "react": { label: "React (JavaScript library)", confidence: "high", businessValue: 85 },
  "nodejs": { label: "Node.js", confidence: "high", businessValue: 85 },
  "node.js": { label: "Node.js", confidence: "high", businessValue: 85 },
  "sql": { label: "SQL (Structured Query Language)", confidence: "high", businessValue: 80 },
  "linux": { label: "Linux (operating system)", confidence: "high", businessValue: 80 },
  "kubernetes": { label: "Kubernetes", confidence: "high", businessValue: 80 },
  "docker": { label: "Docker", confidence: "high", businessValue: 80 },
  "machine learning": { label: "Machine Learning", confidence: "high", businessValue: 85 },
  "artificial intelligence": { label: "Artificial Intelligence", confidence: "high", businessValue: 85 },
  "neural network": { label: "Neural Network", confidence: "high", businessValue: 80 },
  "blockchain": { label: "Blockchain Technology", confidence: "high", businessValue: 75 },
  "api": { label: "API (Application Programming Interface)", confidence: "high", businessValue: 80 },
  "git": { label: "Git (version control)", confidence: "high", businessValue: 80 },

  // Music / Arts
  "guitar capo": { label: "Guitar Capo (music accessory)", confidence: "high", businessValue: 70 },
  "capo": { label: "Guitar Capo (music accessory)", confidence: "high", businessValue: 70 },
  "chord": { label: "Musical Chord", confidence: "high", businessValue: 65 },
  "arpeggio": { label: "Arpeggio (music technique)", confidence: "high", businessValue: 65 },

  // Literature / Writing
  "strunk and white": { label: "The Elements of Style (Strunk & White)", confidence: "high", businessValue: 65 },
  "the elements of style": { label: "The Elements of Style (Strunk & White)", confidence: "high", businessValue: 65 },

  // Concepts
  "democracy": { label: "Democracy (political system)", confidence: "high", businessValue: 55 },
  "capitalism": { label: "Capitalism (economic system)", confidence: "high", businessValue: 60 },
  "stoicism": { label: "Stoicism (philosophy)", confidence: "high", businessValue: 65 },
};

// ─── Data: Celebrity / Entertainment signals ───────────────────────────────

const CELEBRITY_PATTERNS = [
  /\b(shakira|beyonce|taylor swift|kim kardashian|kanye west|brad pitt|angelina jolie|tom cruise|kylie jenner|donald trump|joe biden|narendra modi|elon musk|jeff bezos|mark zuckerberg|cristiano ronaldo|lionel messi)\b/i,
];

// ─── Data: Local-intent patterns ──────────────────────────────────────────────

const LOCAL_PATTERNS = [
  /near me/i, /\bopen now\b/i, /\bhours\b/i, /\blocation\b/i,
  /\bdirections\b/i, /\bin [a-z\s]+(city|town|county|state)\b/i,
  /\brestaurant(s)?\b/i, /\bplumber\b/i, /\bdentist\b/i,
];

// ─── Data: News/Temporal patterns ─────────────────────────────────────────────

const NEWS_PATTERNS = [
  /\b(today|tonight|this week|this month|right now|just now|breaking|latest)\b/i,
  /\b(2024|2025|2026|2027) (news|update|season|election|award|championship)\b/i,
  /\b(oscar|emmy|grammy|bet award|billboard|vma)s?\b/i,
  /\b(world cup|super bowl|olympics) \d{4}\b/i,
];

// ─── Data: Blocked hard patterns ──────────────────────────────────────────────

const BLOCKED_PATTERNS = [
  /^special:/i, /^wikipedia:/i, /^main page$/i, /^featured/i,
  /^search$/i, /^\d{4}$/, /\bdeath\b/i, /\bobituary\b/i,
  /\bgossip\b/i, /\bscandal\b/i, /\bleaked\b/i, /\bnude\b/i,
  /\bgerrymandering\b/i, /^best buy$/i, /^how to$/i,
  /what is my\b/i, /^my ip$/i,
  // TV / film / media titles
  /\(miniseries\)/i, /\(tv series\)/i, /\(film\)/i, /\(movie\)/i,
  /\(video game\)/i, /\(album\)/i, /\(song\)/i, /\(singer\)/i,
  /\(rapper\)/i, /\(actor\)/i, /\(actress\)/i,
  // Wikipedia disambiguation suffixes are unreliable topics
  /\(disambiguation\)/i, /\(character\)/i, /\(comics\)/i,
];

// ─── Data: High-business-value keyword signals ────────────────────────────────

const HIGH_BV_SIGNALS = [
  "best", "review", "buy", "price", "cost", "vs", "compare", "comparison",
  "alternative", "software", "tool", "platform", "course", "certification",
  "invest", "investing", "portfolio", "insurance", "loan", "mortgage",
  "supplement", "vitamin", "protein", "diet", "fitness", "workout",
  "how to make money", "passive income", "side hustle", "freelance",
];

const MEDIUM_BV_SIGNALS = [
  "guide", "tutorial", "how to", "learn", "beginner", "explained",
  "definition", "what is", "meaning", "examples", "tips",
];

// ─── Data: Evergreen signals ──────────────────────────────────────────────────

const EVERGREEN_BOOST = [
  "how to", "guide", "tutorial", "what is", "definition", "meaning",
  "explained", "beginner", "learn", "vs", "comparison", "best",
  "tips", "fundamentals", "principles", "examples", "overview",
];

const EVERGREEN_PENALTY = [
  "today", "tonight", "this week", "breaking", "latest", "just", "now",
  "news", "update", "trending", "viral", "meme", "tiktok",
];

// ─── Core Scoring Functions ───────────────────────────────────────────────────

function isHardBlocked(keyword: string): string | null {
  for (const p of BLOCKED_PATTERNS) {
    if (p.test(keyword)) return `Blocked pattern: ${p.source}`;
  }
  return null;
}

function detectSearchIntent(keyword: string): SearchIntent {
  const lc = keyword.toLowerCase();
  if (NEWS_PATTERNS.some((p) => p.test(lc))) return "news";
  if (LOCAL_PATTERNS.some((p) => p.test(lc))) return "local";
  if (CELEBRITY_PATTERNS.some((p) => p.test(lc))) return "entertainment";
  if (/\b(how to|how do|step by step|tutorial)\b/i.test(lc)) return "how_to";
  if (/\b(compare|vs|versus|difference between|vs\.)\b/i.test(lc)) return "comparison";
  if (/\b(best|top \d|review|rated|ranking)\b/i.test(lc)) return "buying_guide";
  if (/\b(buy|price|cost|deal|discount|cheap|affordable|order)\b/i.test(lc)) return "commercial";
  if (/\b(learn|course|education|study|certification|degree|class)\b/i.test(lc)) return "educational";
  if (/\b(what is|what are|who is|why does|how does|explain|definition|meaning)\b/i.test(lc)) return "informational";
  return "informational";
}

function resolveEntity(keyword: string): { label: string | null; confidence: EntityConfidenceLevel; businessValueBoost: number } {
  const lc = keyword.toLowerCase().trim();

  if (KNOWN_ENTITIES[lc]) {
    const e = KNOWN_ENTITIES[lc];
    return { label: e.label, confidence: e.confidence, businessValueBoost: e.businessValue };
  }

  const words = lc.split(/\s+/);

  // Multi-word queries with clear intent prefix are medium confidence
  if (words.length >= 3) {
    return { label: null, confidence: "medium", businessValueBoost: 0 };
  }
  if (words.length === 2) {
    return { label: null, confidence: "medium", businessValueBoost: 0 };
  }
  // Single unknown word — ambiguous
  return { label: null, confidence: "low", businessValueBoost: 0 };
}

function scoreSearchDemand(keyword: string, intent: SearchIntent): number {
  const lc = keyword.toLowerCase();
  let score = 40;

  // Intent-based baseline
  if (intent === "how_to" || intent === "buying_guide") score = 65;
  else if (intent === "comparison" || intent === "commercial") score = 70;
  else if (intent === "educational") score = 55;
  else if (intent === "informational") score = 50;
  else if (intent === "news" || intent === "entertainment") score = 30;

  // Keyword length heuristic: 2-4 words = sweet spot
  const words = lc.split(/\s+/).length;
  if (words >= 2 && words <= 4) score += 10;
  if (words === 1) score -= 10;
  if (words > 6) score -= 5;

  // Evergreen signal boost
  if (EVERGREEN_BOOST.some((s) => lc.includes(s))) score += 8;

  return Math.max(0, Math.min(100, score));
}

function scoreCompetition(keyword: string, intent: SearchIntent): { score: number; level: CompetitionLevel } {
  const lc = keyword.toLowerCase();

  // Finance, insurance, loans = very high competition
  if (/\b(insurance|mortgage|loan|credit card|forex|crypto|bitcoin)\b/i.test(lc)) {
    return { score: 90, level: "very_high" };
  }
  // Major tech companies / established tools
  if (/\b(google|facebook|amazon|apple|microsoft|netflix|youtube|instagram)\b/i.test(lc)) {
    return { score: 85, level: "very_high" };
  }
  // Commercial / buying intent = high competition
  if (intent === "commercial" || intent === "buying_guide") {
    return { score: 70, level: "high" };
  }
  // Comparison pages moderately competitive
  if (intent === "comparison") {
    return { score: 60, level: "medium" };
  }
  // How-to / educational = medium
  if (intent === "how_to" || intent === "educational") {
    return { score: 50, level: "medium" };
  }
  // Informational / reference = generally lower
  if (intent === "informational") {
    return { score: 40, level: "low" };
  }
  return { score: 55, level: "medium" };
}

function scoreRankingOpportunity(
  keyword: string,
  competitionScore: number,
  intent: SearchIntent,
  entityConfidence: EntityConfidenceLevel
): number {
  // Base: inverse of competition
  let score = 100 - competitionScore;

  // Reward long-tail (3+ words)
  const words = keyword.split(/\s+/).length;
  if (words >= 3) score += 12;
  if (words >= 5) score += 8;

  // Penalize if entity is ambiguous — harder to rank for ambiguous terms
  if (entityConfidence === "low") score -= 20;
  if (entityConfidence === "medium") score -= 5;

  // How-to and educational are more linkable → better opportunity
  if (intent === "how_to" || intent === "educational" || intent === "comparison") score += 10;

  // News / entertainment → very low opportunity (freshness race)
  if (intent === "news" || intent === "entertainment") score -= 30;
  if (intent === "local") score -= 40;

  return Math.max(0, Math.min(100, score));
}

function scoreEvergreen(keyword: string, intent: SearchIntent): number {
  const lc = keyword.toLowerCase();
  let score = 50;

  for (const s of EVERGREEN_BOOST) if (lc.includes(s)) score += 12;
  for (const s of EVERGREEN_PENALTY) if (lc.includes(s)) score -= 20;

  if (intent === "educational" || intent === "how_to" || intent === "comparison") score += 15;
  if (intent === "informational") score += 8;
  if (intent === "news" || intent === "entertainment") score -= 35;
  if (intent === "local") score -= 20;

  return Math.max(0, Math.min(100, score));
}

function scoreBusinessValue(keyword: string, intent: SearchIntent, entityBvBoost: number): number {
  const lc = keyword.toLowerCase();
  let score = 30;

  if (entityBvBoost > 0) score = Math.max(score, entityBvBoost);

  for (const s of HIGH_BV_SIGNALS) if (lc.includes(s)) score += 20;
  for (const s of MEDIUM_BV_SIGNALS) if (lc.includes(s)) score += 8;

  if (intent === "commercial" || intent === "buying_guide") score += 25;
  if (intent === "comparison") score += 18;
  if (intent === "educational" || intent === "how_to") score += 10;
  if (intent === "news" || intent === "entertainment" || intent === "local") score -= 15;

  return Math.max(0, Math.min(100, score));
}

function scoreKnowledgeGap(keyword: string): number {
  // Without a live DB query, we estimate gap from keyword characteristics.
  // Topics with specific long-tail phrasing are more likely to be gaps.
  const words = keyword.split(/\s+/).length;
  let score = 50;

  if (words >= 4) score += 20;
  else if (words === 3) score += 10;
  else if (words === 1) score -= 10;

  // "How to X" and "X for beginners" are classic gap patterns
  if (/\b(how to|beginner|for beginners|step by step|complete guide)\b/i.test(keyword)) score += 15;

  return Math.max(0, Math.min(100, score));
}

function calculatePenalties(keyword: string, intent: SearchIntent): { news: number; celebrity: number; local: number } {
  const news = NEWS_PATTERNS.some((p) => p.test(keyword)) || intent === "news" ? 40 : 0;
  const celebrity = CELEBRITY_PATTERNS.some((p) => p.test(keyword)) ? 50 : 0;
  const local = LOCAL_PATTERNS.some((p) => p.test(keyword)) || intent === "local" ? 60 : 0;
  return { news, celebrity, local };
}

// ─── Final Decision ───────────────────────────────────────────────────────────

const PUBLISH_THRESHOLD = 58;
const BACKLOG_THRESHOLD = 38;

function makeDecision(
  finalScore: number,
  entityConfidence: EntityConfidenceLevel,
  evergreenScore: number,
  rankingOpportunity: number,
  blockedReason: string | null
): { decision: PublishDecision; reason: string } {
  if (blockedReason) return { decision: "reject", reason: blockedReason };
  if (entityConfidence === "low") return { decision: "reject", reason: "Entity confidence too low — ambiguous keyword" };
  if (evergreenScore < 30) return { decision: "reject", reason: "Evergreen score below 30 — likely a temporary trend" };
  if (rankingOpportunity < 20) return { decision: "reject", reason: "Ranking opportunity too low — SERP dominated by high-authority competitors" };
  if (finalScore >= PUBLISH_THRESHOLD) return { decision: "publish", reason: `Final score ${finalScore} exceeds publish threshold of ${PUBLISH_THRESHOLD}` };
  if (finalScore >= BACKLOG_THRESHOLD) return { decision: "backlog", reason: `Final score ${finalScore} — below publish threshold, stored for future review` };
  return { decision: "reject", reason: `Final score ${finalScore} below minimum threshold of ${BACKLOG_THRESHOLD}` };
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function runKeywordResearch(rawKeyword: string): KeywordResearchResult {
  const normalized = rawKeyword.trim().replace(/\s+/g, " ").toLowerCase();

  const blockedReason = isHardBlocked(normalized);
  if (blockedReason) {
    return buildRejectedResult(rawKeyword, normalized, blockedReason);
  }

  const intent = detectSearchIntent(normalized);
  if (intent === "blocked") {
    return buildRejectedResult(rawKeyword, normalized, "Keyword matched blocked intent pattern");
  }

  const { label: detectedEntity, confidence: entityConfidence, businessValueBoost } = resolveEntity(normalized);
  const entityConfidenceScore = entityConfidence === "high" ? 90 : entityConfidence === "medium" ? 55 : 15;

  const searchDemandScore = scoreSearchDemand(normalized, intent);
  const { score: competitionScore, level: competitionLevel } = scoreCompetition(normalized, intent);
  const rankingOpportunityScore = scoreRankingOpportunity(normalized, competitionScore, intent, entityConfidence);
  const evergreenScore = scoreEvergreen(normalized, intent);
  const businessValueScore = scoreBusinessValue(normalized, intent, businessValueBoost);
  const knowledgeGapScore = scoreKnowledgeGap(normalized);
  const { news: newsPenalty, celebrity: celebrityPenalty, local: localPenalty } = calculatePenalties(normalized, intent);

  const totalPenalty = newsPenalty + celebrityPenalty + localPenalty;

  // Final Decision Score formula
  const rawScore =
    searchDemandScore * 0.15 +
    rankingOpportunityScore * 0.25 +
    evergreenScore * 0.20 +
    businessValueScore * 0.15 +
    knowledgeGapScore * 0.10 +
    entityConfidenceScore * 0.15;

  const finalDecisionScore = Math.max(0, Math.min(100, Math.round(rawScore - totalPenalty * 0.5)));

  const { decision, reason } = makeDecision(
    finalDecisionScore,
    entityConfidence,
    evergreenScore,
    rankingOpportunityScore,
    null
  );

  return {
    keyword: rawKeyword,
    normalizedKeyword: normalized,
    searchDemandScore,
    competitionScore,
    rankingOpportunityScore,
    evergreenScore,
    businessValueScore,
    knowledgeGapScore,
    entityConfidenceScore,
    searchIntent: intent,
    entityConfidence,
    competitionLevel,
    detectedEntity,
    newsPenalty,
    celebrityPenalty,
    localPenalty,
    finalDecisionScore,
    decision,
    decisionReason: reason,
    breakdown: {
      searchDemand: searchDemandScore,
      competition: competitionScore,
      rankingOpportunity: rankingOpportunityScore,
      evergreen: evergreenScore,
      businessValue: businessValueScore,
      knowledgeGap: knowledgeGapScore,
      entityConfidence: entityConfidenceScore,
      newsPenalty,
      celebrityPenalty,
      localPenalty,
      finalScore: finalDecisionScore,
      intent,
      entity: detectedEntity ?? "unknown",
      decision,
    },
  };
}

function buildRejectedResult(raw: string, normalized: string, reason: string): KeywordResearchResult {
  return {
    keyword: raw,
    normalizedKeyword: normalized,
    searchDemandScore: 0,
    competitionScore: 0,
    rankingOpportunityScore: 0,
    evergreenScore: 0,
    businessValueScore: 0,
    knowledgeGapScore: 0,
    entityConfidenceScore: 0,
    searchIntent: "blocked",
    entityConfidence: "low",
    competitionLevel: "high",
    detectedEntity: null,
    newsPenalty: 0,
    celebrityPenalty: 0,
    localPenalty: 0,
    finalDecisionScore: 0,
    decision: "reject",
    decisionReason: reason,
    breakdown: { decision: "reject", reason },
  };
}
