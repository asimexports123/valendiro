/**
 * Interactive tools registry — calculators & quizzes mapped to subcategories.
 *
 * UX: typing-first inputs; money tools use CalculatorCurrencyDropdown.
 * sip-calculator has its own page — do not change its widget.
 */

export type ToolKind = "calculator" | "quiz";

export interface CatalogTool {
  id: string;
  slug: string;
  kind: ToolKind;
  title: string;
  shortDescription: string;
  subcategorySlug: string;
  categorySlug: string;
  emoji: string;
  relatedTopicSlug?: string;
  relatedTopicTitle?: string;
}

export const CATALOG_TOOLS: CatalogTool[] = [
  {
    id: "programming-quiz",
    slug: "programming-quiz",
    kind: "quiz",
    title: "Programming Basics Quiz",
    shortDescription: "Test variables, loops, functions, and core coding concepts in 5 questions.",
    subcategorySlug: "programming",
    categorySlug: "technology",
    emoji: "🧠",
    relatedTopicSlug: "javascript-fundamentals",
    relatedTopicTitle: "JavaScript Fundamentals",
  },
  {
    id: "web-development-quiz",
    slug: "web-development-quiz",
    kind: "quiz",
    title: "Web Development Quiz",
    shortDescription: "HTML, CSS, HTTP, responsive design — quick 5-question check.",
    subcategorySlug: "web-development",
    categorySlug: "technology",
    emoji: "🌐",
    relatedTopicSlug: "html-fundamentals",
    relatedTopicTitle: "HTML Fundamentals",
  },
  {
    id: "ai-basics-quiz",
    slug: "ai-basics-quiz",
    kind: "quiz",
    title: "AI & ML Basics Quiz",
    shortDescription: "Machine learning, training data, neural nets, and LLMs — 5 questions.",
    subcategorySlug: "artificial-intelligence",
    categorySlug: "technology",
    emoji: "🤖",
    relatedTopicSlug: "machine-learning-fundamentals",
    relatedTopicTitle: "Machine Learning Fundamentals",
  },
  {
    id: "compound-interest-calculator",
    slug: "compound-interest-calculator",
    kind: "calculator",
    title: "Compound Interest Calculator",
    shortDescription: "Type principal, rate, and years — see how lump-sum investments compound.",
    subcategorySlug: "investing",
    categorySlug: "personal-finance",
    emoji: "💹",
    relatedTopicSlug: "index-funds",
    relatedTopicTitle: "Index Funds",
  },
  {
    id: "sip-calculator",
    slug: "sip-calculator",
    kind: "calculator",
    title: "Monthly Investment (DCA) Calculator",
    shortDescription:
      "See how dollar-cost averaging into a 401(k), IRA, or brokerage account can grow over time.",
    subcategorySlug: "mutual-funds",
    categorySlug: "personal-finance",
    emoji: "📈",
    relatedTopicSlug: "mutual-fund-fundamentals",
    relatedTopicTitle: "Mutual Fund Fundamentals",
  },
  {
    id: "retirement-401k-calculator",
    slug: "retirement-401k-calculator",
    kind: "calculator",
    title: "401(k) Retirement Calculator",
    shortDescription:
      "Project your 401(k) balance with monthly contributions, employer match, and expected returns.",
    subcategorySlug: "investing",
    categorySlug: "personal-finance",
    emoji: "🏦",
    relatedTopicSlug: "index-funds",
    relatedTopicTitle: "Index Funds",
  },
  {
    id: "inflation-adjusted-returns-calculator",
    slug: "inflation-adjusted-returns-calculator",
    kind: "calculator",
    title: "Inflation-Adjusted Returns Calculator",
    shortDescription:
      "Convert nominal investment returns into real purchasing power in today's dollars.",
    subcategorySlug: "investing",
    categorySlug: "personal-finance",
    emoji: "📉",
    relatedTopicSlug: "index-funds",
    relatedTopicTitle: "Index Funds",
  },
  {
    id: "expense-ratio-calculator",
    slug: "expense-ratio-calculator",
    kind: "calculator",
    title: "Expense Ratio Calculator",
    shortDescription:
      "Compare two mutual funds or ETFs — see how expense ratios erode returns over decades.",
    subcategorySlug: "mutual-funds",
    categorySlug: "personal-finance",
    emoji: "💸",
    relatedTopicSlug: "mutual-fund-fundamentals",
    relatedTopicTitle: "Mutual Fund Fundamentals",
  },
  {
    id: "cagr-calculator",
    slug: "cagr-calculator",
    kind: "calculator",
    title: "CAGR Calculator",
    shortDescription:
      "Calculate compound annual growth rate from beginning value, ending value, and years held.",
    subcategorySlug: "stock-market",
    categorySlug: "personal-finance",
    emoji: "📐",
    relatedTopicSlug: "index-funds",
    relatedTopicTitle: "Index Funds",
  },
  {
    id: "portfolio-allocation-calculator",
    slug: "portfolio-allocation-calculator",
    kind: "calculator",
    title: "Portfolio Allocation Calculator",
    shortDescription:
      "Check current allocation % and how much to buy or sell to reach your target weight.",
    subcategorySlug: "stock-market",
    categorySlug: "personal-finance",
    emoji: "🥧",
    relatedTopicSlug: "index-funds",
    relatedTopicTitle: "Index Funds",
  },
  {
    id: "stock-position-calculator",
    slug: "stock-position-calculator",
    kind: "calculator",
    title: "Position Size Calculator",
    shortDescription: "Type portfolio size, risk %, entry and stop — calculate shares to buy.",
    subcategorySlug: "stock-market",
    categorySlug: "personal-finance",
    emoji: "📊",
    relatedTopicSlug: "index-funds",
    relatedTopicTitle: "Index Funds",
  },
  {
    id: "stock-market-quiz",
    slug: "stock-market-quiz",
    kind: "quiz",
    title: "Stock Market Basics Quiz",
    shortDescription: "Shares, indices, market cap, diversification — 5 quick questions.",
    subcategorySlug: "stock-market",
    categorySlug: "personal-finance",
    emoji: "❓",
    relatedTopicSlug: "index-funds",
    relatedTopicTitle: "Index Funds",
  },
  {
    id: "bmi-calculator",
    slug: "bmi-calculator",
    kind: "calculator",
    title: "BMI Calculator",
    shortDescription: "Type weight and height — get your BMI category instantly.",
    subcategorySlug: "nutrition",
    categorySlug: "health-wellness",
    emoji: "⚖️",
  },
  {
    id: "calorie-tdee-calculator",
    slug: "calorie-tdee-calculator",
    kind: "calculator",
    title: "Calorie & TDEE Calculator",
    shortDescription:
      "Estimate BMR and daily calorie needs using Mifflin-St Jeor — default US units.",
    subcategorySlug: "nutrition",
    categorySlug: "health-wellness",
    emoji: "🔥",
  },
  {
    id: "macro-calculator",
    slug: "macro-calculator",
    kind: "calculator",
    title: "Macro Calculator",
    shortDescription:
      "Split daily calories into protein, carbs, and fat grams for lose, maintain, or gain goals.",
    subcategorySlug: "nutrition",
    categorySlug: "health-wellness",
    emoji: "🍽️",
  },
  {
    id: "calories-burned-calculator",
    slug: "calories-burned-calculator",
    kind: "calculator",
    title: "Calories Burned Calculator",
    shortDescription:
      "MET-based calorie burn estimates for walking, running, cycling, and more.",
    subcategorySlug: "fitness",
    categorySlug: "health-wellness",
    emoji: "🏃",
  },
  {
    id: "one-rep-max-calculator",
    slug: "one-rep-max-calculator",
    kind: "calculator",
    title: "One-Rep Max Calculator",
    shortDescription:
      "Estimate your 1RM from weight and reps using the Epley formula.",
    subcategorySlug: "fitness",
    categorySlug: "health-wellness",
    emoji: "🏋️",
  },
  {
    id: "fitness-basics-quiz",
    slug: "fitness-basics-quiz",
    kind: "quiz",
    title: "Fitness Fundamentals Quiz",
    shortDescription: "Progressive overload, recovery, compound lifts — 5 questions.",
    subcategorySlug: "fitness",
    categorySlug: "health-wellness",
    emoji: "💪",
  },
  {
    id: "mental-wellness-quiz",
    slug: "mental-wellness-quiz",
    kind: "quiz",
    title: "Mental Wellness Quiz",
    shortDescription: "Educational check-in on sleep, mindfulness, and support — not a diagnosis.",
    subcategorySlug: "mental-health",
    categorySlug: "health-wellness",
    emoji: "🧘",
  },
];

export function getToolsForSubcategory(subcategorySlug: string): CatalogTool[] {
  return CATALOG_TOOLS.filter((t) => t.subcategorySlug === subcategorySlug);
}

/**
 * Tools relevant to a topic/article page:
 * - any tool pinned to this topic slug (`relatedTopicSlug`)
 * - all tools in the same subcategory (when the article belongs to that sub)
 */
export function getToolsForTopic(
  topicSlug: string,
  subcategorySlug?: string | null
): CatalogTool[] {
  const seen = new Set<string>();
  const result: CatalogTool[] = [];

  for (const tool of CATALOG_TOOLS) {
    const matchesTopic = tool.relatedTopicSlug === topicSlug;
    const matchesSub =
      Boolean(subcategorySlug) && tool.subcategorySlug === subcategorySlug;
    if (!matchesTopic && !matchesSub) continue;
    if (seen.has(tool.id)) continue;
    seen.add(tool.id);
    result.push(tool);
  }

  return result;
}

export function getToolBySlug(slug: string): CatalogTool | undefined {
  return CATALOG_TOOLS.find((t) => t.slug === slug);
}

export function toolPath(lang: string, toolSlug: string): string {
  return `/${lang}/tools/${toolSlug}`;
}

export const CATEGORY_LABELS: Record<string, string> = {
  technology: "Technology",
  "personal-finance": "Personal Finance",
  "health-wellness": "Health & Wellness",
};

export const SUBCATEGORY_LABELS: Record<string, string> = {
  programming: "Programming",
  "web-development": "Web Development",
  "artificial-intelligence": "Artificial Intelligence",
  investing: "Investing",
  "mutual-funds": "Mutual Funds",
  "stock-market": "Stock Market",
  nutrition: "Nutrition",
  fitness: "Fitness",
  "mental-health": "Mental Health",
};
