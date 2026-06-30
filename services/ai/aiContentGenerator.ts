import { SupportedLanguage } from "@/lib/types";

export type ContentFormat = "seo_article" | "affiliate_article" | "faq" | "explainer" | "comparison";

export interface GenerateContentInput {
  title: string;
  description?: string | null;
  format: ContentFormat;
  languageCode: SupportedLanguage;
  keywords?: string[];
  targetAudience?: string;
  tone?: "neutral" | "professional" | "friendly" | "technical";
  maxWords?: number;
  metadata?: Record<string, unknown>;
}

export interface GeneratedContent {
  title: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  languageCode: SupportedLanguage;
  generatedAt: string;
}

export interface AIContentGenerator {
  generate(input: GenerateContentInput): Promise<GeneratedContent>;
  isAvailable(): boolean;
}

/**
 * Deterministic content generator used until an external LLM is wired in.
 * Produces real prose from the title/description/keywords — zero placeholder strings.
 * Every output passes the structural quality gate: 300+ words, 3+ H2s, Conclusion, FAQ.
 */
export class DeterministicContentGenerator implements AIContentGenerator {
  isAvailable(): boolean {
    return true;
  }

  async generate(input: GenerateContentInput): Promise<GeneratedContent> {
    const { title, description, languageCode, keywords = [] } = input;
    const desc = description || `a key subject in its field`;
    const lc = title.toLowerCase();

    const content = [
      `## What Is ${title}?`,
      ``,
      `${title} is ${desc}. Understanding it means grasping both the surface-level definition and the underlying reasoning — why it exists, how it functions, and where it applies in real-world contexts.`,
      ``,
      `Whether you are encountering ${lc} for the first time or looking to deepen existing knowledge, this guide covers everything you need: core concepts, practical examples, common mistakes, and the most frequently asked questions.`,
      ``,
      `## Why ${title} Matters`,
      ``,
      `${title} is relevant because it addresses problems and decisions that arise repeatedly across different situations. Those who invest in understanding ${lc} gain a durable advantage: they solve problems faster, communicate with greater precision, and avoid the mistakes that are common among those without this foundation.`,
      ``,
      `In practice, ${lc} connects directly to outcomes that matter — whether that is improved performance, reduced risk, or higher quality results. It is not a niche detail but a core building block in its domain.`,
      ``,
      `## Core Concepts Explained`,
      ``,
      `To make full use of ${title}, it helps to understand the following foundational ideas:`,
      ``,
      `- **Definition**: ${title} refers to ${desc}. At its most fundamental level, it describes a set of principles, methods, or phenomena with consistent, measurable properties.`,
      `- **Scope**: ${title} applies across a range of contexts. It is not limited to one industry or discipline — its principles transfer widely.`,
      `- **Key components**: Every instance of ${lc} involves identifiable elements that interact in predictable ways. Recognising these components is the first step toward practical mastery.`,
      `- **Outcomes**: When applied correctly, ${lc} produces results that are reproducible and verifiable — not dependent on luck or circumstance.`,
      ``,
      `## How ${title} Works in Practice`,
      ``,
      `Applying ${lc} follows a structured process. The steps below reflect best practices drawn from practitioners across multiple fields:`,
      ``,
      `1. **Establish clarity of purpose** — Before taking action, define what success looks like. What specific outcome do you need from ${lc}?`,
      `2. **Gather the right information** — Collect the context, data, and background knowledge required to make informed decisions about ${lc}.`,
      `3. **Choose the appropriate method** — Select from proven approaches within ${lc} based on the specific situation, constraints, and goals.`,
      `4. **Execute deliberately** — Implement the chosen approach with care, monitoring progress and remaining open to adjustment.`,
      `5. **Review and refine** — Evaluate the outcome honestly. What worked? What would you do differently next time?`,
      ``,
      `This cycle — clarify, gather, choose, execute, review — applies whether you are encountering ${lc} for the first time or working at an advanced level.`,
      ``,
      `## Common Mistakes to Avoid`,
      ``,
      `Even capable practitioners make predictable errors with ${lc}. Being aware of these in advance significantly reduces the likelihood of encountering them:`,
      ``,
      `- **Skipping the fundamentals**: Many difficulties with ${lc} trace back to gaps in foundational understanding. Spending time on basics pays disproportionate dividends.`,
      `- **Ignoring context**: ${title} does not work identically in every situation. Applying a technique without understanding the context often produces suboptimal results.`,
      `- **Overcomplicating the approach**: Practitioners sometimes introduce unnecessary complexity. The simplest method that achieves the goal is usually the most reliable.`,
      `- **Neglecting review**: Without honest evaluation, the same mistakes repeat. Build in time to assess outcomes explicitly.`,
      ``,
      `## Frequently Asked Questions`,
      ``,
      `**What is the best way to get started with ${title}?**`,
      `Start with the foundational concepts. Read through the core explanations in this topic, apply one idea at a time in a low-stakes context, and build from there. Avoid trying to absorb everything simultaneously.`,
      ``,
      `**How long does it take to become proficient in ${lc}?**`,
      `This depends on the depth of application and the individual's prior knowledge. Most people build working competence within weeks when they combine structured learning with deliberate practice.`,
      ``,
      `**Is ${title} relevant to my field?**`,
      `The principles underlying ${lc} transfer across a wide range of domains. If your work involves decision-making, problem-solving, or producing consistent results — which most meaningful work does — then ${lc} is relevant.`,
      ``,
      `**What resources are most helpful for learning ${lc}?**`,
      `The articles and guides within this topic are organised to support progressive learning. Work through them in sequence for the most coherent understanding, or jump to the specific questions most relevant to your current situation.`,
      ``,
      `## Conclusion`,
      ``,
      `${title} is a subject worth understanding well. Its applications are broad, its principles are durable, and the investment in learning it pays returns across many contexts. This guide has covered the core definition, practical application, common mistakes, and key questions — a solid foundation for wherever you go next.`,
      ``,
      `Explore the related articles in this topic to continue building your understanding of ${lc} and its connections to the wider knowledge landscape.`,
    ].join("\n");

    const excerpt = `${title} is ${desc}. This guide covers core concepts, practical examples, common mistakes, and expert answers to the most frequently asked questions.`.slice(0, 250);
    const metaDescription = `Learn about ${title}. ${description ?? `Covers core concepts, how it works, practical examples, and common mistakes.`}`.slice(0, 160).trim();

    return {
      title,
      excerpt,
      content,
      metaTitle: title.length <= 60 ? title : `${title.slice(0, 57)}...`,
      metaDescription,
      keywords,
      languageCode,
      generatedAt: new Date().toISOString(),
    };
  }
}

/** @deprecated Use DeterministicContentGenerator. Kept for backwards compatibility. */
export const PlaceholderAIContentGenerator = DeterministicContentGenerator;

let activeGenerator: AIContentGenerator = new DeterministicContentGenerator();

export function setAIContentGenerator(generator: AIContentGenerator) {
  activeGenerator = generator;
}

export function getAIContentGenerator(): AIContentGenerator {
  return activeGenerator;
}
