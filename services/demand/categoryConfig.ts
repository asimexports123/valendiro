/**
 * Category Configuration System
 *
 * V1 categories are seeded into system_settings as JSON.
 * Admin can enable/disable categories via the dashboard without any code changes.
 * Out-of-scope keywords are sent to backlog, NOT permanently rejected.
 */

import { getSystemSetting, setSystemSetting } from "@/services/system/settings";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CategoryDefinition {
  slug: string;
  label: string;
  enabled: boolean;
  priority: number; // 1 = highest, used to break ties in clustering
  keywords: string[]; // signals used for category detection
  subreddits: string[]; // reddit sources for this category
  seedQueries: string[]; // Google Autocomplete seed queries
  businessValueBoost: number; // 0–30 added to BV score for this category
}

export interface CategoryConfig {
  version: number;
  updatedAt: string;
  categories: CategoryDefinition[];
}

// ─── V1 Default Config (seeded on first run) ─────────────────────────────────

export const V1_DEFAULT_CONFIG: CategoryConfig = {
  version: 1,
  updatedAt: new Date().toISOString(),
  categories: [
    {
      slug: "technology",
      label: "Technology",
      enabled: true,
      priority: 1,
      keywords: [
        "software", "app", "application", "phone", "smartphone", "laptop", "computer",
        "tech", "gadget", "internet", "wifi", "cloud", "server", "api", "database",
        "cybersecurity", "encryption", "saas", "platform", "tool", "plugin", "browser",
        "operating system", "windows", "macos", "linux", "android", "ios",
        "artificial intelligence", "machine learning", "deep learning", "neural network",
        "chatgpt", "gpt", "llm", "ai", "automation", "robotics",
        "programming", "code", "coding", "developer", "python", "javascript", "typescript",
        "react", "nodejs", "sql", "git", "github", "web development", "frontend", "backend",
        "kubernetes", "docker", "devops", "open source",
      ],
      subreddits: ["technology", "programming", "MachineLearning", "learnprogramming", "webdev"],
      seedQueries: [
        "how to code", "best software for", "what is machine learning",
        "how to use python", "best ai tools", "how to learn programming",
        "what is api", "how to build a website", "best developer tools",
      ],
      businessValueBoost: 25,
    },
    {
      slug: "business",
      label: "Business & Entrepreneurship",
      enabled: true,
      priority: 2,
      keywords: [
        "business", "startup", "entrepreneur", "entrepreneurship", "company", "corporation",
        "marketing", "digital marketing", "seo", "content marketing", "social media marketing",
        "sales", "revenue", "profit", "growth hacking", "customer acquisition",
        "product management", "product market fit", "mvp", "pitch deck", "fundraising",
        "venture capital", "angel investor", "b2b", "b2c", "saas business",
        "remote work", "freelance", "consulting", "agency", "ecommerce",
        "amazon fba", "dropshipping", "print on demand", "side hustle",
        "leadership", "management", "team building", "hiring", "productivity",
        "brand", "branding", "logo", "copywriting", "email marketing",
      ],
      subreddits: ["Entrepreneur", "startups", "smallbusiness", "marketing", "digitalnomad"],
      seedQueries: [
        "how to start a business", "best marketing strategies", "how to grow startup",
        "what is digital marketing", "how to get clients", "best business tools",
        "how to scale a business", "startup ideas", "how to write a business plan",
      ],
      businessValueBoost: 28,
    },
    {
      slug: "personal-finance",
      label: "Personal Finance",
      enabled: true,
      priority: 1,
      keywords: [
        "money", "finance", "personal finance", "investing", "investment",
        "stock", "stocks", "index fund", "etf", "mutual fund", "dividend",
        "crypto", "bitcoin", "ethereum", "defi",
        "budget", "budgeting", "saving", "savings", "emergency fund",
        "debt", "loan", "mortgage", "credit card", "credit score", "interest rate",
        "compound interest", "dollar cost averaging", "roth ira", "401k",
        "retirement", "financial independence", "fire movement", "passive income",
        "tax", "tax return", "income tax", "capital gains", "tax deduction",
        "insurance", "life insurance", "health insurance", "term insurance",
        "net worth", "financial planning", "wealth", "frugal",
      ],
      subreddits: ["personalfinance", "financialindependence", "investing", "Frugal", "povertyfinance"],
      seedQueries: [
        "how to invest money", "best index funds", "how to build emergency fund",
        "what is compound interest", "how to improve credit score", "how to save money",
        "best budgeting apps", "how to pay off debt", "roth ira vs 401k",
        "how to start investing", "what is dollar cost averaging",
      ],
      businessValueBoost: 30,
    },
    {
      slug: "education",
      label: "Education & Learning",
      enabled: true,
      priority: 3,
      keywords: [
        "learn", "learning", "education", "study", "studying",
        "course", "online course", "tutorial", "lesson", "lecture",
        "certification", "certificate", "degree", "university", "college",
        "exam", "test", "gre", "gmat", "sat", "ielts", "toefl",
        "skill", "skills", "professional development", "career change",
        "self improvement", "self-learning", "autodidact",
        "how to learn", "beginner guide", "complete guide", "step by step",
        "explained", "understanding", "fundamentals", "basics", "introduction",
        "memory", "focus", "study tips", "note taking", "spaced repetition",
      ],
      subreddits: ["learnprogramming", "learnmath", "GetStudying", "languagelearning", "selfimprovement"],
      seedQueries: [
        "how to learn fast", "best online courses", "how to study effectively",
        "what is spaced repetition", "best free learning resources",
        "how to get certified", "beginner guide to", "how to understand",
      ],
      businessValueBoost: 20,
    },
    {
      slug: "health-wellness",
      label: "Health & Wellness",
      enabled: true,
      priority: 2,
      keywords: [
        "health", "wellness", "healthy", "fitness", "exercise", "workout",
        "gym", "weight loss", "diet", "nutrition", "calories", "protein",
        "supplement", "vitamin", "mineral", "omega 3",
        "mental health", "anxiety", "depression", "stress", "sleep", "insomnia",
        "meditation", "mindfulness", "yoga", "stretching",
        "running", "cardio", "strength training", "muscle", "fat loss",
        "diabetes", "hypertension", "cholesterol", "heart health",
        "immune system", "gut health", "inflammation", "cortisol",
        "keto", "intermittent fasting", "plant based", "vegan nutrition",
      ],
      subreddits: ["fitness", "nutrition", "loseit", "anxiety", "meditation", "running"],
      seedQueries: [
        "how to lose weight", "best workout routine", "what is intermittent fasting",
        "how to reduce anxiety", "best supplements for", "how to sleep better",
        "what is cortisol", "how to build muscle", "best diet for",
        "how to improve mental health", "beginner workout guide",
      ],
      businessValueBoost: 22,
    },
    {
      slug: "home-lifestyle",
      label: "Home & Lifestyle",
      enabled: true,
      priority: 4,
      keywords: [
        "home", "house", "apartment", "interior design", "decor", "decoration",
        "clean", "cleaning", "organize", "organization", "declutter", "minimalism",
        "diy", "repair", "fix", "renovation", "home improvement",
        "kitchen", "cooking", "recipe", "meal prep", "baking", "food",
        "bathroom", "bedroom", "living room", "furniture", "storage",
        "garden", "gardening", "plants", "indoor plants",
        "laundry", "household", "chores", "maintenance",
        "lifestyle", "morning routine", "evening routine", "habits",
        "relationship", "parenting", "family", "kids",
      ],
      subreddits: ["HomeImprovement", "declutter", "MealPrepSunday", "malelivingspace", "femalelivingspace"],
      seedQueries: [
        "how to clean", "home organization tips", "diy home repair",
        "best meal prep ideas", "how to decorate", "beginner cooking guide",
        "how to organize", "interior design tips", "how to start gardening",
      ],
      businessValueBoost: 15,
    },
    {
      slug: "travel",
      label: "Travel & Transportation",
      enabled: true,
      priority: 5,
      keywords: [
        "travel", "travelling", "vacation", "holiday", "trip", "journey",
        "destination", "country", "city", "tourism", "tourist",
        "hotel", "hostel", "airbnb", "accommodation",
        "flight", "airline", "airport", "layover", "cheap flights",
        "visa", "passport", "travel insurance", "travel tips",
        "backpacking", "solo travel", "budget travel", "luxury travel",
        "train", "bus", "road trip", "car rental",
        "digital nomad", "remote work travel", "travel hacking",
        "packing", "luggage", "carry on",
      ],
      subreddits: ["travel", "solotravel", "digitalnomad", "shoestring", "backpacking"],
      seedQueries: [
        "how to travel cheap", "best travel destinations", "how to get cheap flights",
        "travel tips for beginners", "what to pack for", "how to plan a trip",
        "best travel credit cards", "digital nomad guide",
      ],
      businessValueBoost: 18,
    },
  ],
};

// ─── DB Key ───────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG_KEY = "v1_category_config";

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getCategoryConfig(): Promise<CategoryConfig> {
  try {
    const raw = await getSystemSetting(CATEGORY_CONFIG_KEY, "");
    if (raw) {
      const parsed = JSON.parse(raw) as CategoryConfig;
      if (parsed.categories?.length) return parsed;
    }
  } catch {
    // fall through to default
  }
  // First run — seed defaults
  await seedDefaultCategoryConfig();
  return V1_DEFAULT_CONFIG;
}

export async function getActiveCategories(): Promise<CategoryDefinition[]> {
  const config = await getCategoryConfig();
  return config.categories
    .filter((c) => c.enabled)
    .sort((a, b) => a.priority - b.priority);
}

export async function seedDefaultCategoryConfig(): Promise<void> {
  const config: CategoryConfig = { ...V1_DEFAULT_CONFIG, updatedAt: new Date().toISOString() };
  await setSystemSetting(CATEGORY_CONFIG_KEY, JSON.stringify(config));
}

export async function updateCategoryConfig(config: CategoryConfig): Promise<void> {
  config.updatedAt = new Date().toISOString();
  await setSystemSetting(CATEGORY_CONFIG_KEY, JSON.stringify(config));
}

export async function setCategoryEnabled(slug: string, enabled: boolean): Promise<void> {
  const config = await getCategoryConfig();
  const idx = config.categories.findIndex((c) => c.slug === slug);
  if (idx === -1) throw new Error(`Category not found: ${slug}`);
  config.categories[idx].enabled = enabled;
  await updateCategoryConfig(config);
}

// ─── Category Detection ───────────────────────────────────────────────────────

export interface CategoryMatch {
  category: CategoryDefinition | null;
  slug: string;
  label: string;
  inScope: boolean;
  matchedKeyword: string | null;
}

export function detectCategoryFromKeyword(
  keyword: string,
  activeCategories: CategoryDefinition[]
): CategoryMatch {
  const lower = keyword.toLowerCase();

  let bestMatch: CategoryDefinition | null = null;
  let bestMatchedKw: string | null = null;
  let bestScore = 0;

  for (const cat of activeCategories) {
    for (const kw of cat.keywords) {
      if (lower.includes(kw)) {
        // Longer keyword match = more specific = higher score
        const score = kw.length + (cat.priority === 1 ? 5 : 0);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = cat;
          bestMatchedKw = kw;
        }
      }
    }
  }

  if (bestMatch) {
    return { category: bestMatch, slug: bestMatch.slug, label: bestMatch.label, inScope: true, matchedKeyword: bestMatchedKw };
  }

  return { category: null, slug: "out-of-scope", label: "Out of Scope", inScope: false, matchedKeyword: null };
}

// ─── All seed queries from active categories ──────────────────────────────────

export async function getAllActiveSeedQueries(): Promise<{ query: string; category: string }[]> {
  const active = await getActiveCategories();
  return active.flatMap((cat) =>
    cat.seedQueries.map((q) => ({ query: q, category: cat.slug }))
  );
}

export async function getAllActiveSubreddits(): Promise<{ subreddit: string; category: string }[]> {
  const active = await getActiveCategories();
  return active.flatMap((cat) =>
    cat.subreddits.map((s) => ({ subreddit: s, category: cat.slug }))
  );
}
