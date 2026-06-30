import { createAdminClient } from "@/lib/supabase/admin";
import { classifyTopicDomain, type TopicDomain } from "@/services/intelligence/topicDomainClassifier";

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

export function generateArticleExpansionPlans(topicTitle: string): ArticleExpansionPlan[] {
  const clean = topicTitle.trim();
  const entity = classifyTopicDomain(clean);

  let plans: ArticleExpansionPlan[];
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
