import { createAdminClient } from "@/lib/supabase/admin";
import { classifyTopicDomain, type TopicDomain } from "@/services/intelligence/topicDomainClassifier";
import {
  classifySearchIntent,
  classifyReaderLevel,
  type SearchIntent,
  type ReaderLevel,
} from "@/services/intelligence/topicSearchIntentClassifier";

export interface ArticleExpansionPlan {
  title: string;
  articleType: "guide" | "explainer" | "comparison" | "tutorial" | "reference" | "review";
  intent: "informational" | "commercial" | "transactional";
  priorityScore: number;
  keyword: string; // the exact keyword the research agent should use
}

// ─── Entity-type specific article plans ───────────────────────────────────────
// Each entity type produces a distinct roadmap matching what learners actually
// search for. NO generic templates across entity types.

// ── Technology ─────────────────────────────────────────────────────────────────

function plans_tech_programming_language(t: string): ArticleExpansionPlan[] {
  return [
    { title: `What Is ${t}?`, keyword: `What is ${t}`, articleType: "explainer", intent: "informational", priorityScore: 98 },
    { title: `${t} Tutorial for Beginners`, keyword: `${t} tutorial beginners`, articleType: "tutorial", intent: "informational", priorityScore: 95 },
    { title: `${t} Syntax and Basic Concepts`, keyword: `${t} syntax basics`, articleType: "reference", intent: "informational", priorityScore: 91 },
    { title: `${t} Data Types and Variables`, keyword: `${t} data types variables`, articleType: "tutorial", intent: "informational", priorityScore: 88 },
    { title: `${t} Functions Explained`, keyword: `${t} functions`, articleType: "tutorial", intent: "informational", priorityScore: 85 },
    { title: `${t} vs Other Languages`, keyword: `${t} vs other languages`, articleType: "comparison", intent: "informational", priorityScore: 82 },
    { title: `${t} Use Cases and Applications`, keyword: `${t} use cases`, articleType: "guide", intent: "informational", priorityScore: 78 },
    { title: `${t} Best Practices`, keyword: `${t} best practices`, articleType: "guide", intent: "informational", priorityScore: 74 },
    { title: `Common ${t} Errors and How to Fix Them`, keyword: `${t} common errors`, articleType: "guide", intent: "informational", priorityScore: 70 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plans_tech_framework(t: string): ArticleExpansionPlan[] {
  return [
    { title: `What Is ${t}?`, keyword: `What is ${t}`, articleType: "explainer", intent: "informational", priorityScore: 98 },
    { title: `${t} Getting Started Guide`, keyword: `${t} getting started`, articleType: "tutorial", intent: "informational", priorityScore: 94 },
    { title: `${t} Core Concepts`, keyword: `${t} core concepts`, articleType: "explainer", intent: "informational", priorityScore: 90 },
    { title: `${t} Project Structure`, keyword: `${t} project structure`, articleType: "guide", intent: "informational", priorityScore: 86 },
    { title: `${t} vs Alternatives`, keyword: `${t} vs alternatives`, articleType: "comparison", intent: "informational", priorityScore: 83 },
    { title: `${t} Best Practices`, keyword: `${t} best practices`, articleType: "guide", intent: "informational", priorityScore: 79 },
    { title: `${t} Performance Optimization`, keyword: `${t} performance optimization`, articleType: "guide", intent: "informational", priorityScore: 75 },
    { title: `Common ${t} Mistakes`, keyword: `${t} common mistakes`, articleType: "guide", intent: "informational", priorityScore: 71 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plans_tech_tool_cli(t: string): ArticleExpansionPlan[] {
  return [
    { title: `What Is ${t}?`, keyword: `What is ${t}`, articleType: "explainer", intent: "informational", priorityScore: 98 },
    { title: `How ${t} Works`, keyword: `How ${t} works`, articleType: "explainer", intent: "informational", priorityScore: 94 },
    { title: `${t} Installation and Setup`, keyword: `How to install ${t}`, articleType: "tutorial", intent: "informational", priorityScore: 90 },
    { title: `${t} Commands Cheat Sheet`, keyword: `${t} commands`, articleType: "reference", intent: "informational", priorityScore: 87 },
    { title: `${t} Architecture Explained`, keyword: `${t} architecture`, articleType: "explainer", intent: "informational", priorityScore: 83 },
    { title: `${t} Best Practices`, keyword: `${t} best practices`, articleType: "guide", intent: "informational", priorityScore: 79 },
    { title: `${t} vs Alternatives`, keyword: `${t} vs alternatives`, articleType: "comparison", intent: "informational", priorityScore: 75 },
    { title: `Common ${t} Errors and Fixes`, keyword: `${t} common errors`, articleType: "guide", intent: "informational", priorityScore: 71 },
    { title: `${t} Security Best Practices`, keyword: `${t} security`, articleType: "guide", intent: "informational", priorityScore: 67 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 62 },
  ];
}

function plans_tech_cloud_service(t: string): ArticleExpansionPlan[] {
  return [
    { title: `What Is ${t}?`, keyword: `What is ${t}`, articleType: "explainer", intent: "informational", priorityScore: 98 },
    { title: `${t} Getting Started`, keyword: `${t} getting started`, articleType: "tutorial", intent: "informational", priorityScore: 93 },
    { title: `${t} Pricing Explained`, keyword: `${t} pricing`, articleType: "guide", intent: "commercial", priorityScore: 89 },
    { title: `${t} vs Competitors`, keyword: `${t} vs`, articleType: "comparison", intent: "informational", priorityScore: 85 },
    { title: `${t} Use Cases`, keyword: `${t} use cases`, articleType: "guide", intent: "informational", priorityScore: 81 },
    { title: `${t} Security and Compliance`, keyword: `${t} security compliance`, articleType: "guide", intent: "informational", priorityScore: 77 },
    { title: `${t} Best Practices`, keyword: `${t} best practices`, articleType: "guide", intent: "informational", priorityScore: 73 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plans_tech_database(t: string): ArticleExpansionPlan[] {
  return [
    { title: `What Is ${t}?`, keyword: `What is ${t}`, articleType: "explainer", intent: "informational", priorityScore: 98 },
    { title: `${t} Installation and Setup`, keyword: `How to install ${t}`, articleType: "tutorial", intent: "informational", priorityScore: 93 },
    { title: `${t} Query Examples`, keyword: `${t} query examples`, articleType: "reference", intent: "informational", priorityScore: 89 },
    { title: `${t} vs Alternatives`, keyword: `${t} vs`, articleType: "comparison", intent: "informational", priorityScore: 85 },
    { title: `${t} Indexing and Performance`, keyword: `${t} indexing performance`, articleType: "guide", intent: "informational", priorityScore: 81 },
    { title: `${t} Best Practices`, keyword: `${t} best practices`, articleType: "guide", intent: "informational", priorityScore: 77 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plans_tech_programming_concept(t: string): ArticleExpansionPlan[] {
  return [
    { title: `What Is ${t}?`, keyword: `What is ${t}`, articleType: "explainer", intent: "informational", priorityScore: 98 },
    { title: `How ${t} Works`, keyword: `How ${t} works`, articleType: "explainer", intent: "informational", priorityScore: 93 },
    { title: `${t} with Examples`, keyword: `${t} examples`, articleType: "tutorial", intent: "informational", priorityScore: 89 },
    { title: `${t} Interview Questions`, keyword: `${t} interview questions`, articleType: "guide", intent: "informational", priorityScore: 85 },
    { title: `${t} Best Practices`, keyword: `${t} best practices`, articleType: "guide", intent: "informational", priorityScore: 80 },
    { title: `${t} vs Related Concepts`, keyword: `${t} vs`, articleType: "comparison", intent: "informational", priorityScore: 75 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

// ── Finance ────────────────────────────────────────────────────────────────────

function plans_finance_investment_instrument(t: string): ArticleExpansionPlan[] {
  return [
    { title: `What Is ${t}?`, keyword: `What is ${t}`, articleType: "explainer", intent: "informational", priorityScore: 98 },
    { title: `How ${t} Works`, keyword: `How ${t} works`, articleType: "explainer", intent: "informational", priorityScore: 93 },
    { title: `${t} Pros and Cons`, keyword: `${t} pros and cons`, articleType: "guide", intent: "informational", priorityScore: 89 },
    { title: `How to Invest in ${t}`, keyword: `How to invest in ${t}`, articleType: "tutorial", intent: "informational", priorityScore: 85 },
    { title: `${t} vs Alternatives`, keyword: `${t} vs`, articleType: "comparison", intent: "informational", priorityScore: 82 },
    { title: `${t} Tax Treatment`, keyword: `${t} tax`, articleType: "guide", intent: "informational", priorityScore: 78 },
    { title: `Best ${t} to Buy`, keyword: `best ${t}`, articleType: "guide", intent: "commercial", priorityScore: 74 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plans_finance_financial_formula(t: string): ArticleExpansionPlan[] {
  return [
    { title: `What Is ${t}?`, keyword: `What is ${t}`, articleType: "explainer", intent: "informational", priorityScore: 98 },
    { title: `${t} Formula Explained`, keyword: `${t} formula`, articleType: "reference", intent: "informational", priorityScore: 96 },
    { title: `${t} Calculator: Step-by-Step Examples`, keyword: `${t} calculator examples`, articleType: "tutorial", intent: "informational", priorityScore: 93 },
    { title: `${t}: Real-World Examples`, keyword: `${t} examples`, articleType: "guide", intent: "informational", priorityScore: 89 },
    { title: `${t} vs Simple Alternatives`, keyword: `${t} vs`, articleType: "comparison", intent: "informational", priorityScore: 84 },
    { title: `How to Use ${t} in Investing`, keyword: `${t} investing`, articleType: "guide", intent: "informational", priorityScore: 80 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plans_finance_investment_strategy(t: string): ArticleExpansionPlan[] {
  return [
    { title: `What Is ${t}?`, keyword: `What is ${t}`, articleType: "explainer", intent: "informational", priorityScore: 98 },
    { title: `How to Implement ${t}`, keyword: `How to use ${t}`, articleType: "tutorial", intent: "informational", priorityScore: 93 },
    { title: `${t}: Step-by-Step Guide`, keyword: `${t} step by step`, articleType: "guide", intent: "informational", priorityScore: 89 },
    { title: `${t} Pros and Cons`, keyword: `${t} pros and cons`, articleType: "guide", intent: "informational", priorityScore: 85 },
    { title: `${t} vs Other Strategies`, keyword: `${t} vs`, articleType: "comparison", intent: "informational", priorityScore: 81 },
    { title: `${t} for Beginners`, keyword: `${t} for beginners`, articleType: "guide", intent: "informational", priorityScore: 77 },
    { title: `${t} Mistakes to Avoid`, keyword: `${t} mistakes`, articleType: "guide", intent: "informational", priorityScore: 72 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plans_finance_banking_product(t: string): ArticleExpansionPlan[] {
  return [
    { title: `What Is ${t}?`, keyword: `What is ${t}`, articleType: "explainer", intent: "informational", priorityScore: 98 },
    { title: `How ${t} Works`, keyword: `How ${t} works`, articleType: "explainer", intent: "informational", priorityScore: 93 },
    { title: `${t} Eligibility Requirements`, keyword: `${t} eligibility requirements`, articleType: "guide", intent: "informational", priorityScore: 89 },
    { title: `${t} Fees and Costs Explained`, keyword: `${t} fees costs`, articleType: "guide", intent: "informational", priorityScore: 85 },
    { title: `How to Apply for ${t}`, keyword: `How to apply for ${t}`, articleType: "tutorial", intent: "informational", priorityScore: 82 },
    { title: `${t} vs Alternatives`, keyword: `${t} vs alternatives`, articleType: "comparison", intent: "informational", priorityScore: 78 },
    { title: `${t} Pros and Cons`, keyword: `${t} pros and cons`, articleType: "guide", intent: "informational", priorityScore: 74 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plans_finance_tax_concept(t: string): ArticleExpansionPlan[] {
  return [
    { title: `What Is ${t}?`, keyword: `What is ${t}`, articleType: "explainer", intent: "informational", priorityScore: 98 },
    { title: `How ${t} Works`, keyword: `How ${t} works`, articleType: "explainer", intent: "informational", priorityScore: 93 },
    { title: `${t} Rates and Brackets`, keyword: `${t} rates`, articleType: "reference", intent: "informational", priorityScore: 89 },
    { title: `How to Reduce ${t}`, keyword: `How to reduce ${t}`, articleType: "guide", intent: "informational", priorityScore: 86 },
    { title: `${t} Examples and Calculations`, keyword: `${t} examples calculation`, articleType: "tutorial", intent: "informational", priorityScore: 82 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plans_finance_market_concept(t: string): ArticleExpansionPlan[] {
  return [
    { title: `What Is ${t}?`, keyword: `What is ${t}`, articleType: "explainer", intent: "informational", priorityScore: 98 },
    { title: `How ${t} Works`, keyword: `How ${t} works`, articleType: "explainer", intent: "informational", priorityScore: 93 },
    { title: `${t}: Causes and Effects`, keyword: `${t} causes effects`, articleType: "guide", intent: "informational", priorityScore: 88 },
    { title: `How ${t} Affects Investors`, keyword: `${t} impact investors`, articleType: "guide", intent: "informational", priorityScore: 84 },
    { title: `${t} Historical Examples`, keyword: `${t} historical examples`, articleType: "guide", intent: "informational", priorityScore: 79 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

// ── Health ─────────────────────────────────────────────────────────────────────

function plans_health_disease(t: string): ArticleExpansionPlan[] {
  return [
    { title: `What Is ${t}?`, keyword: `What is ${t}`, articleType: "explainer", intent: "informational", priorityScore: 98 },
    { title: `${t} Symptoms`, keyword: `${t} symptoms`, articleType: "guide", intent: "informational", priorityScore: 96 },
    { title: `${t} Causes and Risk Factors`, keyword: `${t} causes risk factors`, articleType: "guide", intent: "informational", priorityScore: 92 },
    { title: `How ${t} Is Diagnosed`, keyword: `${t} diagnosis`, articleType: "guide", intent: "informational", priorityScore: 88 },
    { title: `${t} Treatment Options`, keyword: `${t} treatment options`, articleType: "guide", intent: "informational", priorityScore: 94 },
    { title: `${t} Medications`, keyword: `${t} medications`, articleType: "guide", intent: "informational", priorityScore: 85 },
    { title: `${t} Complications`, keyword: `${t} complications`, articleType: "guide", intent: "informational", priorityScore: 81 },
    { title: `Living With ${t}`, keyword: `living with ${t}`, articleType: "guide", intent: "informational", priorityScore: 77 },
    { title: `${t} Diet and Lifestyle`, keyword: `${t} diet lifestyle`, articleType: "guide", intent: "informational", priorityScore: 73 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plans_health_medication(t: string): ArticleExpansionPlan[] {
  return [
    { title: `What Is ${t}?`, keyword: `What is ${t}`, articleType: "explainer", intent: "informational", priorityScore: 98 },
    { title: `How ${t} Works`, keyword: `How ${t} works`, articleType: "explainer", intent: "informational", priorityScore: 93 },
    { title: `${t} Uses and Indications`, keyword: `${t} uses`, articleType: "guide", intent: "informational", priorityScore: 89 },
    { title: `${t} Dosage and Administration`, keyword: `${t} dosage`, articleType: "reference", intent: "informational", priorityScore: 86 },
    { title: `${t} Side Effects`, keyword: `${t} side effects`, articleType: "guide", intent: "informational", priorityScore: 93 },
    { title: `${t} vs Alternatives`, keyword: `${t} vs alternatives`, articleType: "comparison", intent: "informational", priorityScore: 82 },
    { title: `Who Should Not Take ${t}`, keyword: `${t} contraindications`, articleType: "guide", intent: "informational", priorityScore: 78 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plans_health_nutrition_topic(t: string): ArticleExpansionPlan[] {
  return [
    { title: `What Is ${t}?`, keyword: `What is ${t}`, articleType: "explainer", intent: "informational", priorityScore: 98 },
    { title: `${t} Health Benefits`, keyword: `${t} health benefits`, articleType: "guide", intent: "informational", priorityScore: 94 },
    { title: `${t} Recommended Daily Amount`, keyword: `${t} recommended daily amount`, articleType: "reference", intent: "informational", priorityScore: 90 },
    { title: `Best Food Sources of ${t}`, keyword: `foods high in ${t}`, articleType: "guide", intent: "informational", priorityScore: 86 },
    { title: `${t} Deficiency: Signs and Symptoms`, keyword: `${t} deficiency symptoms`, articleType: "guide", intent: "informational", priorityScore: 83 },
    { title: `${t} Supplements: Do You Need Them?`, keyword: `${t} supplements`, articleType: "guide", intent: "informational", priorityScore: 79 },
    { title: `${t} Toxicity and Overdose`, keyword: `${t} toxicity overdose`, articleType: "guide", intent: "informational", priorityScore: 74 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plans_health_fitness_topic(t: string): ArticleExpansionPlan[] {
  return [
    { title: `What Is ${t}?`, keyword: `What is ${t}`, articleType: "explainer", intent: "informational", priorityScore: 98 },
    { title: `${t} for Beginners`, keyword: `${t} for beginners`, articleType: "tutorial", intent: "informational", priorityScore: 93 },
    { title: `${t} Benefits`, keyword: `${t} benefits`, articleType: "guide", intent: "informational", priorityScore: 89 },
    { title: `${t} Workout Plan`, keyword: `${t} workout plan`, articleType: "guide", intent: "informational", priorityScore: 85 },
    { title: `${t} Common Mistakes`, keyword: `${t} common mistakes`, articleType: "guide", intent: "informational", priorityScore: 81 },
    { title: `${t} vs Alternatives`, keyword: `${t} vs`, articleType: "comparison", intent: "informational", priorityScore: 77 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plans_health_medical_concept(t: string): ArticleExpansionPlan[] {
  return [
    { title: `What Is ${t}?`, keyword: `What is ${t}`, articleType: "explainer", intent: "informational", priorityScore: 98 },
    { title: `Normal vs Abnormal ${t} Levels`, keyword: `${t} normal range`, articleType: "reference", intent: "informational", priorityScore: 94 },
    { title: `What Affects ${t}?`, keyword: `What affects ${t}`, articleType: "guide", intent: "informational", priorityScore: 89 },
    { title: `How to Improve ${t}`, keyword: `How to improve ${t}`, articleType: "guide", intent: "informational", priorityScore: 85 },
    { title: `${t} and Disease Risk`, keyword: `${t} disease risk`, articleType: "guide", intent: "informational", priorityScore: 81 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

// ── Other domains ──────────────────────────────────────────────────────────────

function plans_movie_tv(t: string): ArticleExpansionPlan[] {
  return [
    { title: `${t}: Complete Guide`, keyword: `${t}`, articleType: "guide", intent: "informational", priorityScore: 98 },
    { title: `${t} Cast and Characters`, keyword: `${t} cast`, articleType: "guide", intent: "informational", priorityScore: 90 },
    { title: `${t} Plot Summary`, keyword: `${t} plot summary`, articleType: "explainer", intent: "informational", priorityScore: 86 },
    { title: `${t} Episodes Guide`, keyword: `${t} episodes`, articleType: "reference", intent: "informational", priorityScore: 82 },
    { title: `Where to Watch ${t}`, keyword: `Where to watch ${t}`, articleType: "guide", intent: "informational", priorityScore: 88 },
    { title: `${t} Review`, keyword: `${t} review`, articleType: "review", intent: "informational", priorityScore: 84 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 68 },
  ];
}

function plans_historical_event(t: string): ArticleExpansionPlan[] {
  return [
    { title: `${t}: Overview and Summary`, keyword: `${t} overview`, articleType: "explainer", intent: "informational", priorityScore: 98 },
    { title: `Causes of ${t}`, keyword: `causes of ${t}`, articleType: "guide", intent: "informational", priorityScore: 93 },
    { title: `${t} Timeline of Key Events`, keyword: `${t} timeline`, articleType: "reference", intent: "informational", priorityScore: 89 },
    { title: `Key Figures in ${t}`, keyword: `key figures ${t}`, articleType: "guide", intent: "informational", priorityScore: 84 },
    { title: `Consequences of ${t}`, keyword: `consequences of ${t}`, articleType: "guide", intent: "informational", priorityScore: 80 },
    { title: `${t}: Historical Significance`, keyword: `${t} significance`, articleType: "guide", intent: "informational", priorityScore: 75 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plans_place_travel(t: string): ArticleExpansionPlan[] {
  return [
    { title: `${t}: Complete Visitor Guide`, keyword: `${t} visitor guide`, articleType: "guide", intent: "informational", priorityScore: 98 },
    { title: `${t} History and Background`, keyword: `${t} history`, articleType: "guide", intent: "informational", priorityScore: 90 },
    { title: `Top Things to See at ${t}`, keyword: `things to see at ${t}`, articleType: "guide", intent: "informational", priorityScore: 86 },
    { title: `How to Get to ${t}`, keyword: `How to get to ${t}`, articleType: "guide", intent: "informational", priorityScore: 82 },
    { title: `Best Time to Visit ${t}`, keyword: `best time to visit ${t}`, articleType: "guide", intent: "informational", priorityScore: 78 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plans_product_review(t: string): ArticleExpansionPlan[] {
  return [
    { title: `${t}: Complete Review`, keyword: `${t} review`, articleType: "review", intent: "commercial", priorityScore: 98 },
    { title: `${t} Specifications`, keyword: `${t} specifications`, articleType: "reference", intent: "informational", priorityScore: 92 },
    { title: `${t} Pros and Cons`, keyword: `${t} pros and cons`, articleType: "guide", intent: "commercial", priorityScore: 88 },
    { title: `${t} vs Competitors`, keyword: `${t} vs`, articleType: "comparison", intent: "commercial", priorityScore: 84 },
    { title: `Is ${t} Worth It?`, keyword: `Is ${t} worth buying`, articleType: "guide", intent: "commercial", priorityScore: 80 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plans_educational_general(t: string): ArticleExpansionPlan[] {
  return [
    { title: `What Is ${t}?`, keyword: `What is ${t}`, articleType: "explainer", intent: "informational", priorityScore: 98 },
    { title: `How ${t} Works`, keyword: `How ${t} works`, articleType: "explainer", intent: "informational", priorityScore: 92 },
    { title: `${t}: Real-World Examples`, keyword: `${t} examples`, articleType: "guide", intent: "informational", priorityScore: 87 },
    { title: `${t} Pros and Cons`, keyword: `${t} advantages disadvantages`, articleType: "guide", intent: "informational", priorityScore: 82 },
    { title: `${t} vs Related Concepts`, keyword: `${t} vs`, articleType: "comparison", intent: "informational", priorityScore: 77 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

// ─── Intent + Level override roadmaps ─────────────────────────────────────────
// These are shared across entity types when intent is strongly detected.
// They override the entity-default roadmap.

function plans_intent_comparison(t: string): ArticleExpansionPlan[] {
  return [
    { title: `${t}: Complete Comparison`, keyword: `${t} comparison`, articleType: "comparison", intent: "informational", priorityScore: 98 },
    { title: `${t} Feature Comparison Table`, keyword: `${t} features table`, articleType: "reference", intent: "informational", priorityScore: 94 },
    { title: `${t} Use Cases`, keyword: `${t} use cases`, articleType: "guide", intent: "informational", priorityScore: 90 },
    { title: `${t} Pros and Cons`, keyword: `${t} pros and cons`, articleType: "guide", intent: "informational", priorityScore: 86 },
    { title: `Which Should You Choose? Decision Guide`, keyword: `${t} which to choose`, articleType: "guide", intent: "informational", priorityScore: 82 },
    { title: `${t} Performance Benchmarks`, keyword: `${t} performance benchmark`, articleType: "reference", intent: "informational", priorityScore: 78 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plans_intent_reference(t: string, entity: TopicDomain): ArticleExpansionPlan[] {
  const isTech = entity.startsWith("tech_");
  if (isTech) {
    return [
      { title: `${t} Cheat Sheet`, keyword: `${t} cheat sheet`, articleType: "reference", intent: "informational", priorityScore: 98 },
      { title: `${t} Command Reference`, keyword: `${t} all commands`, articleType: "reference", intent: "informational", priorityScore: 94 },
      { title: `${t} with Examples`, keyword: `${t} examples`, articleType: "tutorial", intent: "informational", priorityScore: 90 },
      { title: `${t} Flags and Options Explained`, keyword: `${t} flags options`, articleType: "reference", intent: "informational", priorityScore: 86 },
      { title: `${t} Common Patterns`, keyword: `${t} common patterns`, articleType: "guide", intent: "informational", priorityScore: 80 },
      { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
    ];
  }
  return [
    { title: `${t}: Complete Reference`, keyword: `${t} reference`, articleType: "reference", intent: "informational", priorityScore: 98 },
    { title: `${t} Key Terms and Definitions`, keyword: `${t} key terms`, articleType: "reference", intent: "informational", priorityScore: 90 },
    { title: `${t} Examples`, keyword: `${t} examples`, articleType: "guide", intent: "informational", priorityScore: 84 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plans_intent_troubleshooting(t: string): ArticleExpansionPlan[] {
  return [
    { title: `${t}: Common Errors and Fixes`, keyword: `${t} errors fixes`, articleType: "guide", intent: "informational", priorityScore: 98 },
    { title: `How to Debug ${t}`, keyword: `how to debug ${t}`, articleType: "tutorial", intent: "informational", priorityScore: 94 },
    { title: `${t} Error Messages Explained`, keyword: `${t} error messages`, articleType: "reference", intent: "informational", priorityScore: 90 },
    { title: `${t} Troubleshooting Checklist`, keyword: `${t} troubleshooting checklist`, articleType: "guide", intent: "informational", priorityScore: 86 },
    { title: `Why Is ${t} Not Working?`, keyword: `why is ${t} not working`, articleType: "guide", intent: "informational", priorityScore: 82 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plans_intent_calculator(t: string): ArticleExpansionPlan[] {
  return [
    { title: `${t} Formula Explained`, keyword: `${t} formula`, articleType: "reference", intent: "informational", priorityScore: 98 },
    { title: `How to Calculate ${t}`, keyword: `how to calculate ${t}`, articleType: "tutorial", intent: "informational", priorityScore: 95 },
    { title: `${t} Calculator: Step-by-Step`, keyword: `${t} calculator step by step`, articleType: "tutorial", intent: "informational", priorityScore: 92 },
    { title: `${t} Examples with Numbers`, keyword: `${t} examples`, articleType: "guide", intent: "informational", priorityScore: 88 },
    { title: `${t} vs Related Formulas`, keyword: `${t} vs`, articleType: "comparison", intent: "informational", priorityScore: 82 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plans_intent_checklist(t: string): ArticleExpansionPlan[] {
  return [
    { title: `${t} Checklist`, keyword: `${t} checklist`, articleType: "guide", intent: "informational", priorityScore: 98 },
    { title: `${t} Step-by-Step Process`, keyword: `${t} step by step`, articleType: "tutorial", intent: "informational", priorityScore: 94 },
    { title: `${t} Best Practices`, keyword: `${t} best practices`, articleType: "guide", intent: "informational", priorityScore: 88 },
    { title: `${t} Common Mistakes`, keyword: `${t} common mistakes`, articleType: "guide", intent: "informational", priorityScore: 84 },
    { title: `${t} Template`, keyword: `${t} template`, articleType: "reference", intent: "informational", priorityScore: 80 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plans_intent_review(t: string): ArticleExpansionPlan[] {
  return [
    { title: `${t}: Honest Review`, keyword: `${t} review`, articleType: "review", intent: "commercial", priorityScore: 98 },
    { title: `Is ${t} Worth It?`, keyword: `is ${t} worth it`, articleType: "guide", intent: "commercial", priorityScore: 94 },
    { title: `${t} Pros and Cons`, keyword: `${t} pros and cons`, articleType: "guide", intent: "commercial", priorityScore: 90 },
    { title: `${t} vs Alternatives`, keyword: `${t} vs alternatives`, articleType: "comparison", intent: "commercial", priorityScore: 86 },
    { title: `Who Should Use ${t}?`, keyword: `who should use ${t}`, articleType: "guide", intent: "informational", priorityScore: 82 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

// Level-specific tutorial roadmaps for technology
function plans_tutorial_tech_beginner(t: string): ArticleExpansionPlan[] {
  return [
    { title: `${t} for Beginners: Complete Guide`, keyword: `${t} for beginners`, articleType: "tutorial", intent: "informational", priorityScore: 98 },
    { title: `How to Install ${t}`, keyword: `how to install ${t}`, articleType: "tutorial", intent: "informational", priorityScore: 94 },
    { title: `${t} Basics: Your First Steps`, keyword: `${t} basics first steps`, articleType: "tutorial", intent: "informational", priorityScore: 90 },
    { title: `${t} Syntax and Core Concepts`, keyword: `${t} syntax core concepts`, articleType: "tutorial", intent: "informational", priorityScore: 86 },
    { title: `Your First ${t} Project`, keyword: `first ${t} project`, articleType: "tutorial", intent: "informational", priorityScore: 83 },
    { title: `Common ${t} Beginner Mistakes`, keyword: `${t} beginner mistakes`, articleType: "guide", intent: "informational", priorityScore: 78 },
    { title: `${t} Exercises for Beginners`, keyword: `${t} exercises beginners`, articleType: "tutorial", intent: "informational", priorityScore: 74 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plans_tutorial_tech_intermediate(t: string): ArticleExpansionPlan[] {
  return [
    { title: `${t} Practical Guide`, keyword: `${t} practical guide`, articleType: "tutorial", intent: "informational", priorityScore: 98 },
    { title: `${t} Real-World Project Tutorial`, keyword: `${t} real world project`, articleType: "tutorial", intent: "informational", priorityScore: 94 },
    { title: `${t} Design Patterns`, keyword: `${t} design patterns`, articleType: "guide", intent: "informational", priorityScore: 90 },
    { title: `${t} Testing and Debugging`, keyword: `${t} testing debugging`, articleType: "tutorial", intent: "informational", priorityScore: 86 },
    { title: `${t} Best Practices`, keyword: `${t} best practices`, articleType: "guide", intent: "informational", priorityScore: 82 },
    { title: `${t} Performance Optimization`, keyword: `${t} performance optimization`, articleType: "guide", intent: "informational", priorityScore: 78 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plans_tutorial_tech_advanced(t: string): ArticleExpansionPlan[] {
  return [
    { title: `${t} Architecture Deep Dive`, keyword: `${t} architecture deep dive`, articleType: "guide", intent: "informational", priorityScore: 98 },
    { title: `${t} Internals Explained`, keyword: `${t} internals explained`, articleType: "explainer", intent: "informational", priorityScore: 94 },
    { title: `Advanced ${t} Patterns`, keyword: `advanced ${t} patterns`, articleType: "guide", intent: "informational", priorityScore: 90 },
    { title: `${t} Performance Tuning`, keyword: `${t} performance tuning`, articleType: "guide", intent: "informational", priorityScore: 86 },
    { title: `${t} Security Hardening`, keyword: `${t} security hardening`, articleType: "guide", intent: "informational", priorityScore: 82 },
    { title: `${t} at Scale`, keyword: `${t} at scale`, articleType: "guide", intent: "informational", priorityScore: 78 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

function plans_tutorial_tech_professional(t: string): ArticleExpansionPlan[] {
  return [
    { title: `${t} for Production Teams`, keyword: `${t} production teams`, articleType: "guide", intent: "informational", priorityScore: 98 },
    { title: `${t} CI/CD Pipeline Setup`, keyword: `${t} ci cd pipeline`, articleType: "tutorial", intent: "informational", priorityScore: 94 },
    { title: `${t} Enterprise Architecture`, keyword: `${t} enterprise architecture`, articleType: "guide", intent: "informational", priorityScore: 90 },
    { title: `${t} Monitoring and Observability`, keyword: `${t} monitoring observability`, articleType: "guide", intent: "informational", priorityScore: 86 },
    { title: `${t} Security and Compliance`, keyword: `${t} security compliance`, articleType: "guide", intent: "informational", priorityScore: 82 },
    { title: `${t} Cost Optimization`, keyword: `${t} cost optimization`, articleType: "guide", intent: "informational", priorityScore: 78 },
    { title: `${t} FAQ`, keyword: `${t} frequently asked questions`, articleType: "guide", intent: "informational", priorityScore: 65 },
  ];
}

// ─── 3D Router: Entity + Intent + Level ───────────────────────────────────────

export function generateArticleExpansionPlans(topicTitle: string): ArticleExpansionPlan[] {
  const clean = topicTitle.trim();
  const entity = classifyTopicDomain(clean);
  const intent = classifySearchIntent(clean);
  const level  = classifyReaderLevel(clean);

  let plans: ArticleExpansionPlan[];

  // ── Intent overrides (cross-entity) ─────────────────────────────────────
  // These fire when the title contains strong intent signals regardless of entity type.

  if (intent === "comparison") {
    plans = plans_intent_comparison(clean);
  } else if (intent === "troubleshooting") {
    plans = plans_intent_troubleshooting(clean);
  } else if (intent === "calculator") {
    plans = plans_intent_calculator(clean);
  } else if (intent === "checklist") {
    plans = plans_intent_checklist(clean);
  } else if (intent === "review") {
    plans = plans_intent_review(clean);
  } else if (intent === "reference") {
    plans = plans_intent_reference(clean, entity);

  // ── Tutorial intent: route by entity family + reader level ───────────────
  } else if (intent === "tutorial" && entity.startsWith("tech_")) {
    switch (level) {
      case "beginner":      plans = plans_tutorial_tech_beginner(clean); break;
      case "intermediate":  plans = plans_tutorial_tech_intermediate(clean); break;
      case "advanced":      plans = plans_tutorial_tech_advanced(clean); break;
      case "professional":  plans = plans_tutorial_tech_professional(clean); break;
    }

  // ── Level override for tech entities with advanced/professional signals ──
  // Covers: "Advanced Docker" (definition+advanced), "Docker for DevOps" (definition+professional)
  } else if (entity.startsWith("tech_") && level === "advanced") {
    plans = plans_tutorial_tech_advanced(clean);
  } else if (entity.startsWith("tech_") && level === "professional") {
    plans = plans_tutorial_tech_professional(clean);
  } else if (entity.startsWith("tech_") && level === "intermediate") {
    plans = plans_tutorial_tech_intermediate(clean);

  // ── Entity-type default roadmaps (definition / guide intent) ─────────────
  } else {
    switch (entity) {
      // Technology
      case "tech_programming_language":  plans = plans_tech_programming_language(clean); break;
      case "tech_framework":             plans = plans_tech_framework(clean); break;
      case "tech_tool_cli":              plans = plans_tech_tool_cli(clean); break;
      case "tech_cloud_service":         plans = plans_tech_cloud_service(clean); break;
      case "tech_database":              plans = plans_tech_database(clean); break;
      case "tech_programming_concept":   plans = plans_tech_programming_concept(clean); break;
      // Finance
      case "finance_investment_instrument": plans = plans_finance_investment_instrument(clean); break;
      case "finance_financial_formula":     plans = plans_finance_financial_formula(clean); break;
      case "finance_investment_strategy":   plans = plans_finance_investment_strategy(clean); break;
      case "finance_banking_product":       plans = plans_finance_banking_product(clean); break;
      case "finance_tax_concept":           plans = plans_finance_tax_concept(clean); break;
      case "finance_market_concept":        plans = plans_finance_market_concept(clean); break;
      // Health
      case "health_disease":             plans = plans_health_disease(clean); break;
      case "health_medication":          plans = plans_health_medication(clean); break;
      case "health_nutrition_topic":     plans = plans_health_nutrition_topic(clean); break;
      case "health_fitness_topic":       plans = plans_health_fitness_topic(clean); break;
      case "health_medical_concept":     plans = plans_health_medical_concept(clean); break;
      // Other
      case "movie_tv":                   plans = plans_movie_tv(clean); break;
      case "historical_event":           plans = plans_historical_event(clean); break;
      case "place_travel":               plans = plans_place_travel(clean); break;
      case "product_review":             plans = plans_product_review(clean); break;
      default:                           plans = plans_educational_general(clean); break;
    }
  }

  return plans.filter((plan, index, self) =>
    index === self.findIndex((p) => p.title.toLowerCase() === plan.title.toLowerCase())
  );
}

export async function queueArticleExpansionsForTopic(topicId: string, topicTitle: string, languageCode = "en") {
  const supabase = createAdminClient();
  const plans = generateArticleExpansionPlans(topicTitle);
  const created: string[] = [];

  for (let i = 0; i < plans.length; i++) {
    const plan = plans[i];
    const { error } = await supabase.from("content_generation_queue").insert({
      object_type: "article",
      topic_id: topicId,
      title: plan.title,
      description: `${plan.articleType} article covering "${plan.title}" within the topic "${topicTitle}".`,
      reason: `Planned article ${i + 1} of ${plans.length} for topic "${topicTitle}" - ${plan.articleType} format, ${plan.intent} intent`,
      priority_score: plan.priorityScore,
      status: "pending",
      metadata: {
        article_type: plan.articleType,
        intent: plan.intent,
        keyword: plan.keyword,
        source: "topic_expansion",
        plan_position: i + 1,
        plan_total: plans.length,
        parent_topic_title: topicTitle,
        plan_reason: `Addresses a specific knowledge gap within "${topicTitle}". Type: ${plan.articleType}. Intent: ${plan.intent}. Priority: ${plan.priorityScore}.`,
      },
    });

    if (!error) {
      created.push(plan.title);
    }
  }

  return { created, count: created.length };
}

export async function expandAllPendingTopics(limit = 10) {
  const supabase = createAdminClient();
  const { data: topics } = await supabase
    .from("topics")
    .select("id, slug, topic_translations(title)")
    .eq("status", "published")
    .eq("topic_translations.language_code", "en")
    .not(
      "id",
      "in",
      supabase.from("content_generation_queue").select("topic_id").eq("object_type", "article").not("topic_id", "is", null)
    )
    .limit(limit);

  let total = 0;
  for (const topic of topics || []) {
    const title = (topic.topic_translations as { title: string }[] | null)?.[0]?.title || topic.slug;
    const result = await queueArticleExpansionsForTopic(topic.id, title, "en");
    total += result.count;
  }

  return { total };
}
