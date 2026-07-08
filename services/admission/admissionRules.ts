/**
 * Knowledge Admission Rules — classify RSS assets as evergreen vs transient news.
 * Timeless knowledge topics must not be polluted by headlines and events.
 */

export type ContentClass =
  | "evergreen"
  | "transient_news"
  | "product_update"
  | "event_announcement"
  | "unknown";

/** Strong signals that content is breaking news / ephemeral */
const NEWS_TITLE_PATTERNS: RegExp[] = [
  /\b(announces?|announced|launches?|launched|releases?|released|unveils?|unveiled)\b/i,
  /\b(hits?\s+\$|valued?\s+at|raises?\s+\$|funding\s+round)\b/i,
  /\b(tells?\s+staff|layoffs?|fired|hiring\s+freeze)\b/i,
  /\b(applications?\s+close|deadline|last\s+chance|closes?\s+on|closing\s+on)\b/i,
  /\b(built\s+an?\s+all-?american|introduces?\s+new|rolls?\s+out)\b/i,
  /\b(breaking|just\s+in|update:|latest:|this\s+week|today)\b/i,
  /\b(startup\s+battlefield|techcrunch\s+disrupt)\b/i,
  /\b(nobody\s+is\s+buying|why\s+is\s+nobody)\b/i,
  /\b(investigat(ed|es)|hacked|spyware|passkey)\b/i,
  /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b/i,
  /\b\d{4}\b.*\b(release|update|launch|close)\b/i,
  /\b(cancel\s+for\s+any\s+reason|soar|surge|plunge|stock\s+price)\b/i,
];

/** Signals evergreen / timeless knowledge */
const EVERGREEN_TITLE_PATTERNS: RegExp[] = [
  /^(what\s+is|how\s+to|guide\s+to|introduction\s+to|understanding)\b/i,
  /\b(fundamentals|basics|explained|overview|principles|best\s+practices)\b/i,
  /\b(lambdas?|index\s+funds?|design\s+patterns?|version\s+control)\b/i,
  /\b(api|framework|architecture|protocol|algorithm|methodology)\b/i,
];

/** Product updates should enrich existing topics, not become new pages */
const PRODUCT_UPDATE_PATTERNS: RegExp[] = [
  /\b(releases?\s+\w+\s+update|copilot\s+update|new\s+feature|beta\s+release)\b/i,
  /\b(version\s+\d|v\d+\.\d+|patch\s+notes)\b/i,
];

/** Known entity/product names → enrich parent topic slug hints */
export const ENTITY_ENRICHMENT_HINTS: Record<string, string[]> = {
  github: ["git-version-control", "software-design-patterns"],
  copilot: ["git-version-control", "software-design-patterns"],
  chevy: ["electric-vehicles", "automotive"],
  ev: ["electric-vehicles"],
  "electric vehicle": ["electric-vehicles"],
  huggingface: ["artificial-intelligence", "bert-model"],
  openai: ["artificial-intelligence", "transformer-architecture"],
};

const REJECT_PATTERNS: RegExp[] = [
  /^\s*$/,
  /^.{0,7}$/, // empty or single-token noise only — "Java Lambdas" / "Index Funds" are valid
  /\b(click here|subscribe|newsletter|sponsored)\b/i,
];

export function scoreNewsSignals(text: string): number {
  let score = 0;
  for (const pattern of NEWS_TITLE_PATTERNS) {
    if (pattern.test(text)) score += 0.22;
  }
  // Question headlines often news
  if (/^(why|what happened|who is)\b/i.test(text)) score += 0.15;
  return Math.min(1, score);
}

export function scoreEvergreenSignals(text: string): number {
  let score = 0;
  for (const pattern of EVERGREEN_TITLE_PATTERNS) {
    if (pattern.test(text)) score += 0.28;
  }
  // Title looks like a concept (2-4 words, no verbs)
  const words = text.trim().split(/\s+/);
  if (words.length >= 2 && words.length <= 5 && !/\b(is|are|was|will|has)\b/i.test(text)) {
    score += 0.2;
  }
  return Math.min(1, score);
}

export function detectContentClass(title: string, body: string): ContentClass {
  const combined = `${title} ${body}`.slice(0, 2000);

  if (PRODUCT_UPDATE_PATTERNS.some((p) => p.test(combined))) {
    return "product_update";
  }
  if (NEWS_TITLE_PATTERNS.some((p) => p.test(title))) {
    return scoreNewsSignals(title) > 0.4 ? "transient_news" : "event_announcement";
  }
  if (scoreEvergreenSignals(title) >= 0.4) {
    return "evergreen";
  }
  return "unknown";
}

export function shouldReject(title: string): { reject: boolean; reason?: string } {
  if (REJECT_PATTERNS.some((p) => p.test(title))) {
    return { reject: true, reason: "Title fails minimum quality bar" };
  }
  if (title.length > 200) {
    return { reject: true, reason: "Title too long — likely raw feed noise" };
  }
  return { reject: false };
}

export function findEnrichmentTopicHints(title: string, body: string): string[] {
  const text = `${title} ${body}`.toLowerCase();
  const hints = new Set<string>();
  for (const [entity, slugs] of Object.entries(ENTITY_ENRICHMENT_HINTS)) {
    if (text.includes(entity)) {
      for (const s of slugs) hints.add(s);
    }
  }
  return [...hints];
}
