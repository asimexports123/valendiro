/**
 * Outline Planner — Phase 2B
 *
 * Generates a structured article outline from a KnowledgePack.
 * The outline defines every section, its purpose, content guidance,
 * and the required elements (examples, tables, FAQ, etc.).
 *
 * The LLM Writer receives the outline alongside the KnowledgePack.
 * It MUST follow the outline exactly — no improvisation, no skipped sections.
 *
 * Outline types:
 *  - informational  : Definition → Explanation → How it works → Examples → Comparison → FAQ → Conclusion
 *  - how_to         : Overview → Prerequisites → Steps → Examples → Mistakes → FAQ → Next Steps
 *  - comparison     : Overview → Option A → Option B → Comparison Table → Use Cases → Recommendation → FAQ
 *  - educational    : Introduction → Core Concepts → Deep Dive → Practice → Assessment → Resources → Conclusion
 *  - buying_guide   : Overview → What to Look For → Top Options → Comparison Table → Recommendation → FAQ
 */

import type { KnowledgePack } from "./knowledgePackBuilder";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OutlineSectionType =
  | "introduction"
  | "definition"
  | "explanation"
  | "how_it_works"
  | "core_concepts"
  | "step_by_step"
  | "examples"
  | "table"
  | "comparison"
  | "common_mistakes"
  | "faq"
  | "conclusion"
  | "next_steps"
  | "prerequisites"
  | "deep_dive"
  | "use_cases"
  | "recommendation"
  | "related_reading";

export interface OutlineSection {
  id: string;
  type: OutlineSectionType;
  heading: string;
  headingLevel: 1 | 2 | 3;
  purpose: string;
  guidance: string;         // What the writer should cover in this section
  requiredElements: string[]; // e.g. ["example", "table", "internal_link"]
  estimatedWords: number;
  order: number;
}

export interface ArticleOutline {
  keyword: string;
  articleTitle: string;
  articleType: "informational" | "how_to" | "comparison" | "educational" | "buying_guide";
  targetWordCount: number;
  sections: OutlineSection[];
  requiredTableCount: number;
  requiredExampleCount: number;
  requiredFAQCount: number;
  generatedAt: string;
}

// ─── Title Generator ──────────────────────────────────────────────────────────

function generateArticleTitle(keyword: string, articleType: ArticleOutline["articleType"]): string {
  const clean = keyword.trim();
  const titleMap: Record<ArticleOutline["articleType"], string> = {
    informational: `What Is ${toTitleCase(clean)}? A Complete Guide`,
    how_to: `How to ${toTitleCase(clean)}: Step-by-Step Guide`,
    comparison: `${toTitleCase(clean)}: A Detailed Comparison`,
    educational: `${toTitleCase(clean)} Explained: From Basics to Advanced`,
    buying_guide: `Best ${toTitleCase(clean)}: Complete Buyer's Guide`,
  };
  return titleMap[articleType];
}

function toTitleCase(str: string): string {
  const minor = new Set(["a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "of", "in", "by", "up", "as", "vs"]);
  return str.split(" ").map((w, i) =>
    i === 0 || !minor.has(w.toLowerCase()) ? w.charAt(0).toUpperCase() + w.slice(1) : w
  ).join(" ");
}

// ─── Outline Builders ─────────────────────────────────────────────────────────

function buildInformationalOutline(pack: KnowledgePack): OutlineSection[] {
  const kw = pack.keyword;
  const entityNames = pack.entities.filter(e => e.relevance === "primary").map(e => e.name).slice(0, 3);

  return [
    {
      id: "intro",
      type: "introduction",
      heading: `Introduction to ${toTitleCase(kw)}`,
      headingLevel: 2,
      purpose: "Hook the reader, establish relevance, preview what the article covers.",
      guidance: `Open with why ${kw} matters to the reader. State the core problem it solves or question it answers. Preview the 3-4 key things the reader will learn. Keep this under 150 words.`,
      requiredElements: ["hook", "relevance_statement", "article_preview"],
      estimatedWords: 120,
      order: 1,
    },
    {
      id: "definition",
      type: "definition",
      heading: `What Is ${toTitleCase(kw)}?`,
      headingLevel: 2,
      purpose: "Provide a clear, authoritative definition.",
      guidance: `Define ${kw} precisely. Use the definition from the Knowledge Pack: "${pack.definition}". Explain the domain (${pack.domain}) and scope. Include the primary entities: ${entityNames.join(", ")}.`,
      requiredElements: ["formal_definition", "domain_context", "primary_entities"],
      estimatedWords: 200,
      order: 2,
    },
    {
      id: "how_it_works",
      type: "how_it_works",
      heading: `How ${toTitleCase(kw)} Works`,
      headingLevel: 2,
      purpose: "Explain the mechanism, process, or logic in detail.",
      guidance: `Break down the mechanism step by step. Use numbered steps where appropriate. Reference the core concepts from the Knowledge Pack. Include at least one concrete example from: ${pack.examples.map(e => e.title).slice(0, 2).join(", ")}.`,
      requiredElements: ["mechanism_explanation", "numbered_steps_or_process", "concrete_example"],
      estimatedWords: 350,
      order: 3,
    },
    {
      id: "core_concepts",
      type: "core_concepts",
      heading: `Key Concepts in ${toTitleCase(kw)}`,
      headingLevel: 2,
      purpose: "Define and explain the essential building blocks.",
      guidance: `Cover each primary entity from the Knowledge Pack with a short explanation. Use bold headings for each concept. Entities to cover: ${pack.entities.map(e => e.name).join(", ")}.`,
      requiredElements: ["entity_definitions", "bold_subheadings", "practical_context"],
      estimatedWords: 300,
      order: 4,
    },
    {
      id: "examples",
      type: "examples",
      heading: `${toTitleCase(kw)} in Practice: Real Examples`,
      headingLevel: 2,
      purpose: "Ground abstract concepts in concrete reality.",
      guidance: `Present 2-3 concrete examples. Use the examples from the Knowledge Pack. For each: describe the scenario, show the application of ${kw}, and explain the outcome. Examples: ${pack.examples.map(e => `"${e.title}"`).join(", ")}.`,
      requiredElements: ["2_plus_examples", "scenario_outcome_format", "relatable_context"],
      estimatedWords: 300,
      order: 5,
    },
    ...(pack.tableOpportunities.length > 0 ? [{
      id: "table",
      type: "table" as OutlineSectionType,
      heading: pack.tableOpportunities[0].title,
      headingLevel: 2 as 2,
      purpose: "Provide structured comparative or reference data.",
      guidance: `Build the table "${pack.tableOpportunities[0].title}" with columns: ${pack.tableOpportunities[0].columns.join(", ")}. Purpose: ${pack.tableOpportunities[0].purpose}. Fill with real, accurate data — never placeholder rows.`,
      requiredElements: ["real_data_table", "accurate_values"],
      estimatedWords: 150,
      order: 6,
    }] : []),
    {
      id: "mistakes",
      type: "common_mistakes",
      heading: `Common Mistakes to Avoid with ${toTitleCase(kw)}`,
      headingLevel: 2,
      purpose: "Pre-empt errors the reader is likely to make.",
      guidance: `List the 3-5 most common mistakes from the Knowledge Pack. For each mistake: name it, explain why it happens, and give the correct approach. Use the mistakes: ${pack.commonMistakes.slice(0, 3).map(m => `"${m.slice(0, 60)}..."`).join("; ")}.`,
      requiredElements: ["numbered_or_bulleted_mistakes", "explanation_per_mistake", "correct_approach"],
      estimatedWords: 250,
      order: 7,
    },
    {
      id: "faq",
      type: "faq",
      heading: `Frequently Asked Questions About ${toTitleCase(kw)}`,
      headingLevel: 2,
      purpose: "Answer the questions people actually ask in search engines.",
      guidance: `Answer the ${pack.faqs.length} FAQ questions from the Knowledge Pack. Each answer should be 2-4 sentences, direct, and accurate. Questions: ${pack.faqs.map(f => `"${f.question}"`).join("; ")}.`,
      requiredElements: ["faq_schema_markup", "direct_answers", "all_questions_from_pack"],
      estimatedWords: 300,
      order: 8,
    },
    {
      id: "conclusion",
      type: "conclusion",
      heading: "Conclusion",
      headingLevel: 2,
      purpose: "Summarise key takeaways and guide the reader to the next step.",
      guidance: `Summarise the 3 most important points from the article. Remind the reader of the value of understanding ${kw}. Link to 1-2 related topics from the internal link signals. End with a clear next action.`,
      requiredElements: ["key_takeaways_summary", "internal_links", "next_step_cta"],
      estimatedWords: 150,
      order: 9,
    },
  ];
}

function buildHowToOutline(pack: KnowledgePack): OutlineSection[] {
  const kw = pack.keyword;
  return [
    {
      id: "intro",
      type: "introduction",
      heading: `Why ${toTitleCase(kw)} Matters`,
      headingLevel: 2,
      purpose: "Establish the value of learning this process.",
      guidance: `Explain what the reader will be able to do after reading. Quantify the benefit where possible. State any prerequisites upfront.`,
      requiredElements: ["value_statement", "prerequisites_mention"],
      estimatedWords: 100,
      order: 1,
    },
    {
      id: "prerequisites",
      type: "prerequisites",
      heading: "What You Need Before You Start",
      headingLevel: 2,
      purpose: "Set the reader up for success by clarifying prerequisites.",
      guidance: `List what knowledge, tools, or resources the reader needs. Use the relationships from the Knowledge Pack: ${pack.relationships.filter(r => r.relationshipType === "prerequisite").map(r => r.relatedTerm).join(", ")}.`,
      requiredElements: ["prerequisite_list", "resource_links"],
      estimatedWords: 120,
      order: 2,
    },
    {
      id: "steps",
      type: "step_by_step",
      heading: `Step-by-Step: How to ${toTitleCase(kw)}`,
      headingLevel: 2,
      purpose: "The core process — numbered, actionable steps.",
      guidance: `Present 5-8 numbered steps. Each step should have: a clear action verb heading, a 2-3 sentence explanation, and where relevant, a concrete example or tip. Reference examples from Knowledge Pack.`,
      requiredElements: ["numbered_steps", "action_verb_headings", "example_per_step"],
      estimatedWords: 500,
      order: 3,
    },
    {
      id: "examples",
      type: "examples",
      heading: "Worked Examples",
      headingLevel: 2,
      purpose: "Show the process applied to real scenarios.",
      guidance: `Present 1-2 complete worked examples from the Knowledge Pack. Show each step of the process applied to a real-world scenario. Include the outcome.`,
      requiredElements: ["complete_worked_example", "real_world_scenario"],
      estimatedWords: 250,
      order: 4,
    },
    {
      id: "mistakes",
      type: "common_mistakes",
      heading: "Common Mistakes and How to Avoid Them",
      headingLevel: 2,
      purpose: "Prevent failure before it happens.",
      guidance: `Cover the 3 most common mistakes from the Knowledge Pack. Format as: Mistake → Why it happens → How to avoid it.`,
      requiredElements: ["mistake_explanation", "avoidance_strategy"],
      estimatedWords: 200,
      order: 5,
    },
    {
      id: "faq",
      type: "faq",
      heading: "Frequently Asked Questions",
      headingLevel: 2,
      purpose: "Address follow-up questions directly.",
      guidance: `Answer the FAQ questions from the Knowledge Pack. Keep each answer focused and concise.`,
      requiredElements: ["faq_schema_markup", "direct_answers"],
      estimatedWords: 250,
      order: 6,
    },
    {
      id: "next_steps",
      type: "next_steps",
      heading: "Next Steps",
      headingLevel: 2,
      purpose: "Guide the reader to their next action.",
      guidance: `Give 2-3 clear next steps. Link to related topics from the internal link signals in the Knowledge Pack. End with encouragement.`,
      requiredElements: ["numbered_next_steps", "internal_links"],
      estimatedWords: 120,
      order: 7,
    },
  ];
}

function buildComparisonOutline(pack: KnowledgePack): OutlineSection[] {
  const kw = pack.keyword;
  return [
    {
      id: "intro",
      type: "introduction",
      heading: `${toTitleCase(kw)}: Overview`,
      headingLevel: 2,
      purpose: "Set up the comparison context.",
      guidance: `Explain what is being compared and why the comparison matters. State who this comparison is for.`,
      requiredElements: ["comparison_context", "audience_framing"],
      estimatedWords: 120,
      order: 1,
    },
    {
      id: "option_a",
      type: "explanation",
      heading: "Option A: Detailed Overview",
      headingLevel: 2,
      purpose: "Explain the first option fully before comparing.",
      guidance: `Describe Option A with: definition, strengths, weaknesses, and best use cases. Use entities from the Knowledge Pack.`,
      requiredElements: ["definition", "pros_cons", "use_cases"],
      estimatedWords: 250,
      order: 2,
    },
    {
      id: "option_b",
      type: "explanation",
      heading: "Option B: Detailed Overview",
      headingLevel: 2,
      purpose: "Explain the second option fully.",
      guidance: `Same format as Option A — definition, strengths, weaknesses, best use cases.`,
      requiredElements: ["definition", "pros_cons", "use_cases"],
      estimatedWords: 250,
      order: 3,
    },
    {
      id: "comparison_table",
      type: "table",
      heading: "Side-by-Side Comparison",
      headingLevel: 2,
      purpose: "Let the reader see differences at a glance.",
      guidance: `Build a comparison table using the table opportunity from the Knowledge Pack: ${pack.tableOpportunities[0]?.title ?? "Comparison Table"}. Columns: ${pack.tableOpportunities[0]?.columns.join(", ") ?? "Feature, Option A, Option B"}. Fill with real data.`,
      requiredElements: ["real_comparison_table", "accurate_values"],
      estimatedWords: 200,
      order: 4,
    },
    {
      id: "recommendation",
      type: "recommendation",
      heading: "Which Should You Choose?",
      headingLevel: 2,
      purpose: "Give clear, context-dependent recommendations.",
      guidance: `Give a clear recommendation for different reader scenarios. Use 'If you... choose X because...' format.`,
      requiredElements: ["scenario_recommendations", "clear_verdict"],
      estimatedWords: 200,
      order: 5,
    },
    {
      id: "faq",
      type: "faq",
      heading: "Frequently Asked Questions",
      headingLevel: 2,
      purpose: "Handle edge cases and lingering questions.",
      guidance: `Answer the comparison-focused FAQs from the Knowledge Pack.`,
      requiredElements: ["faq_schema_markup", "direct_answers"],
      estimatedWords: 250,
      order: 6,
    },
    {
      id: "conclusion",
      type: "conclusion",
      heading: "Conclusion",
      headingLevel: 2,
      purpose: "Summarise and link forward.",
      guidance: `Summarise the key differences. Reinforce the recommendation. Link to related topics.`,
      requiredElements: ["summary", "internal_links"],
      estimatedWords: 120,
      order: 7,
    },
  ];
}

// ─── Article Type Detector ────────────────────────────────────────────────────

function detectArticleType(keyword: string, searchIntent: string): ArticleOutline["articleType"] {
  const lc = keyword.toLowerCase();
  if (/\bvs\b|comparison|difference between|which is better/.test(lc)) return "comparison";
  if (/^how to|step by step|tutorial|guide to/.test(lc)) return "how_to";
  // Only buying_guide for actual product keywords — not "what is X" or concept articles
  if (/best|top \d|buyer|buying guide|review/.test(lc) && !/what is|what are|how does|explain|definition/.test(lc)) return "buying_guide";
  if (searchIntent === "educational") return "educational";
  return "informational";
}

function calculateTargetWordCount(sections: OutlineSection[]): number {
  return sections.reduce((sum, s) => sum + s.estimatedWords, 0);
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function generateOutline(pack: KnowledgePack): ArticleOutline {
  const articleType = detectArticleType(pack.keyword, pack.searchIntent);
  const articleTitle = generateArticleTitle(pack.keyword, articleType);

  let sections: OutlineSection[];

  switch (articleType) {
    case "how_to":
      sections = buildHowToOutline(pack);
      break;
    case "comparison":
      sections = buildComparisonOutline(pack);
      break;
    case "informational":
    case "educational":
    case "buying_guide":
    default:
      sections = buildInformationalOutline(pack);
      break;
  }

  const faqSections = sections.filter(s => s.type === "faq");
  const tableSections = sections.filter(s => s.type === "table");
  const exampleSections = sections.filter(s => s.type === "examples");

  return {
    keyword: pack.keyword,
    articleTitle,
    articleType,
    targetWordCount: calculateTargetWordCount(sections),
    sections,
    requiredTableCount: tableSections.length + pack.tableOpportunities.length,
    requiredExampleCount: Math.max(exampleSections.length, pack.examples.length),
    requiredFAQCount: pack.faqs.length,
    generatedAt: new Date().toISOString(),
  };
}
