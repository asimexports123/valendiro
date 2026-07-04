// ─── Intent-Aware Knowledge Quality Engine ─────────────────────────────────────
// Phase 20.3: Intent Classification System

/**
 * Knowledge Intent Types
 * Every page should satisfy the reader's intent, not teach a lesson.
 */
export type KnowledgeIntent =
  | "learn"           // Acquire knowledge through teaching (Education category)
  | "understand"      // Grasp concepts and principles (Technology, Health)
  | "compare"         // Evaluate options side-by-side (Technology, Business)
  | "decide"          // Make informed choices (Business, Finance)
  | "plan"            // Prepare for activities (Travel, Finance)
  | "solve"           // Fix problems (Technology, Home)
  | "discover"        // Explore new topics (Travel, General)
  | "buy"             // Make purchase decisions (Home, Technology)
  | "troubleshoot"    // Diagnose and fix issues (Technology)
  | "travel"          // Plan and enjoy trips (Travel category)
  | "reference"       // Quick lookup information (Technology, Health)
  | "execute"         // Follow step-by-step instructions (Home, Technology);

/**
 * Knowledge Categories
 */
export type KnowledgeCategory =
  | "technology"
  | "business"
  | "finance"
  | "travel"
  | "home"
  | "health"
  | "education";

/**
 * Intent Classification Result
 */
export interface IntentClassification {
  primaryIntent: KnowledgeIntent;
  secondaryIntents: KnowledgeIntent[];
  confidence: number;
  category: KnowledgeCategory;
}

/**
 * Category to Default Intent Mapping
 */
const CATEGORY_INTENT_MAPPING: Record<KnowledgeCategory, KnowledgeIntent> = {
  technology: "understand",
  business: "decide",
  finance: "decide",
  travel: "travel",
  home: "solve",
  health: "understand",
  education: "learn",
};

/**
 * Slug Pattern to Intent Mapping
 */
const SLUG_PATTERNS: { pattern: RegExp; intent: KnowledgeIntent }[] = [
  { pattern: /guide|tutorial|how-to|learn|fundamentals|basics/i, intent: "learn" },
  { pattern: /compare|vs|versus|alternatives|best/i, intent: "compare" },
  { pattern: /choose|select|pick|decision/i, intent: "decide" },
  { pattern: /plan|itinerary|schedule|route/i, intent: "plan" },
  { pattern: /fix|repair|solve|troubleshoot|error/i, intent: "solve" },
  { pattern: /buy|purchase|buying|review/i, intent: "buy" },
  { pattern: /travel|visit|destination|trip/i, intent: "travel" },
  { pattern: /reference|cheat-sheet|quick/i, intent: "reference" },
  { pattern: /setup|install|deploy|configure/i, intent: "execute" },
];

/**
 * Category to Subcategory Mapping (from knowledge_packages)
 */
const SUBCATEGORY_CATEGORIES: Record<string, KnowledgeCategory> = {
  // Technology
  "programming": "technology",
  "web-development": "technology",
  "software-engineering": "technology",
  "data-science": "technology",
  "cybersecurity": "technology",
  "cloud-computing": "technology",
  
  // Business
  "business": "business",
  "entrepreneurship": "business",
  "management": "business",
  "marketing": "business",
  "strategy": "business",
  
  // Finance
  "personal-finance": "finance",
  "investing": "finance",
  "budgeting": "finance",
  "retirement": "finance",
  
  // Travel
  "travel": "travel",
  
  // Home
  "home": "home",
  "lifestyle": "home",
  "cooking": "home",
  "organization": "home",
  
  // Health
  "health": "health",
  "fitness": "health",
  "nutrition": "health",
  "mental-health": "health",
  
  // Education
  "education": "education",
  "learning": "education",
};

/**
 * Classify topic intent based on category, slug, and subcategory
 */
export function classifyIntent(
  slug: string,
  subcategorySlug: string | null | undefined
): IntentClassification {
  // Determine category
  const category = determineCategory(subcategorySlug, slug);
  
  // Determine primary intent from slug patterns
  const primaryIntent = determineIntentFromSlug(slug, category);
  
  // Determine secondary intents based on category
  const secondaryIntents = getSecondaryIntents(category, primaryIntent);
  
  // Calculate confidence
  const confidence = calculateConfidence(slug, category, primaryIntent);
  
  return {
    primaryIntent,
    secondaryIntents,
    confidence,
    category,
  };
}

/**
 * Slug Pattern to Category Mapping
 */
const SLUG_CATEGORY_PATTERNS: { pattern: RegExp; category: KnowledgeCategory }[] = [
  { pattern: /python|javascript|typescript|rust|go|java|react|nextjs|docker|sql|git|html|css|programming|software|data|algorithm|network|cloud|cybersecurity|web-dev|api/i, category: "technology" },
  { pattern: /business|strategy|entrepreneur|management|marketing|agile|project|startup|growth/i, category: "business" },
  { pattern: /investing|budget|finance|retirement|money|saving|trading|stock|cryptocurrency/i, category: "finance" },
  { pattern: /travel|trip|destination|visit|japan|budget-travel/i, category: "travel" },
  { pattern: /home|organization|cooking|diy|lifestyle|fitness|nutrition|health|mental-health/i, category: "home" },
];

/**
 * Determine category from subcategory or slug
 */
function determineCategory(subcategorySlug: string | null | undefined, slug: string): KnowledgeCategory {
  if (subcategorySlug) {
    return SUBCATEGORY_CATEGORIES[subcategorySlug] || "education";
  }
  
  // Fall back to slug pattern matching
  for (const { pattern, category } of SLUG_CATEGORY_PATTERNS) {
    if (pattern.test(slug)) {
      return category;
    }
  }
  
  return "education"; // Default fallback
}

/**
 * Determine intent from slug patterns
 */
function determineIntentFromSlug(slug: string, category: KnowledgeCategory): KnowledgeIntent {
  // Check slug patterns
  for (const { pattern, intent } of SLUG_PATTERNS) {
    if (pattern.test(slug)) {
      return intent;
    }
  }
  
  // Fall back to category default
  return CATEGORY_INTENT_MAPPING[category];
}

/**
 * Get secondary intents based on category
 */
function getSecondaryIntents(category: KnowledgeCategory, primaryIntent: KnowledgeIntent): KnowledgeIntent[] {
  const secondaryMap: Record<KnowledgeCategory, KnowledgeIntent[]> = {
    technology: ["understand", "reference", "execute"],
    business: ["decide", "compare", "plan"],
    finance: ["decide", "plan", "understand"],
    travel: ["discover", "plan", "solve"],
    home: ["solve", "execute", "buy"],
    health: ["understand", "reference"],
    education: ["learn", "understand"],
  };
  
  return secondaryMap[category].filter(i => i !== primaryIntent);
}

/**
 * Calculate confidence score
 */
function calculateConfidence(slug: string, category: KnowledgeCategory, primaryIntent: KnowledgeIntent): number {
  let confidence = 0.7; // Base confidence
  
  // Boost confidence if slug matches pattern
  for (const { pattern, intent } of SLUG_PATTERNS) {
    if (pattern.test(slug) && intent === primaryIntent) {
      confidence += 0.2;
      break;
    }
  }
  
  // Boost confidence if primary intent matches category default
  if (primaryIntent === CATEGORY_INTENT_MAPPING[category]) {
    confidence += 0.1;
  }
  
  return Math.min(1, confidence);
}
