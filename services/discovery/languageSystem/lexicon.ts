import type { FactKind } from "./types";

/** Comprehensive stop-word and junk-token filter for encyclopedic prose. */
export const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
  "do", "does", "did", "will", "would", "could", "should", "may", "might", "must", "shall", "can",
  "need", "to", "of", "in", "for", "on", "with", "at", "by", "from", "as", "into", "through",
  "during", "before", "after", "above", "below", "between", "under", "again", "further", "then",
  "once", "here", "there", "when", "where", "why", "how", "all", "each", "few", "more", "most",
  "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very",
  "just", "and", "but", "or", "if", "that", "this", "these", "those", "it", "its", "they", "them",
  "their", "what", "which", "who", "whom", "also", "often", "typically", "commonly", "usually",
  "generally", "involves", "means", "refers", "defined", "called", "known", "used", "using",
  "he", "she", "we", "you", "your", "our", "his", "her", "my", "me", "us", "him",
  "numerous", "various", "several", "many", "among", "within", "across", "including",
  "based", "related", "associated", "field", "high", "profile", "addition", "safety",
  "planning", "knowledge", "representation", "ontology", "rational", "agent", "decision",
  "making", "generative", "since", "plus", "beats", "both", "either", "neither", "about",
  "over", "any", "every", "much", "less", "well", "back", "even", "still", "yet",
  "able", "one", "two", "three", "first", "second",
  "new", "old", "large", "small", "major", "minor", "main", "key", "core", "wide",
  "broad", "deep", "long", "short", "early", "late", "recent", "current", "modern",
  "traditional", "basic", "simple", "complex", "general", "specific", "particular",
  "certain", "different", "similar", "type", "types", "kind", "kinds", "form",
  "forms", "way", "ways", "part", "parts", "area", "areas", "set", "sets", "group",
  "groups", "number", "numbers", "level", "levels", "term", "terms",
  "example", "examples", "case", "cases", "work", "works",
  "study", "studies", "development", "history", "century", "decades",
  "year", "years", "time", "times", "today",
  "world", "human", "humans", "people", "person", "things", "thing", "something",
  "anything", "everything", "nothing",
  // verbs / fragments that leak from Wikipedia sentences
  "down", "widely", "available", "broken", "getting", "building", "include",
  "perform", "consist", "display", "receive", "cover", "given", "become",
  "becomes", "perceives", "perceive", "takes", "take", "simulating", "simulate",
  "trained", "training", "learns", "learned", "learning", "trying", "steer", "clear", "prefer", "reads",
  "develops", "develop", "generates", "generate", "creates", "create",
  "provides", "provide", "allows", "allow", "enables", "enable", "helps",
  "makes", "uses", "employs", "leverages", "utilizes", "involves", "requires",
  "represents", "includes", "contains", "covers", "measures", "tracks",
  "reports", "suggests", "indicates", "shows", "demonstrates", "explains",
  "describes", "defines", "refers", "means", "called", "known", "used",
  "using", "based", "related", "associated", "especially", "notably",
  "particularly", "significantly", "roughly", "approximately", "nearly",
  "fast", "intuitive", "rarely", "step", "scene", "interpretation",
  "vehicles", "play", "prompts", "text", "images", "audio", "videos",
  "effects", "potential", "existential", "risks", "concerns", "ethical",
  "harms", "consequences", "attention", "scope", "research", "researchers",
  "expect", "expects", "noted", "noting", "linked", "shaped", "designed",
  "built", "marked", "distinguished", "reflected", "associated",
]);

/** Common verbs — reject as single-word keywords (keep in multi-word phrases). */
export const VERB_JUNK = new Set([
  "down", "up", "out", "off", "over", "under", "through", "across",
  "perceives", "takes", "include", "perform", "consist", "display",
  "receive", "cover", "given", "become", "becomes", "getting", "building",
  "simulating", "broken", "widely", "available", "generate", "creates",
  "develops", "provides", "allows", "enables", "helps", "makes", "uses",
  "involves", "requires", "represents", "includes", "measures", "tracks",
  "trained", "trying", "steer", "prefer", "reads", "solve", "solving",
  "expect", "expects", "noted", "linked", "shaped", "designed", "built",
  "marked", "distinguished", "reflected", "play", "weigh", "validate",
  "engage", "lean", "tackle", "address", "begin", "start", "move",
  "review", "scale", "employ", "utilize", "leverage",
]);

/** Synonym pools for light lexical variation — extended from brainWriter. */
export const SYNONYMS: Record<string, string[]> = {
  important: ["significant", "essential", "critical", "key"],
  use: ["apply", "employ", "leverage", "utilize"],
  help: ["assist", "support", "enable", "aid"],
  show: ["demonstrate", "reveal", "indicate", "illustrate"],
  make: ["create", "produce", "build", "form"],
  need: ["require", "demand", "call for", "necessitate"],
  good: ["effective", "solid", "strong", "sound"],
  common: ["typical", "frequent", "usual", "standard"],
  often: ["frequently", "regularly", "commonly", "typically"],
  also: ["additionally", "furthermore", "likewise", "as well"],
  because: ["since", "as", "given that", "due to the fact that"],
  however: ["nevertheless", "yet", "still", "nonetheless"],
  example: ["instance", "case", "illustration", "sample"],
  process: ["procedure", "workflow", "method", "approach"],
  result: ["outcome", "effect", "consequence", "product"],
  focus: ["center on", "concentrate on", "prioritize", "emphasize"],
  avoid: ["steer clear of", "sidestep", "guard against", "skip"],
  mistake: ["misstep", "pitfall", "error", "oversight"],
  practical: ["hands-on", "applied", "actionable", "everyday"],
  understand: ["grasp", "appreciate", "recognize", "see"],
};

/** Craft phrases when keyword extraction fails — never from source. */
export const FALLBACK_PHRASES: Record<FactKind, string[][]> = {
  definition: [
    ["core principles", "foundational ideas"],
    ["main concepts", "guiding themes"],
    ["essential notions", "key principles"],
  ],
  property: [
    ["defining traits", "key characteristics"],
    ["notable qualities", "distinct markers"],
    ["signature features", "standout aspects"],
  ],
  procedure: [
    ["practical steps", "useful methods"],
    ["hands-on tactics", "applied workflows"],
    ["actionable moves", "working routines"],
  ],
  warning: [
    ["common pitfalls", "risky habits"],
    ["typical missteps", "costly oversights"],
    ["frequent traps", "avoidable errors"],
  ],
  comparison: [
    ["key differences", "contrasting traits"],
    ["distinct angles", "rival strengths"],
    ["notable contrasts", "choice factors"],
  ],
  measurement: [
    ["useful metrics", "observable signals"],
    ["benchmark figures", "tracked outcomes"],
    ["quantified markers", "reported values"],
  ],
};

function pick<T>(arr: T[], seed: number): T {
  return arr[((seed % arr.length) + arr.length) % arr.length];
}

/** Derive acronym from a multi-word label: "Artificial Intelligence" → "AI". */
export function acronymFromLabel(label: string): string | null {
  const words = label.split(/\s+/).filter((w) => w.length > 0);
  if (words.length < 2) return null;
  const letters = words
    .map((w) => (/^[A-Z]/.test(w) ? w[0] : w[0]?.toUpperCase() ?? ""))
    .join("");
  if (letters.length >= 2 && letters.length <= 5) return letters;
  return null;
}

/** True when word passes length, stop-word, and junk filters. */
export function isValidKeyword(word: string, claimSource = ""): boolean {
  const lower = word.toLowerCase();
  if (/^\d+$/.test(lower)) return false;
  if (/^\d{2,4}s$/.test(lower)) return false;
  if (/^(19|20)\d{2}s?$/.test(lower)) return false;
  if (lower.length <= 1) return false;
  if (VERB_JUNK.has(lower)) return false;
  if (lower.length <= 3) {
    if (!claimSource) return false;
    const re = new RegExp(`\\b${lower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    const match = claimSource.match(re);
    return match !== null && match[0] === match[0].toUpperCase();
  }
  return !STOP_WORDS.has(lower);
}

/** True when a multi-word phrase is worth keeping as a keyword unit. */
export function isValidKeywordPhrase(phrase: string, claimSource = ""): boolean {
  const words = phrase.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length < 2) return isValidKeyword(phrase, claimSource);
  if (words.some((w) => /^\d+$/.test(w) || VERB_JUNK.has(w))) return false;
  const valid = words.filter((w) => isValidKeyword(w, claimSource));
  return valid.length >= 2;
}

export function titleCasePhrase(phrase: string): string {
  return phrase
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Pick a synonym variant for a word using deterministic seed. */
export function pickSynonym(word: string, seed: number): string {
  const lower = word.toLowerCase();
  const alts = SYNONYMS[lower];
  if (!alts || alts.length === 0) return word;
  const alt = alts[seed % alts.length];
  return word[0] === word[0].toUpperCase()
    ? alt.charAt(0).toUpperCase() + alt.slice(1)
    : alt;
}

/** Rotate fallback phrase pool for a fact kind. */
export function getFallbackPhrases(kind: FactKind, seed: number): string[] {
  const pools = FALLBACK_PHRASES[kind];
  const pool = pools[seed % pools.length];
  return [...pool.slice(seed % pool.length), ...pool.slice(0, seed % pool.length)];
}

/** Apply up to three synonym swaps across a realized sentence. */
export function applySynonyms(text: string, seed: number): string {
  let out = text;
  const words = Object.keys(SYNONYMS);
  let applied = 0;
  for (let i = 0; i < words.length && applied < 2; i++) {
    const word = words[(seed + i) % words.length];
    const re = new RegExp(`\\b${word}\\b`, "gi");
    if (re.test(out)) {
      out = out.replace(re, (m) => pickSynonym(m, seed + i));
      applied++;
    }
  }
  return out.replace(/\bAn ([aeiou])/gi, "A $1");
}

/** Join keyword objects with natural connectors. */
export function joinKeywords(keywords: string[], seed = 0): string {
  if (keywords.length === 0) return "its central themes";
  if (keywords.length === 1) return keywords[0];
  if (keywords.length === 2) {
    const pairs = [" and ", " alongside ", " paired with "];
    return `${keywords[0]}${pick(pairs, seed)}${keywords[1]}`;
  }
  const mid = keywords.slice(1, -1).join(", ");
  const closers = [", and ", ", plus ", ", along with "];
  const closer = pick(closers, seed);
  return mid
    ? `${keywords[0]}, ${mid}${closer}${keywords[keywords.length - 1]}`
    : `${keywords[0]}${closer}${keywords[keywords.length - 1]}`;
}

export { pick };
