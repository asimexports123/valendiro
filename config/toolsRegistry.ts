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
    title: "SIP Calculator",
    shortDescription: "Estimate how monthly mutual fund SIPs can grow with compounding over time.",
    subcategorySlug: "mutual-funds",
    categorySlug: "personal-finance",
    emoji: "📈",
    relatedTopicSlug: "mutual-fund-fundamentals",
    relatedTopicTitle: "Mutual Fund Fundamentals",
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
