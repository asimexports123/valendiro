/**
 * Research Engine — Phase 2A
 *
 * The Research Engine runs BEFORE any content is written.
 * It builds structured research context from keyword signals, category data,
 * and internal knowledge — the "Knowledge Pack" source of truth.
 *
 * The LLM writer (or template engine) MUST receive a KnowledgePack.
 * It must NEVER receive only a raw keyword.
 *
 * Research stages:
 *  1. Concept Extraction     — core definition, domain, scope
 *  2. Entity Resolution      — identify named entities related to the keyword
 *  3. Relationship Mapping   — how this concept connects to others
 *  4. FAQ Generation         — canonical questions users ask
 *  5. Example Builder        — concrete examples, use cases, analogies
 *  6. Table Opportunities    — where structured comparison adds value
 *  7. Internal Link Signals  — related topics/subcategories in the hierarchy
 *  8. Image Suggestions      — what visuals would serve the reader
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { KeywordResearchResult } from "@/services/demand/keywordResearchEngine";
import type { CategoryDefinition } from "@/services/demand/categoryConfig";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConceptDefinition {
  term: string;
  definition: string;
  domain: string;
  scope: "narrow" | "broad" | "universal";
}

export interface ResearchEntity {
  name: string;
  type: "concept" | "person" | "organization" | "tool" | "formula" | "standard";
  relevance: "primary" | "secondary" | "related";
  description: string;
}

export interface ConceptRelationship {
  relatedTerm: string;
  relationshipType: "prerequisite" | "component" | "contrast" | "application" | "example" | "extension";
  explanation: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  searchIntent: "informational" | "how_to" | "comparison" | "definition";
}

export interface ConcreteExample {
  title: string;
  scenario: string;
  outcome: string;
  domain: string;
}

export interface TableOpportunity {
  title: string;
  columns: string[];
  purpose: string;
  rows?: string[][];
}

export interface InternalLinkSignal {
  suggestedTitle: string;
  suggestedSlug: string;
  linkType: "parent_topic" | "related_topic" | "prerequisite" | "next_step";
  hierarchyLevel: "category" | "Subcategory" | "topic" | "article";
}

export interface ImageSuggestion {
  type: "hero" | "diagram" | "chart" | "example" | "comparison";
  description: string;
  altText: string;
  searchQuery: string;
}

export interface ResearchPackRaw {
  keyword: string;
  normalizedKeyword: string;
  categorySlug: string;
  categoryLabel: string;
  searchIntent: string;
  concept: ConceptDefinition;
  entities: ResearchEntity[];
  relationships: ConceptRelationship[];
  faqs: FAQItem[];
  examples: ConcreteExample[];
  tableOpportunities: TableOpportunity[];
  internalLinkSignals: InternalLinkSignal[];
  imageSuggestions: ImageSuggestion[];
  statistics: string[];
  commonMistakes: string[];
  researchedAt: string;
}

// ─── Domain knowledge maps ────────────────────────────────────────────────────

const DOMAIN_CONCEPTS: Record<string, { domain: string; scope: "narrow" | "broad" | "universal" }> = {
  "compound interest":   { domain: "Personal Finance", scope: "universal" },
  "index fund":          { domain: "Investing", scope: "broad" },
  "machine learning":    { domain: "Computer Science / AI", scope: "broad" },
  "python":              { domain: "Software Development", scope: "broad" },
  "javascript":          { domain: "Web Development", scope: "broad" },
  "meditation":          { domain: "Mental Health / Wellness", scope: "universal" },
  "budgeting":           { domain: "Personal Finance", scope: "universal" },
  "credit score":        { domain: "Personal Finance", scope: "broad" },
  "photosynthesis":      { domain: "Biology", scope: "narrow" },
  "dna":                 { domain: "Molecular Biology", scope: "narrow" },
  "inflation":           { domain: "Economics", scope: "universal" },
  "leadership":          { domain: "Business / Management", scope: "universal" },
  "vitamin d":           { domain: "Nutrition / Health", scope: "broad" },
  "docker":              { domain: "DevOps / Software Engineering", scope: "broad" },
  "diabetes":            { domain: "Medicine / Health", scope: "broad" },
};

function resolveDomain(keyword: string, categoryLabel: string): { domain: string; scope: "narrow" | "broad" | "universal" } {
  const lc = keyword.toLowerCase();
  for (const [term, meta] of Object.entries(DOMAIN_CONCEPTS)) {
    if (lc.includes(term)) return meta;
  }
  return { domain: categoryLabel, scope: "broad" };
}

// ─── Concept Definition Builder ───────────────────────────────────────────────

function buildConceptDefinition(keyword: string, categoryLabel: string, searchIntent: string): ConceptDefinition {
  const { domain, scope } = resolveDomain(keyword, categoryLabel);
  const lc = keyword.toLowerCase();

  let definition = "";

  if (/what is|definition|meaning/.test(lc)) {
    const subject = keyword.replace(/^(what is|definition of|meaning of)\s+/i, "").trim();
    definition = `${subject} is a key concept in ${domain}. It describes a specific principle, method, or phenomenon with well-defined properties and real-world applications.`;
  } else if (/how to|tutorial|guide/.test(lc)) {
    definition = `"${keyword}" describes a practical skill or process within ${domain}. Mastering it involves understanding the underlying principles, following a structured approach, and applying the method in context.`;
  } else if (/vs|comparison|difference/.test(lc)) {
    definition = `This topic compares key concepts within ${domain}, helping readers understand which approach fits specific situations, goals, or constraints.`;
  } else {
    definition = `${keyword} is a substantive topic within ${domain}. It encompasses principles, practices, and applications that are relevant to anyone working in or learning about this field.`;
  }

  return {
    term: keyword,
    definition,
    domain,
    scope,
  };
}

// ─── Entity Resolver ──────────────────────────────────────────────────────────

const ENTITY_SIGNALS: Record<string, ResearchEntity[]> = {
  "compound interest": [
    { name: "Principal", type: "concept", relevance: "primary", description: "The original sum of money on which interest is calculated." },
    { name: "Interest Rate", type: "concept", relevance: "primary", description: "The percentage applied to the principal per period." },
    { name: "Compounding Period", type: "concept", relevance: "primary", description: "How frequently interest is calculated and added (daily, monthly, annually)." },
    { name: "Rule of 72", type: "formula", relevance: "secondary", description: "A shortcut formula: divide 72 by the annual interest rate to estimate how many years to double money." },
    { name: "Albert Einstein", type: "person", relevance: "related", description: "Commonly (though apocryphally) attributed with calling compound interest the eighth wonder of the world." },
  ],
  "machine learning": [
    { name: "Training Data", type: "concept", relevance: "primary", description: "The labelled dataset used to teach a model." },
    { name: "Model", type: "concept", relevance: "primary", description: "A mathematical function that maps inputs to predictions." },
    { name: "Overfitting", type: "concept", relevance: "secondary", description: "When a model learns training data too well and fails to generalise." },
    { name: "TensorFlow", type: "tool", relevance: "secondary", description: "Open-source ML framework developed by Google." },
    { name: "PyTorch", type: "tool", relevance: "secondary", description: "Open-source ML framework favoured in research." },
  ],
  "index fund": [
    { name: "Expense Ratio", type: "concept", relevance: "primary", description: "The annual fee charged by the fund as a percentage of assets." },
    { name: "Benchmark Index", type: "concept", relevance: "primary", description: "The market index the fund tracks (e.g. S&P 500)." },
    { name: "John Bogle", type: "person", relevance: "secondary", description: "Founder of Vanguard, pioneer of index fund investing." },
    { name: "Vanguard", type: "organization", relevance: "secondary", description: "Investment company that popularised low-cost index funds." },
    { name: "Passive Investing", type: "concept", relevance: "related", description: "Investment strategy that tracks a market index rather than actively selecting stocks." },
  ],
  "credit score": [
    { name: "FICO Score", type: "standard", relevance: "primary", description: "The most widely used credit scoring model in the US." },
    { name: "Payment History", type: "concept", relevance: "primary", description: "The largest factor in credit score (35% in FICO)." },
    { name: "Credit Utilisation", type: "concept", relevance: "primary", description: "The ratio of credit used to total credit available (30% in FICO)." },
    { name: "Experian", type: "organization", relevance: "secondary", description: "One of the three major credit bureaux." },
    { name: "Hard Inquiry", type: "concept", relevance: "secondary", description: "A credit check that temporarily lowers your score." },
  ],
};

function resolveEntities(keyword: string): ResearchEntity[] {
  const lc = keyword.toLowerCase();
  for (const [term, entities] of Object.entries(ENTITY_SIGNALS)) {
    if (lc.includes(term)) return entities;
  }
  // Generic fallback entities
  return [
    { name: keyword, type: "concept", relevance: "primary", description: `The primary subject of this article.` },
    { name: "Core Principles", type: "concept", relevance: "secondary", description: "The foundational ideas that underpin this topic." },
    { name: "Common Applications", type: "concept", relevance: "related", description: "Where and how this concept is applied in practice." },
  ];
}

// ─── Relationship Mapper ──────────────────────────────────────────────────────

function buildRelationships(keyword: string, categorySlug: string): ConceptRelationship[] {
  const lc = keyword.toLowerCase();
  const relationships: ConceptRelationship[] = [];

  // Finance relationships
  if (categorySlug === "personal-finance") {
    if (lc.includes("compound interest")) {
      relationships.push(
        { relatedTerm: "Simple Interest", relationshipType: "contrast", explanation: "Simple interest calculates interest only on principal; compound interest calculates on principal plus accumulated interest." },
        { relatedTerm: "Index Funds", relationshipType: "application", explanation: "Index funds leverage compound interest over decades to build long-term wealth." },
        { relatedTerm: "Savings Account", relationshipType: "application", explanation: "Savings accounts are one of the most accessible ways to benefit from compound interest." }
      );
    } else {
      relationships.push(
        { relatedTerm: "Budgeting", relationshipType: "prerequisite", explanation: "Understanding your budget is a prerequisite for effective investment decisions." },
        { relatedTerm: "Emergency Fund", relationshipType: "prerequisite", explanation: "An emergency fund should exist before committing to long-term investment." },
        { relatedTerm: "Compound Interest", relationshipType: "application", explanation: "This concept directly applies compound interest to build wealth." }
      );
    }
  }

  // Technology relationships
  if (categorySlug === "technology") {
    if (lc.includes("machine learning") || lc.includes("ai")) {
      relationships.push(
        { relatedTerm: "Deep Learning", relationshipType: "extension", explanation: "Deep learning is a subset of machine learning using multi-layer neural networks." },
        { relatedTerm: "Data Science", relationshipType: "application", explanation: "Data science uses machine learning as one of its primary analytical tools." },
        { relatedTerm: "Statistics", relationshipType: "prerequisite", explanation: "Statistical reasoning is a core prerequisite for understanding ML algorithms." }
      );
    } else {
      relationships.push(
        { relatedTerm: "Software Development", relationshipType: "application", explanation: "This topic connects to broader software development practices." },
        { relatedTerm: "Computer Science Fundamentals", relationshipType: "prerequisite", explanation: "A grounding in CS fundamentals supports deeper understanding." }
      );
    }
  }

  // Generic fallback
  if (relationships.length === 0) {
    relationships.push(
      { relatedTerm: "Fundamentals", relationshipType: "prerequisite", explanation: "Core principles should be understood before advancing to this topic." },
      { relatedTerm: "Advanced Applications", relationshipType: "extension", explanation: "Once the basics are clear, this topic opens the door to more advanced applications." },
      { relatedTerm: "Common Mistakes", relationshipType: "contrast", explanation: "Understanding what not to do is equally important as knowing best practices." }
    );
  }

  return relationships;
}

// ─── FAQ Generator ────────────────────────────────────────────────────────────

function generateFAQs(keyword: string, searchIntent: string): FAQItem[] {
  const clean = keyword.trim();
  const lc = clean.toLowerCase();

  const faqs: FAQItem[] = [
    {
      question: `What is ${clean}?`,
      answer: `${clean} is a key concept with specific, well-defined properties and applications. Understanding it begins with grasping its core definition, then exploring how it functions in real-world contexts.`,
      searchIntent: "definition",
    },
    {
      question: `How does ${clean} work?`,
      answer: `${clean} works through a defined process or mechanism. The key steps involve understanding the inputs, the transformation that occurs, and the outputs or outcomes produced.`,
      searchIntent: "how_to",
    },
    {
      question: `Why is ${clean} important?`,
      answer: `${clean} is important because it addresses fundamental challenges or opportunities in its domain. Those who understand it can make better decisions and achieve superior outcomes.`,
      searchIntent: "informational",
    },
    {
      question: `What are the most common mistakes with ${clean}?`,
      answer: `The most common mistakes with ${clean} include skipping foundational understanding, ignoring context, and applying a one-size-fits-all approach. Each situation calls for thoughtful application of the underlying principles.`,
      searchIntent: "informational",
    },
    {
      question: `How do I get started with ${clean}?`,
      answer: `To get started with ${clean}, begin with the foundational concepts, apply them in low-stakes scenarios, and build understanding progressively. Avoid trying to master everything at once.`,
      searchIntent: "how_to",
    },
  ];

  // Add comparison FAQ if comparison intent detected
  if (/vs|comparison|difference/.test(lc)) {
    faqs.push({
      question: `What is the key difference between ${clean.replace(/ vs .*/i, "")} and its alternatives?`,
      answer: `The primary difference lies in the approach, use case, and trade-offs involved. Each option has specific strengths that make it better suited for particular situations.`,
      searchIntent: "comparison",
    });
  }

  return faqs.slice(0, 6);
}

// ─── Example Builder ──────────────────────────────────────────────────────────

function buildExamples(keyword: string, categorySlug: string): ConcreteExample[] {
  const clean = keyword.trim();
  const examples: ConcreteExample[] = [];

  if (categorySlug === "personal-finance") {
    examples.push(
      { title: "The 30-Year Investment Example", scenario: `An investor puts $10,000 into an account linked to ${clean} at age 25.`, outcome: "By age 55, with consistent application of the principle, the initial investment has grown significantly without requiring active management.", domain: "Investing" },
      { title: "The Monthly Budget Example", scenario: `A working professional applies ${clean} to organise their monthly income.`, outcome: "After 6 months, they have eliminated unnecessary spending and built a 3-month emergency fund.", domain: "Budgeting" }
    );
  } else if (categorySlug === "technology") {
    examples.push(
      { title: "The Beginner Developer Example", scenario: `A new programmer learns ${clean} by building a small project from scratch.`, outcome: "Within two weeks, they have a working implementation they can demonstrate and iterate on.", domain: "Software Development" },
      { title: "The Production System Example", scenario: `An engineering team applies ${clean} to a real-world system under load.`, outcome: "Performance and reliability improve measurably, with clear documentation for future maintainers.", domain: "Engineering" }
    );
  } else {
    examples.push(
      { title: "The Beginner Example", scenario: `Someone new to ${clean} approaches it step by step using the structured method described in this guide.`, outcome: "Within weeks, they have built practical competence and can apply the concept in their own context.", domain: "General" },
      { title: "The Advanced Application Example", scenario: `An experienced practitioner uses ${clean} to solve a complex, multi-variable problem.`, outcome: "The structured approach reduces error, saves time, and produces a result that holds up under scrutiny.", domain: "Advanced Practice" }
    );
  }

  return examples;
}

// ─── Table Opportunities ──────────────────────────────────────────────────────

function buildTableOpportunities(keyword: string, searchIntent: string): TableOpportunity[] {
  const tables: TableOpportunity[] = [];
  const lc = keyword.toLowerCase();

  if (/vs|comparison|difference/.test(lc)) {
    tables.push({
      title: "Comparison Table",
      columns: ["Feature", "Option A", "Option B"],
      purpose: "Side-by-side comparison of the two approaches across key dimensions.",
    });
  }

  if (searchIntent === "how_to" || /guide|tutorial|steps/.test(lc)) {
    tables.push({
      title: "Step-by-Step Process Table",
      columns: ["Step", "Action", "Expected Outcome"],
      purpose: "Structured walkthrough of the process to follow.",
    });
  }

  // Always add pros/cons if actionable
  if (!/what is|definition/.test(lc)) {
    tables.push({
      title: "Pros and Cons",
      columns: ["Advantage", "Disadvantage"],
      purpose: "Balanced assessment to help readers make informed decisions.",
    });
  }

  // Add a quick reference table for any topic
  tables.push({
    title: "Quick Reference",
    columns: ["Concept", "Definition", "Why It Matters"],
    purpose: "Summary of the key terms and ideas covered in this article.",
  });

  return tables;
}

// ─── Internal Link Signals ────────────────────────────────────────────────────

async function resolveInternalLinkSignals(
  keyword: string,
  categorySlug: string
): Promise<InternalLinkSignal[]> {
  const supabase = createAdminClient();
  const signals: InternalLinkSignal[] = [];

  try {
    // Find related published topics in same category
    const { data: relatedTopics } = await supabase
      .from("topics")
      .select("slug, topic_translations(title), categories(slug)")
      .eq("status", "published")
      .eq("categories.slug", categorySlug)
      .limit(5);

    for (const topic of relatedTopics ?? []) {
      const title = (topic.topic_translations as { title: string }[] | null)?.[0]?.title;
      if (title) {
        signals.push({
          suggestedTitle: title,
          suggestedSlug: topic.slug,
          linkType: "related_topic",
          hierarchyLevel: "topic",
        });
      }
    }

    // Find the parent Subcategory for this category
    const { data: parentSubcategory } = await supabase
      .from("subcategories")
      .select("slug, subcategory_translations(name), categories(slug)")
      .eq("categories.slug", categorySlug)
      .limit(1)
      .maybeSingle();

    if (parentSubcategory) {
      const name = (parentSubcategory.subcategory_translations as { name: string }[] | null)?.[0]?.name;
      if (name) {
        signals.push({
          suggestedTitle: name,
          suggestedSlug: parentSubcategory.slug,
          linkType: "parent_topic",
          hierarchyLevel: "Subcategory",
        });
      }
    }
  } catch {
    // Non-fatal — internal links are enriched later by the linking engine
  }

  return signals;
}

// ─── Image Suggestions ────────────────────────────────────────────────────────

function buildImageSuggestions(keyword: string, categorySlug: string): ImageSuggestion[] {
  const categoryQuery = {
    "technology": "technology computer code",
    "personal-finance": "finance money growth",
    "business": "business strategy team",
    "education": "learning education books",
    "health-wellness": "health wellness calm",
    "home-lifestyle": "home interior cozy",
    "travel": "travel landscape adventure",
  }[categorySlug] ?? "knowledge abstract";

  return [
    {
      type: "hero",
      description: `Full-width hero image representing ${keyword}`,
      altText: `Visual representation of ${keyword}`,
      searchQuery: `${keyword} ${categoryQuery}`,
    },
    {
      type: "diagram",
      description: `Diagram or infographic explaining how ${keyword} works`,
      altText: `How ${keyword} works — diagram`,
      searchQuery: `${categoryQuery} diagram infographic`,
    },
    {
      type: "example",
      description: `Real-world example or application of ${keyword}`,
      altText: `Real-world example of ${keyword}`,
      searchQuery: `${keyword} example real world`,
    },
  ];
}

// ─── Common Mistakes ─────────────────────────────────────────────────────────

function buildCommonMistakes(keyword: string): string[] {
  return [
    `Skipping the fundamentals of ${keyword} and jumping to advanced applications before building a solid base.`,
    `Applying ${keyword} without understanding the specific context — what works in one situation may not work in another.`,
    `Over-complicating the approach to ${keyword} — the simplest correct method is usually the most reliable.`,
    `Neglecting to review outcomes when using ${keyword} — feedback loops are essential for improvement.`,
    `Relying on a single source when learning ${keyword} — cross-referencing builds more robust understanding.`,
  ];
}

// ─── Statistics Placeholder ───────────────────────────────────────────────────

function buildStatisticsContext(keyword: string, categorySlug: string): string[] {
  // Statistics are populated by an external data source or LLM enrichment.
  // These are structural placeholders that signal to the writer what to look for.
  return [
    `[Stat: Search volume for "${keyword}" — to be populated from keyword data]`,
    `[Stat: Industry adoption or prevalence statistics for ${keyword}]`,
    `[Stat: Key benchmarks or averages relevant to ${keyword} in ${categorySlug}]`,
  ];
}

// ─── Main Export: Research Engine ────────────────────────────────────────────

export async function runResearchEngine(
  keyword: string,
  kwResult: KeywordResearchResult,
  category: CategoryDefinition | null
): Promise<ResearchPackRaw> {
  const categorySlug = kwResult.categorySlug;
  const categoryLabel = kwResult.categoryLabel;
  const searchIntent = kwResult.searchIntent;

  const [internalLinkSignals] = await Promise.all([
    resolveInternalLinkSignals(keyword, categorySlug),
  ]);

  return {
    keyword,
    normalizedKeyword: kwResult.normalizedKeyword,
    categorySlug,
    categoryLabel,
    searchIntent,
    concept: buildConceptDefinition(keyword, categoryLabel, searchIntent),
    entities: resolveEntities(keyword),
    relationships: buildRelationships(keyword, categorySlug),
    faqs: generateFAQs(keyword, searchIntent),
    examples: buildExamples(keyword, categorySlug),
    tableOpportunities: buildTableOpportunities(keyword, searchIntent),
    internalLinkSignals,
    imageSuggestions: buildImageSuggestions(keyword, categorySlug),
    statistics: buildStatisticsContext(keyword, categorySlug),
    commonMistakes: buildCommonMistakes(keyword),
    researchedAt: new Date().toISOString(),
  };
}
