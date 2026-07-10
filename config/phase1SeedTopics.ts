/**
 * Phase-1 seed topics — curated, searchable, high-demand topics per subcategory.
 * Single source of truth for brain targeting, DB seeding, and authority fuel URLs.
 *
 * Selection criteria: US search demand, clear informational intent, citable sources.
 */

import { PHASE_1_ACTIVE_SUBCATEGORY_SLUGS } from "./activeTaxonomy";
import type { CandidateInput } from "@/services/knowledge/types";

export interface Phase1SeedTopic {
  slug: string;
  title: string;
  subtitle: string;
  subcategorySlug: string;
  /** Primary keyword people search (SEO anchor). */
  primaryKeyword: string;
  /** 1–100 — higher = brain publishes first. */
  publishPriority: number;
  authorityUrls: {
    url: string;
    name: string;
    authority: CandidateInput["sourceAuthority"];
  }[];
}

/** 6 high-demand seeds per Phase-1 subcategory (54 total). */
export const PHASE_1_SEED_TOPICS: Phase1SeedTopic[] = [
  // ── Technology › Programming ──────────────────────────────────────────────
  {
    slug: "python-programming-fundamentals",
    title: "Python Programming Fundamentals",
    subtitle: "Variables, syntax, loops, and functions for complete beginners.",
    subcategorySlug: "programming",
    primaryKeyword: "python for beginners",
    publishPriority: 82,
    authorityUrls: [
      { url: "https://docs.python.org/3/tutorial/index.html", name: "Python Official Tutorial", authority: "official" },
      { url: "https://en.wikipedia.org/wiki/Python_(programming_language)", name: "Wikipedia Python", authority: "encyclopedic" },
    ],
  },
  {
    slug: "javascript-fundamentals",
    title: "JavaScript Fundamentals",
    subtitle: "Core syntax, variables, functions, and DOM basics for web developers.",
    subcategorySlug: "programming",
    primaryKeyword: "javascript basics",
    publishPriority: 80,
    authorityUrls: [
      { url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Introduction", name: "MDN JS Intro", authority: "official" },
      { url: "https://en.wikipedia.org/wiki/JavaScript", name: "Wikipedia JavaScript", authority: "encyclopedic" },
    ],
  },
  {
    slug: "git-version-control",
    title: "Git Version Control",
    subtitle: "Commits, branches, merges, and collaboration workflows.",
    subcategorySlug: "programming",
    primaryKeyword: "git tutorial",
    publishPriority: 78,
    authorityUrls: [
      { url: "https://git-scm.com/book/en/v2/Getting-Started-About-Version-Control", name: "Pro Git Book", authority: "official" },
      { url: "https://en.wikipedia.org/wiki/Git", name: "Wikipedia Git", authority: "encyclopedic" },
    ],
  },
  {
    slug: "data-structures",
    title: "Data Structures Explained",
    subtitle: "Arrays, linked lists, stacks, queues, trees, and hash maps.",
    subcategorySlug: "programming",
    primaryKeyword: "data structures explained",
    publishPriority: 76,
    authorityUrls: [
      { url: "https://en.wikipedia.org/wiki/Data_structure", name: "Wikipedia Data Structures", authority: "encyclopedic" },
    ],
  },
  {
    slug: "algorithms-fundamentals",
    title: "Algorithms Fundamentals",
    subtitle: "Time complexity, sorting, searching, and Big O notation.",
    subcategorySlug: "programming",
    primaryKeyword: "algorithms for beginners",
    publishPriority: 84,
    authorityUrls: [
      { url: "https://en.wikipedia.org/wiki/Algorithm", name: "Wikipedia Algorithm", authority: "encyclopedic" },
      { url: "https://en.wikipedia.org/wiki/Big_O_notation", name: "Wikipedia Big O", authority: "encyclopedic" },
    ],
  },
  {
    slug: "oop-fundamentals",
    title: "Object-Oriented Programming Basics",
    subtitle: "Classes, objects, inheritance, encapsulation, and polymorphism.",
    subcategorySlug: "programming",
    primaryKeyword: "object oriented programming explained",
    publishPriority: 74,
    authorityUrls: [
      { url: "https://en.wikipedia.org/wiki/Object-oriented_programming", name: "Wikipedia OOP", authority: "encyclopedic" },
    ],
  },

  // ── Technology › Web Development ──────────────────────────────────────────
  {
    slug: "html-fundamentals",
    title: "HTML Fundamentals",
    subtitle: "Tags, semantic markup, forms, and accessible page structure.",
    subcategorySlug: "web-development",
    primaryKeyword: "HTML",
    publishPriority: 94,
    authorityUrls: [
      { url: "https://en.wikipedia.org/wiki/HTML", name: "Wikipedia HTML", authority: "encyclopedic" },
      { url: "https://developer.mozilla.org/en-US/docs/Web/HTML", name: "MDN HTML Reference", authority: "official" },
      { url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content", name: "MDN HTML", authority: "official" },
    ],
  },
  {
    slug: "css-fundamentals",
    title: "CSS Fundamentals",
    subtitle: "Selectors, box model, flexbox, and responsive styling.",
    subcategorySlug: "web-development",
    primaryKeyword: "CSS",
    publishPriority: 88,
    authorityUrls: [
      { url: "https://en.wikipedia.org/wiki/CSS", name: "Wikipedia CSS", authority: "encyclopedic" },
      { url: "https://developer.mozilla.org/en-US/docs/Web/CSS", name: "MDN CSS Reference", authority: "official" },
      { url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics", name: "MDN CSS", authority: "official" },
    ],
  },
  {
    slug: "restful-apis",
    title: "RESTful APIs Explained",
    subtitle: "HTTP methods, endpoints, JSON, and API design principles.",
    subcategorySlug: "web-development",
    primaryKeyword: "rest api explained",
    publishPriority: 72,
    authorityUrls: [
      { url: "https://developer.mozilla.org/en-US/docs/Glossary/REST", name: "MDN REST", authority: "official" },
      { url: "https://en.wikipedia.org/wiki/Representational_state_transfer", name: "Wikipedia REST", authority: "encyclopedic" },
    ],
  },
  {
    slug: "react-library",
    title: "React Library Guide",
    subtitle: "Components, state, hooks, and building interactive UIs.",
    subcategorySlug: "web-development",
    primaryKeyword: "react tutorial",
    publishPriority: 70,
    authorityUrls: [
      { url: "https://react.dev/learn", name: "React Learn", authority: "official" },
      { url: "https://en.wikipedia.org/wiki/React_(software)", name: "Wikipedia React", authority: "encyclopedic" },
    ],
  },
  {
    slug: "responsive-web-design",
    title: "Responsive Web Design",
    subtitle: "Mobile-first layouts, media queries, and flexible grids.",
    subcategorySlug: "web-development",
    primaryKeyword: "responsive web design",
    publishPriority: 68,
    authorityUrls: [
      { url: "https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design", name: "MDN Responsive Design", authority: "official" },
    ],
  },
  {
    slug: "sql-fundamentals",
    title: "SQL Fundamentals",
    subtitle: "Queries, joins, indexes, and relational database basics.",
    subcategorySlug: "web-development",
    primaryKeyword: "sql tutorial",
    publishPriority: 75,
    authorityUrls: [
      { url: "https://developer.mozilla.org/en-US/docs/Glossary/SQL", name: "MDN SQL", authority: "official" },
      { url: "https://en.wikipedia.org/wiki/SQL", name: "Wikipedia SQL", authority: "encyclopedic" },
    ],
  },

  // ── Technology › Artificial Intelligence ────────────────────────────────────
  {
    slug: "what-is-artificial-intelligence",
    title: "What Is Artificial Intelligence?",
    subtitle: "A plain-language introduction to AI, ML, and modern LLMs.",
    subcategorySlug: "artificial-intelligence",
    primaryKeyword: "what is artificial intelligence",
    publishPriority: 91,
    authorityUrls: [
      { url: "https://en.wikipedia.org/wiki/Artificial_intelligence", name: "Wikipedia AI", authority: "encyclopedic" },
      { url: "https://en.wikipedia.org/wiki/Machine_learning", name: "Wikipedia Machine Learning", authority: "encyclopedic" },
    ],
  },
  {
    slug: "machine-learning-fundamentals",
    title: "Machine Learning Fundamentals",
    subtitle: "How models learn from data — supervised, unsupervised, and reinforcement.",
    subcategorySlug: "artificial-intelligence",
    primaryKeyword: "machine learning explained",
    publishPriority: 89,
    authorityUrls: [
      { url: "https://en.wikipedia.org/wiki/Machine_learning", name: "Wikipedia Machine Learning", authority: "encyclopedic" },
    ],
  },
  {
    slug: "how-chatgpt-works",
    title: "How ChatGPT Works",
    subtitle: "Large language models, transformers, and conversational AI explained.",
    subcategorySlug: "artificial-intelligence",
    primaryKeyword: "how does chatgpt work",
    publishPriority: 86,
    authorityUrls: [
      { url: "https://en.wikipedia.org/wiki/ChatGPT", name: "Wikipedia ChatGPT", authority: "encyclopedic" },
      { url: "https://en.wikipedia.org/wiki/Large_language_model", name: "Wikipedia LLM", authority: "encyclopedic" },
    ],
  },
  {
    slug: "neural-networks-basics",
    title: "Neural Networks Basics",
    subtitle: "Neurons, layers, weights, and how deep networks learn patterns.",
    subcategorySlug: "artificial-intelligence",
    primaryKeyword: "neural networks explained",
    publishPriority: 77,
    authorityUrls: [
      { url: "https://en.wikipedia.org/wiki/Neural_network", name: "Wikipedia Neural Network", authority: "encyclopedic" },
    ],
  },
  {
    slug: "deep-learning-fundamentals",
    title: "Deep Learning Fundamentals",
    subtitle: "CNNs, RNNs, transformers, and real-world AI applications.",
    subcategorySlug: "artificial-intelligence",
    primaryKeyword: "deep learning explained",
    publishPriority: 73,
    authorityUrls: [
      { url: "https://en.wikipedia.org/wiki/Deep_learning", name: "Wikipedia Deep Learning", authority: "encyclopedic" },
    ],
  },
  {
    slug: "llm-explained",
    title: "Large Language Models Explained",
    subtitle: "Tokens, training, fine-tuning, and how LLMs generate text.",
    subcategorySlug: "artificial-intelligence",
    primaryKeyword: "large language model explained",
    publishPriority: 85,
    authorityUrls: [
      { url: "https://en.wikipedia.org/wiki/Large_language_model", name: "Wikipedia LLM", authority: "encyclopedic" },
    ],
  },

  // ── Personal Finance › Investing ──────────────────────────────────────────
  {
    slug: "compound-interest-explained",
    title: "Compound Interest Explained",
    subtitle: "Why time in the market beats timing the market.",
    subcategorySlug: "investing",
    primaryKeyword: "compound interest calculator explained",
    publishPriority: 95,
    authorityUrls: [
      { url: "https://www.investopedia.com/terms/c/compoundinterest.asp", name: "Investopedia Compound Interest", authority: "encyclopedic" },
      { url: "https://en.wikipedia.org/wiki/Compound_interest", name: "Wikipedia Compound Interest", authority: "encyclopedic" },
    ],
  },
  {
    slug: "retirement-planning",
    title: "Retirement Planning",
    subtitle: "401(k), IRAs, and building long-term wealth in the US.",
    subcategorySlug: "investing",
    primaryKeyword: "retirement planning guide",
    publishPriority: 86,
    authorityUrls: [
      { url: "https://www.investopedia.com/terms/r/retirement-planning.asp", name: "Investopedia Retirement Planning", authority: "encyclopedic" },
      { url: "https://en.wikipedia.org/wiki/Retirement_planning", name: "Wikipedia Retirement Planning", authority: "encyclopedic" },
    ],
  },
  {
    slug: "401k-retirement-guide",
    title: "401(k) Retirement Guide",
    subtitle: "Employer plans, matching, rollovers, and contribution limits.",
    subcategorySlug: "investing",
    primaryKeyword: "401k explained",
    publishPriority: 83,
    authorityUrls: [
      { url: "https://www.investopedia.com/terms/1/401kplan.asp", name: "Investopedia 401k", authority: "encyclopedic" },
      { url: "https://en.wikipedia.org/wiki/401(k)", name: "Wikipedia 401k", authority: "encyclopedic" },
    ],
  },
  {
    slug: "roth-ira-explained",
    title: "Roth IRA Explained",
    subtitle: "Tax-free growth, contribution limits, and withdrawal rules.",
    subcategorySlug: "investing",
    primaryKeyword: "roth ira explained",
    publishPriority: 81,
    authorityUrls: [
      { url: "https://www.investopedia.com/terms/r/rothira.asp", name: "Investopedia Roth IRA", authority: "encyclopedic" },
      { url: "https://en.wikipedia.org/wiki/Roth_IRA", name: "Wikipedia Roth IRA", authority: "encyclopedic" },
    ],
  },
  {
    slug: "emergency-fund-guide",
    title: "Emergency Fund Guide",
    subtitle: "How much to save, where to keep it, and when to use it.",
    subcategorySlug: "investing",
    primaryKeyword: "emergency fund how much",
    publishPriority: 79,
    authorityUrls: [
      { url: "https://www.investopedia.com/terms/e/emergency_fund.asp", name: "Investopedia Emergency Fund", authority: "encyclopedic" },
    ],
  },
  {
    slug: "asset-allocation-basics",
    title: "Asset Allocation Basics",
    subtitle: "Stocks, bonds, cash, and balancing risk across your portfolio.",
    subcategorySlug: "investing",
    primaryKeyword: "asset allocation explained",
    publishPriority: 71,
    authorityUrls: [
      { url: "https://www.investopedia.com/terms/a/assetallocation.asp", name: "Investopedia Asset Allocation", authority: "encyclopedic" },
    ],
  },

  // ── Personal Finance › Mutual Funds ───────────────────────────────────────
  {
    slug: "mutual-fund-fundamentals",
    title: "Mutual Fund Fundamentals",
    subtitle: "NAV, expense ratios, fund types, and how to choose.",
    subcategorySlug: "mutual-funds",
    primaryKeyword: "mutual funds explained",
    publishPriority: 88,
    authorityUrls: [
      { url: "https://www.investopedia.com/terms/m/mutualfund.asp", name: "Investopedia Mutual Fund", authority: "encyclopedic" },
      { url: "https://en.wikipedia.org/wiki/Mutual_fund", name: "Wikipedia Mutual Fund", authority: "encyclopedic" },
    ],
  },
  {
    slug: "index-funds",
    title: "Index Funds Explained",
    subtitle: "Passive investing, S&P 500 tracking, and low-cost diversification.",
    subcategorySlug: "mutual-funds",
    primaryKeyword: "index funds explained",
    publishPriority: 93,
    authorityUrls: [
      { url: "https://www.investopedia.com/terms/i/indexfund.asp", name: "Investopedia Index Funds", authority: "encyclopedic" },
      { url: "https://en.wikipedia.org/wiki/Index_fund", name: "Wikipedia Index Fund", authority: "encyclopedic" },
      { url: "https://en.wikipedia.org/wiki/Mutual_fund", name: "Wikipedia Mutual Fund", authority: "encyclopedic" },
    ],
  },
  {
    slug: "expense-ratio-explained",
    title: "Expense Ratio Explained",
    subtitle: "Fund fees, TER, and how costs eat into long-term returns.",
    subcategorySlug: "mutual-funds",
    primaryKeyword: "expense ratio explained",
    publishPriority: 76,
    authorityUrls: [
      { url: "https://www.investopedia.com/terms/e/expenseratio.asp", name: "Investopedia Expense Ratio", authority: "encyclopedic" },
    ],
  },
  {
    slug: "etf-vs-mutual-fund",
    title: "ETF vs Mutual Fund",
    subtitle: "Trading, taxes, fees, and which fits your investing style.",
    subcategorySlug: "mutual-funds",
    primaryKeyword: "etf vs mutual fund",
    publishPriority: 84,
    authorityUrls: [
      { url: "https://www.investopedia.com/articles/investing/122315/etf-vs-mutual-fund.asp", name: "Investopedia ETF vs MF", authority: "encyclopedic" },
    ],
  },
  {
    slug: "target-date-funds",
    title: "Target-Date Funds Explained",
    subtitle: "Glide paths, retirement year funds, and set-and-forget investing.",
    subcategorySlug: "mutual-funds",
    primaryKeyword: "target date fund explained",
    publishPriority: 69,
    authorityUrls: [
      { url: "https://www.investopedia.com/terms/t/target-date_fund.asp", name: "Investopedia Target Date Fund", authority: "encyclopedic" },
    ],
  },
  {
    slug: "dollar-cost-averaging",
    title: "Dollar-Cost Averaging Explained",
    subtitle: "Regular investing, reducing timing risk, and long-term discipline.",
    subcategorySlug: "mutual-funds",
    primaryKeyword: "dollar cost averaging explained",
    publishPriority: 80,
    authorityUrls: [
      { url: "https://www.investopedia.com/terms/d/dollarcostaveraging.asp", name: "Investopedia DCA", authority: "encyclopedic" },
      { url: "https://en.wikipedia.org/wiki/Dollar-cost_averaging", name: "Wikipedia DCA", authority: "encyclopedic" },
    ],
  },

  // ── Personal Finance › Stock Market ───────────────────────────────────────
  {
    slug: "stock-market-basics",
    title: "Stock Market Basics",
    subtitle: "Shares, indices, exchanges, and how public markets work.",
    subcategorySlug: "stock-market",
    primaryKeyword: "stock market for beginners",
    publishPriority: 92,
    authorityUrls: [
      { url: "https://www.investopedia.com/terms/s/stockmarket.asp", name: "Investopedia Stock Market", authority: "encyclopedic" },
      { url: "https://en.wikipedia.org/wiki/Stock_market", name: "Wikipedia Stock Market", authority: "encyclopedic" },
    ],
  },
  {
    slug: "portfolio-diversification",
    title: "Portfolio Diversification",
    subtitle: "Spreading risk across assets, sectors, and geographies.",
    subcategorySlug: "stock-market",
    primaryKeyword: "portfolio diversification explained",
    publishPriority: 87,
    authorityUrls: [
      { url: "https://www.investopedia.com/terms/d/diversification.asp", name: "Investopedia Diversification", authority: "encyclopedic" },
      { url: "https://en.wikipedia.org/wiki/Diversification_(finance)", name: "Wikipedia Diversification", authority: "encyclopedic" },
    ],
  },
  {
    slug: "how-to-buy-stocks",
    title: "How to Buy Stocks",
    subtitle: "Brokerages, order types, and your first stock purchase.",
    subcategorySlug: "stock-market",
    primaryKeyword: "how to buy stocks",
    publishPriority: 85,
    authorityUrls: [
      { url: "https://www.investopedia.com/articles/basics/06/invest1000.asp", name: "Investopedia How to Buy Stocks", authority: "encyclopedic" },
    ],
  },
  {
    slug: "dividend-investing-basics",
    title: "Dividend Investing Basics",
    subtitle: "Yield, payout ratios, dividend aristocrats, and income strategies.",
    subcategorySlug: "stock-market",
    primaryKeyword: "dividend investing for beginners",
    publishPriority: 74,
    authorityUrls: [
      { url: "https://www.investopedia.com/terms/d/dividend.asp", name: "Investopedia Dividend", authority: "encyclopedic" },
    ],
  },
  {
    slug: "stock-market-indexes",
    title: "Stock Market Indexes Explained",
    subtitle: "S&P 500, Dow Jones, NASDAQ, and what indices measure.",
    subcategorySlug: "stock-market",
    primaryKeyword: "stock market index explained",
    publishPriority: 78,
    authorityUrls: [
      { url: "https://www.investopedia.com/terms/i/index.asp", name: "Investopedia Index", authority: "encyclopedic" },
      { url: "https://en.wikipedia.org/wiki/Stock_market_index", name: "Wikipedia Stock Index", authority: "encyclopedic" },
    ],
  },
  {
    slug: "bear-vs-bull-market",
    title: "Bear vs Bull Market",
    subtitle: "Market cycles, corrections, and how to navigate volatility.",
    subcategorySlug: "stock-market",
    primaryKeyword: "bull market vs bear market",
    publishPriority: 72,
    authorityUrls: [
      { url: "https://www.investopedia.com/terms/b/bullmarket.asp", name: "Investopedia Bull Market", authority: "encyclopedic" },
      { url: "https://www.investopedia.com/terms/b/bearmarket.asp", name: "Investopedia Bear Market", authority: "encyclopedic" },
    ],
  },

  // ── Health › Nutrition ──────────────────────────────────────────────────────
  {
    slug: "nutrition-fundamentals",
    title: "Nutrition Fundamentals",
    subtitle: "Macros, calories, and building a balanced diet.",
    subcategorySlug: "nutrition",
    primaryKeyword: "nutrition basics",
    publishPriority: 90,
    authorityUrls: [
      { url: "https://www.nutrition.gov/topics/basic-nutrition", name: "Nutrition.gov Basics", authority: "official" },
      { url: "https://en.wikipedia.org/wiki/Nutrition", name: "Wikipedia Nutrition", authority: "encyclopedic" },
    ],
  },
  {
    slug: "calorie-counting-basics",
    title: "Calorie Counting Basics",
    subtitle: "TDEE, deficits, and sustainable weight management.",
    subcategorySlug: "nutrition",
    primaryKeyword: "calorie counting guide",
    publishPriority: 82,
    authorityUrls: [
      { url: "https://en.wikipedia.org/wiki/Calorie", name: "Wikipedia Calorie", authority: "encyclopedic" },
      { url: "https://www.cdc.gov/healthyweight/losing_weight/index.html", name: "CDC Healthy Weight", authority: "official" },
    ],
  },
  {
    slug: "macronutrients-guide",
    title: "Macronutrients Guide",
    subtitle: "Protein, carbs, and fats — ratios, sources, and daily targets.",
    subcategorySlug: "nutrition",
    primaryKeyword: "macronutrients explained",
    publishPriority: 79,
    authorityUrls: [
      { url: "https://en.wikipedia.org/wiki/Macronutrient", name: "Wikipedia Macronutrient", authority: "encyclopedic" },
    ],
  },
  {
    slug: "protein-intake-guide",
    title: "Protein Intake Guide",
    subtitle: "Daily requirements, best sources, and muscle-building targets.",
    subcategorySlug: "nutrition",
    primaryKeyword: "how much protein per day",
    publishPriority: 77,
    authorityUrls: [
      { url: "https://en.wikipedia.org/wiki/Protein_(nutrient)", name: "Wikipedia Protein", authority: "encyclopedic" },
    ],
  },
  {
    slug: "healthy-meal-planning",
    title: "Healthy Meal Planning",
    subtitle: "Weekly prep, portion control, and budget-friendly nutrition.",
    subcategorySlug: "nutrition",
    primaryKeyword: "healthy meal planning",
    publishPriority: 73,
    authorityUrls: [
      { url: "https://www.nutrition.gov/topics/basic-nutrition/healthy-eating", name: "Nutrition.gov Healthy Eating", authority: "official" },
    ],
  },
  {
    slug: "vitamins-and-minerals",
    title: "Vitamins and Minerals Guide",
    subtitle: "Essential micronutrients, deficiencies, and food sources.",
    subcategorySlug: "nutrition",
    primaryKeyword: "vitamins and minerals guide",
    publishPriority: 70,
    authorityUrls: [
      { url: "https://en.wikipedia.org/wiki/Vitamin", name: "Wikipedia Vitamins", authority: "encyclopedic" },
      { url: "https://www.nutrition.gov/topics/basic-nutrition/vitamins-and-minerals", name: "Nutrition.gov Vitamins", authority: "official" },
    ],
  },

  // ── Health › Fitness ────────────────────────────────────────────────────────
  {
    slug: "strength-training-basics",
    title: "Strength Training Basics",
    subtitle: "Progressive overload, reps, sets, and recovery.",
    subcategorySlug: "fitness",
    primaryKeyword: "strength training for beginners",
    publishPriority: 87,
    authorityUrls: [
      { url: "https://en.wikipedia.org/wiki/Strength_training", name: "Wikipedia Strength Training", authority: "encyclopedic" },
      { url: "https://www.cdc.gov/physicalactivity/basics/adults/index.htm", name: "CDC Physical Activity", authority: "official" },
    ],
  },
  {
    slug: "cardio-fitness-guide",
    title: "Cardio Fitness Guide",
    subtitle: "Heart rate zones, walking, running, and endurance training.",
    subcategorySlug: "fitness",
    primaryKeyword: "cardio workout guide",
    publishPriority: 81,
    authorityUrls: [
      { url: "https://en.wikipedia.org/wiki/Cardiovascular_fitness", name: "Wikipedia Cardiovascular Fitness", authority: "encyclopedic" },
    ],
  },
  {
    slug: "beginner-workout-plan",
    title: "Beginner Workout Plan",
    subtitle: "A simple 3-day full-body routine for new gym-goers.",
    subcategorySlug: "fitness",
    primaryKeyword: "beginner workout plan",
    publishPriority: 83,
    authorityUrls: [
      { url: "https://www.cdc.gov/physicalactivity/basics/adults/index.htm", name: "CDC Physical Activity", authority: "official" },
    ],
  },
  {
    slug: "how-to-build-muscle",
    title: "How to Build Muscle",
    subtitle: "Hypertrophy principles, nutrition, and progressive overload.",
    subcategorySlug: "fitness",
    primaryKeyword: "how to build muscle",
    publishPriority: 85,
    authorityUrls: [
      { url: "https://en.wikipedia.org/wiki/Muscle_hypertrophy", name: "Wikipedia Muscle Hypertrophy", authority: "encyclopedic" },
    ],
  },
  {
    slug: "stretching-flexibility",
    title: "Stretching and Flexibility",
    subtitle: "Static vs dynamic stretches, mobility, and injury prevention.",
    subcategorySlug: "fitness",
    primaryKeyword: "stretching exercises guide",
    publishPriority: 68,
    authorityUrls: [
      { url: "https://en.wikipedia.org/wiki/Stretching", name: "Wikipedia Stretching", authority: "encyclopedic" },
    ],
  },
  {
    slug: "rest-and-recovery",
    title: "Rest and Recovery for Fitness",
    subtitle: "Sleep, rest days, active recovery, and avoiding overtraining.",
    subcategorySlug: "fitness",
    primaryKeyword: "workout recovery tips",
    publishPriority: 66,
    authorityUrls: [
      { url: "https://en.wikipedia.org/wiki/Overtraining", name: "Wikipedia Overtraining", authority: "encyclopedic" },
    ],
  },

  // ── Health › Mental Health ──────────────────────────────────────────────────
  {
    slug: "stress-management-basics",
    title: "Stress Management Basics",
    subtitle: "Practical coping strategies — not a substitute for professional care.",
    subcategorySlug: "mental-health",
    primaryKeyword: "stress management techniques",
    publishPriority: 86,
    authorityUrls: [
      { url: "https://en.wikipedia.org/wiki/Stress_management", name: "Wikipedia Stress Management", authority: "encyclopedic" },
      { url: "https://www.nimh.nih.gov/health/publications/so-stressed-out-fact-sheet", name: "NIMH Stress", authority: "official" },
    ],
  },
  {
    slug: "mental-wellness-fundamentals",
    title: "Mental Wellness Fundamentals",
    subtitle: "Sleep, mindfulness, social connection, and when to seek support.",
    subcategorySlug: "mental-health",
    primaryKeyword: "mental wellness tips",
    publishPriority: 80,
    authorityUrls: [
      { url: "https://en.wikipedia.org/wiki/Mental_health", name: "Wikipedia Mental Health", authority: "encyclopedic" },
    ],
  },
  {
    slug: "anxiety-management-techniques",
    title: "Anxiety Management Techniques",
    subtitle: "Breathing exercises, grounding, and evidence-based coping tools.",
    subcategorySlug: "mental-health",
    primaryKeyword: "anxiety management techniques",
    publishPriority: 84,
    authorityUrls: [
      { url: "https://en.wikipedia.org/wiki/Anxiety", name: "Wikipedia Anxiety", authority: "encyclopedic" },
      { url: "https://www.nimh.nih.gov/health/topics/anxiety-disorders", name: "NIMH Anxiety", authority: "official" },
    ],
  },
  {
    slug: "sleep-hygiene-guide",
    title: "Sleep Hygiene Guide",
    subtitle: "Better sleep habits, routines, and common disruptors.",
    subcategorySlug: "mental-health",
    primaryKeyword: "sleep hygiene tips",
    publishPriority: 82,
    authorityUrls: [
      { url: "https://en.wikipedia.org/wiki/Sleep_hygiene", name: "Wikipedia Sleep Hygiene", authority: "encyclopedic" },
      { url: "https://www.cdc.gov/sleep/about/index.html", name: "CDC Sleep", authority: "official" },
    ],
  },
  {
    slug: "mindfulness-for-beginners",
    title: "Mindfulness for Beginners",
    subtitle: "Present-moment awareness, meditation basics, and daily practice.",
    subcategorySlug: "mental-health",
    primaryKeyword: "mindfulness for beginners",
    publishPriority: 75,
    authorityUrls: [
      { url: "https://en.wikipedia.org/wiki/Mindfulness", name: "Wikipedia Mindfulness", authority: "encyclopedic" },
    ],
  },
  {
    slug: "work-life-balance",
    title: "Work-Life Balance Guide",
    subtitle: "Boundaries, burnout prevention, and sustainable productivity.",
    subcategorySlug: "mental-health",
    primaryKeyword: "work life balance tips",
    publishPriority: 71,
    authorityUrls: [
      { url: "https://en.wikipedia.org/wiki/Work%E2%80%93life_balance", name: "Wikipedia Work-Life Balance", authority: "encyclopedic" },
    ],
  },
];

// ── Lookup helpers ────────────────────────────────────────────────────────────

export const PHASE_1_SEED_SLUG_SET = new Set(PHASE_1_SEED_TOPICS.map((t) => t.slug));

const SEED_BY_SLUG = new Map(PHASE_1_SEED_TOPICS.map((t) => [t.slug, t]));

export function getPhase1SeedTopic(slug: string): Phase1SeedTopic | undefined {
  return SEED_BY_SLUG.get(slug);
}

export function getPhase1SeedPublishPriority(slug: string): number {
  return SEED_BY_SLUG.get(slug)?.publishPriority ?? 0;
}

export function getPhase1SeedsForSubcategory(subcategorySlug: string): Phase1SeedTopic[] {
  return PHASE_1_SEED_TOPICS.filter((t) => t.subcategorySlug === subcategorySlug);
}

export function getPhase1AuthorityUrlsForSlug(
  slug: string
): Phase1SeedTopic["authorityUrls"] {
  return SEED_BY_SLUG.get(slug)?.authorityUrls ?? [];
}

/** Top N seed slugs for initial brain publish batch. */
export function getTopPhase1SeedSlugs(limit = 10): string[] {
  return [...PHASE_1_SEED_TOPICS]
    .sort((a, b) => b.publishPriority - a.publishPriority)
    .slice(0, limit)
    .map((t) => t.slug);
}

/** Validate all seeds belong to active Phase-1 subcategories. */
export function validatePhase1SeedTopics(): string[] {
  const errors: string[] = [];
  const activeSet = new Set<string>(PHASE_1_ACTIVE_SUBCATEGORY_SLUGS);
  for (const seed of PHASE_1_SEED_TOPICS) {
    if (!activeSet.has(seed.subcategorySlug)) {
      errors.push(`${seed.slug}: subcategory "${seed.subcategorySlug}" not in Phase-1`);
    }
    if (seed.authorityUrls.length === 0) {
      errors.push(`${seed.slug}: no authority URLs`);
    }
  }
  return errors;
}
