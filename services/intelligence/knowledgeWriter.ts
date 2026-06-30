/**
 * Knowledge Writer — Phase 2B
 *
 * Writes article content from a KnowledgePack + ArticleOutline.
 * NEVER writes from a raw keyword — always from structured research.
 *
 * The writer renders each outline section using the Knowledge Pack data:
 *  - definitions come from pack.definition
 *  - examples come from pack.examples
 *  - FAQs come from pack.faqs
 *  - tables come from pack.tableOpportunities
 *  - entities come from pack.entities
 *  - common mistakes come from pack.commonMistakes
 *  - internal links come from pack.internalLinkSignals
 *
 * When an external LLM (OpenAI / Anthropic / etc.) is configured,
 * setLLMProvider() replaces the deterministic renderer with the LLM.
 * The outline + pack are serialised into a structured prompt — not "write about X".
 */

import type { KnowledgePack } from "./knowledgePackBuilder";
import type { ArticleOutline, OutlineSection } from "./outlinePlanner";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WrittenArticle {
  title: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  wordCount: number;
  sectionsWritten: number;
  writerType: "deterministic" | "llm";
  writtenAt: string;
}

export interface LLMProvider {
  write(pack: KnowledgePack, outline: ArticleOutline): Promise<WrittenArticle>;
  isAvailable(): boolean;
  name: string;
}

// ─── Deterministic Section Renderer ──────────────────────────────────────────

function renderIntroduction(section: OutlineSection, pack: KnowledgePack): string {
  const kw = pack.keyword;
  return [
    `## ${section.heading}`,
    ``,
    `${pack.coreConceptsSummary}`,
    ``,
    `Whether you are encountering ${kw} for the first time or looking to sharpen your understanding, this guide covers everything you need: the core definition, how it works in practice, concrete examples, and the most frequently asked questions.`,
    ``,
    `By the end, you will have a clear, working understanding of ${kw} and the confidence to apply it in your own context.`,
  ].join("\n");
}

function renderDefinition(section: OutlineSection, pack: KnowledgePack): string {
  const primaryEntities = pack.entities.filter(e => e.relevance === "primary");
  const entityLines = primaryEntities.map(e => `- **${e.name}**: ${e.description}`).join("\n");

  return [
    `## ${section.heading}`,
    ``,
    pack.definition,
    ``,
    `Within the domain of ${pack.domain}, ${pack.keyword} occupies a foundational role. It is not a peripheral concept — it is one of the building blocks that makes more advanced understanding possible.`,
    ``,
    ...(primaryEntities.length > 0 ? [
      `### Key Components`,
      ``,
      entityLines,
    ] : []),
  ].join("\n");
}

function renderHowItWorks(section: OutlineSection, pack: KnowledgePack): string {
  const kw = pack.keyword;
  const firstExample = pack.examples[0];
  const relationships = pack.relationships.slice(0, 3);

  const relationshipLines = relationships.map(r =>
    `- **${r.relatedTerm}** (${r.relationshipType}): ${r.explanation}`
  ).join("\n");

  return [
    `## ${section.heading}`,
    ``,
    `Understanding how ${kw} works requires looking at both the mechanism and the context in which it operates. The process follows a consistent logic that, once understood, becomes a reliable tool.`,
    ``,
    `The core mechanism of ${kw} involves the interaction of its key components. Each element plays a defined role, and the overall outcome depends on how well they are aligned.`,
    ``,
    ...(firstExample ? [
      `### Worked Example: ${firstExample.title}`,
      ``,
      `**Scenario**: ${firstExample.scenario}`,
      ``,
      `**Outcome**: ${firstExample.outcome}`,
      ``,
    ] : []),
    ...(relationships.length > 0 ? [
      `### How ${kw} Connects to Related Concepts`,
      ``,
      relationshipLines,
      ``,
    ] : []),
  ].join("\n");
}

function renderCoreConceptsSection(section: OutlineSection, pack: KnowledgePack): string {
  const entityBlocks = pack.entities.map(entity => [
    `### ${entity.name}`,
    ``,
    entity.description,
    ``,
    `**Relevance**: ${entity.relevance === "primary" ? "Core to understanding this topic" : entity.relevance === "secondary" ? "Important supporting concept" : "Related context"}.`,
  ].join("\n")).join("\n\n");

  return [
    `## ${section.heading}`,
    ``,
    `To work effectively with ${pack.keyword}, these are the concepts you must understand:`,
    ``,
    entityBlocks,
  ].join("\n");
}

function renderExamples(section: OutlineSection, pack: KnowledgePack): string {
  const exampleBlocks = pack.examples.map((ex, i) => [
    `### Example ${i + 1}: ${ex.title}`,
    ``,
    `**Domain**: ${ex.domain}`,
    ``,
    `**Scenario**: ${ex.scenario}`,
    ``,
    `**Outcome**: ${ex.outcome}`,
    ``,
    `This example illustrates how ${pack.keyword} applies in a real context — not just in theory.`,
  ].join("\n")).join("\n\n");

  return [
    `## ${section.heading}`,
    ``,
    `Abstract understanding only takes you so far. Here is how ${pack.keyword} looks when applied to real situations:`,
    ``,
    exampleBlocks,
  ].join("\n");
}

function renderTable(section: OutlineSection, pack: KnowledgePack): string {
  const tableOp = pack.tableOpportunities[0];
  if (!tableOp) return "";

  const headerRow = `| ${tableOp.columns.join(" | ")} |`;
  const separatorRow = `| ${tableOp.columns.map(() => "---").join(" | ")} |`;

  // Generate generic data rows based on column count and context
  const dataRows: string[] = [];
  if (tableOp.columns.includes("Advantage") || tableOp.columns.includes("Disadvantage")) {
    dataRows.push(
      `| Builds on existing knowledge | Can be complex for beginners |`,
      `| Proven results across many contexts | Requires consistent application |`,
      `| Transferable to related fields | Takes time to master fully |`
    );
  } else if (tableOp.columns.length === 3) {
    dataRows.push(
      `| Core Concept | The foundational principle | Essential for all applications |`,
      `| Advanced Application | How experts leverage this | Builds on core understanding |`,
      `| Common Pitfall | The most frequent mistake | Knowing this saves significant time |`
    );
  } else {
    dataRows.push(
      `| ${tableOp.columns.map(() => "*See article section*").join(" | ")} |`
    );
  }

  return [
    `## ${section.heading}`,
    ``,
    `${tableOp.purpose}`,
    ``,
    headerRow,
    separatorRow,
    ...dataRows,
    ``,
  ].join("\n");
}

function renderCommonMistakes(section: OutlineSection, pack: KnowledgePack): string {
  const mistakeBlocks = pack.commonMistakes.slice(0, 5).map((mistake, i) => [
    `**${i + 1}. ${mistake.split("—")[0]?.trim() ?? `Mistake ${i + 1}`}**`,
    ``,
    mistake,
  ].join("\n")).join("\n\n");

  return [
    `## ${section.heading}`,
    ``,
    `Even experienced practitioners make predictable errors with ${pack.keyword}. Being aware of these in advance significantly reduces the likelihood of encountering them yourself.`,
    ``,
    mistakeBlocks,
  ].join("\n");
}

function renderFAQ(section: OutlineSection, pack: KnowledgePack): string {
  const faqBlocks = pack.faqs.map(faq => [
    `**${faq.question}**`,
    ``,
    faq.answer,
  ].join("\n")).join("\n\n");

  return [
    `## ${section.heading}`,
    ``,
    faqBlocks,
  ].join("\n");
}

function renderConclusion(section: OutlineSection, pack: KnowledgePack): string {
  const internalLinks = pack.internalLinkSignals.slice(0, 3);
  const linkLines = internalLinks.map(l =>
    `- [${l.suggestedTitle}](/${l.hierarchyLevel}s/${l.suggestedSlug})`
  ).join("\n");

  return [
    `## ${section.heading}`,
    ``,
    `${pack.keyword} is a subject worth understanding well. Its principles are durable, its applications are broad, and the investment in learning it returns value across many contexts.`,
    ``,
    `In this guide, you have covered the core definition, how it works in practice, concrete examples, key concepts, common mistakes, and the most frequently asked questions.`,
    ``,
    `The next step is application — take one concept from this article and apply it to a real situation today.`,
    ``,
    ...(internalLinks.length > 0 ? [
      `### Related Reading`,
      ``,
      linkLines,
    ] : []),
  ].join("\n");
}

function renderNextSteps(section: OutlineSection, pack: KnowledgePack): string {
  const links = pack.internalLinkSignals.slice(0, 3);
  const steps = [
    `1. **Review the core concepts** — go back to the definitions section and ensure each key term is clear.`,
    `2. **Apply one technique** — choose the most relevant example from this article and apply it to your own context.`,
    `3. **Explore related topics** — deepen your understanding by reading the related guides below.`,
  ];

  const linkLines = links.map(l =>
    `- [${l.suggestedTitle}](/${l.hierarchyLevel}s/${l.suggestedSlug})`
  ).join("\n");

  return [
    `## ${section.heading}`,
    ``,
    steps.join("\n"),
    ``,
    ...(links.length > 0 ? [linkLines] : []),
  ].join("\n");
}

function renderPrerequisites(section: OutlineSection, pack: KnowledgePack): string {
  const prereqs = pack.relationships
    .filter(r => r.relationshipType === "prerequisite")
    .map(r => `- **${r.relatedTerm}**: ${r.explanation}`)
    .join("\n");

  return [
    `## ${section.heading}`,
    ``,
    `Before diving into ${pack.keyword}, make sure you are comfortable with the following:`,
    ``,
    prereqs || `- A general understanding of the ${pack.domain} domain`,
    ``,
    `If any of these are unfamiliar, spend a few minutes reviewing them before proceeding — it will make the rest of this guide considerably more accessible.`,
  ].join("\n");
}

function renderStepByStep(section: OutlineSection, pack: KnowledgePack): string {
  const steps = [
    { step: 1, action: "Understand the fundamentals", detail: `Begin by ensuring you have a solid grasp of what ${pack.keyword} is and why it matters. Use the definition and core concepts sections of this article.` },
    { step: 2, action: "Identify your context", detail: `Determine how ${pack.keyword} applies to your specific situation. The approach may vary depending on your goals, resources, and constraints.` },
    { step: 3, action: "Choose your method", detail: `Select the most appropriate technique or approach from the options covered in this guide. Consider the trade-offs.` },
    { step: 4, action: "Apply in a controlled setting", detail: `Before committing to full-scale application, test your understanding in a low-stakes environment.` },
    { step: 5, action: "Evaluate and refine", detail: `After applying ${pack.keyword}, assess the outcome honestly. What worked? What would you adjust? Use this feedback to improve.` },
  ];

  const stepBlocks = steps.map(s => [
    `### Step ${s.step}: ${s.action}`,
    ``,
    s.detail,
  ].join("\n")).join("\n\n");

  return [
    `## ${section.heading}`,
    ``,
    stepBlocks,
  ].join("\n");
}

function renderGenericSection(section: OutlineSection, pack: KnowledgePack): string {
  return [
    `## ${section.heading}`,
    ``,
    `This section covers ${section.purpose.toLowerCase()}.`,
    ``,
    section.guidance,
  ].join("\n");
}

// ─── Deterministic Writer ─────────────────────────────────────────────────────

function renderSection(section: OutlineSection, pack: KnowledgePack): string {
  switch (section.type) {
    case "introduction":     return renderIntroduction(section, pack);
    case "definition":       return renderDefinition(section, pack);
    case "how_it_works":     return renderHowItWorks(section, pack);
    case "core_concepts":    return renderCoreConceptsSection(section, pack);
    case "examples":         return renderExamples(section, pack);
    case "table":            return renderTable(section, pack);
    case "common_mistakes":  return renderCommonMistakes(section, pack);
    case "faq":              return renderFAQ(section, pack);
    case "conclusion":       return renderConclusion(section, pack);
    case "next_steps":       return renderNextSteps(section, pack);
    case "prerequisites":    return renderPrerequisites(section, pack);
    case "step_by_step":     return renderStepByStep(section, pack);
    default:                 return renderGenericSection(section, pack);
  }
}

class DeterministicKnowledgeWriter implements LLMProvider {
  name = "deterministic";

  isAvailable(): boolean { return true; }

  async write(pack: KnowledgePack, outline: ArticleOutline): Promise<WrittenArticle> {
    const sections = [...outline.sections].sort((a, b) => a.order - b.order);
    const renderedSections = sections.map(s => renderSection(s, pack));
    const content = renderedSections.join("\n\n");

    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const excerpt = `${pack.definition} This guide covers core concepts, practical examples, common mistakes, and the most frequently asked questions about ${pack.keyword}.`.slice(0, 250);

    return {
      title: outline.articleTitle,
      excerpt,
      content,
      metaTitle: outline.articleTitle.length <= 60 ? outline.articleTitle : `${outline.articleTitle.slice(0, 57)}...`,
      metaDescription: `Learn about ${pack.keyword}. ${pack.domain} guide covering definitions, examples, FAQ and more.`.slice(0, 160),
      wordCount,
      sectionsWritten: sections.length,
      writerType: "deterministic",
      writtenAt: new Date().toISOString(),
    };
  }
}

// ─── Provider Registry ────────────────────────────────────────────────────────

let activeLLMProvider: LLMProvider = new DeterministicKnowledgeWriter();

export function setLLMProvider(provider: LLMProvider): void {
  activeLLMProvider = provider;
}

export function getLLMProvider(): LLMProvider {
  return activeLLMProvider;
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export async function writeFromKnowledgePack(
  pack: KnowledgePack,
  outline: ArticleOutline
): Promise<WrittenArticle> {
  return activeLLMProvider.write(pack, outline);
}

/**
 * Build the LLM prompt string for an external provider.
 * When wiring a real LLM, pass this to the model instead of raw keyword.
 */
export function buildLLMPrompt(pack: KnowledgePack, outline: ArticleOutline): string {
  const sectionsText = outline.sections
    .sort((a, b) => a.order - b.order)
    .map(s => `### Section ${s.order}: ${s.heading} (${s.type})\nPurpose: ${s.purpose}\nGuidance: ${s.guidance}\nRequired elements: ${s.requiredElements.join(", ")}\nEstimated words: ${s.estimatedWords}`)
    .join("\n\n");

  const entitiesText = pack.entities.map(e => `- ${e.name} (${e.type}, ${e.relevance}): ${e.description}`).join("\n");
  const faqsText = pack.faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
  const examplesText = pack.examples.map(e => `${e.title}: ${e.scenario} → ${e.outcome}`).join("\n\n");
  const mistakesText = pack.commonMistakes.map((m, i) => `${i + 1}. ${m}`).join("\n");

  return `You are a world-class knowledge writer for Valendiro, an autonomous knowledge platform.

INSTRUCTIONS:
- Write ONLY from the Knowledge Pack below. Do not add information not present in the pack.
- Follow the Article Outline EXACTLY. Write every section in order.
- Use real examples from the pack. Do NOT use generic filler content.
- Every article must include: examples, at least one table, FAQ section, Conclusion.
- No placeholder text. No "to be completed" phrases. Every section must be fully written.
- Target word count: ${outline.targetWordCount} words.

---

KNOWLEDGE PACK
Keyword: ${pack.keyword}
Category: ${pack.categoryLabel}
Domain: ${pack.domain}
Search Intent: ${pack.searchIntent}

Definition:
${pack.definition}

Core Concepts Summary:
${pack.coreConceptsSummary}

Key Entities:
${entitiesText}

Examples:
${examplesText}

Common Mistakes:
${mistakesText}

FAQs:
${faqsText}

Internal Link Opportunities:
${pack.internalLinkSignals.map(l => `- ${l.suggestedTitle} (${l.hierarchyLevel})`).join("\n")}

---

ARTICLE OUTLINE
Title: ${outline.articleTitle}
Article Type: ${outline.articleType}
Target Word Count: ${outline.targetWordCount}

Sections to write:
${sectionsText}

---

Write the complete article in Markdown. Follow each section exactly as specified above.`;
}
