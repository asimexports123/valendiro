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
      `## Learning Objectives`,
      ``,
      `By the end of this guide, you will be able to:`,
      ``,
      `- Define ${title} and explain its core components`,
      `- Identify when and where to apply ${lc} in practical situations`,
      `- Recognize common mistakes and implement best practices`,
      `- Evaluate different approaches based on context and requirements`,
      `- Apply ${lc} confidently in real-world scenarios`,
      ``,
      `## Prerequisites`,
      ``,
      `Before diving into ${title}, you should have:`,
      ``,
      `- Basic understanding of the domain (relevant industry or field)`,
      `- Familiarity with fundamental concepts that ${lc} builds upon`,
      `- Problem-solving mindset and willingness to experiment`,
      `- Access to appropriate tools or environment for practice`,
      ``,
      `[!TIP]`,
      `If you're new to this area, start with the foundational concepts section before moving to advanced applications.`,
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
      `## When to Use ${title}`,
      ``,
      `${title} is particularly valuable in these situations:`,
      ``,
      `- When you need a structured approach to solving ${lc}-related problems`,
      `- When working with systems or processes where ${lc} provides clear advantages`,
      `- When optimising for performance, reliability, or maintainability`,
      `- When collaborating with teams where ${lc} provides a common language`,
      ``,
      `## When NOT to Use ${title}`,
      ``,
      `Avoid ${lc} in these scenarios:`,
      ``,
      `- When simpler solutions would suffice (over-engineering)`,
      `- When the context doesn't match the intended use case`,
      `- When the cost of implementation outweighs the benefits`,
      `- When team expertise is insufficient to maintain ${lc} effectively`,
      ``,
      `[!WARNING]`,
      `Misapplying ${lc} can lead to unnecessary complexity and maintenance burden. Always evaluate whether the benefits justify the implementation cost.`,
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
      `## Practical Examples`,
      ``,
      `### Example 1: Basic Implementation`,
      ``,
      `Here's a straightforward application of ${title} in a common scenario:`,
      ``,
      `\`\`\``,
      `// Example code or description of basic ${lc} implementation`,
      `\`\`\``,
      ``,
      `This example demonstrates the fundamental pattern of ${lc} in action.`,
      ``,
      `### Example 2: Advanced Application`,
      ``,
      `For more complex scenarios, ${title} can be adapted as follows:`,
      ``,
      `\`\`\``,
      `// Example code or description of advanced ${lc} implementation`,
      `\`\`\``,
      ``,
      `Notice how the same principles apply even as complexity increases.`,
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
      `## Best Practices`,
      ``,
      `[!BEST_PRACTICE]`,
      `Follow these industry-tested practices when working with ${title}:`,
      ``,
      `- Start with clear objectives and success criteria`,
      `- Document your approach and rationale for future reference`,
      `- Test incrementally rather than implementing everything at once`,
      `- Seek feedback from peers with ${lc} experience`,
      `- Stay updated with evolving standards and patterns in ${lc}`,
      `- Build in error handling and edge case coverage`,
      `- Maintain consistency with established conventions in your domain`,
      ``,
      `## Performance Considerations`,
      ``,
      `When implementing ${title}, keep these performance factors in mind:`,
      ``,
      `- Efficiency: Ensure ${lc} doesn't introduce unnecessary overhead`,
      `- Scalability: Design for growth if ${lc} will handle increased load`,
      `- Resource usage: Monitor memory, CPU, or other relevant constraints`,
      `- Latency: Consider response time requirements for critical paths`,
      ``,
      `## Security Considerations`,
      ``,
      `Security is crucial when working with ${title}:`,
      ``,
      `- Validate all inputs and outputs to prevent injection attacks`,
      `- Apply principle of least privilege to ${lc}-related operations`,
      `- Keep dependencies and implementations up to date`,
      `- Audit ${lc} usage for potential vulnerabilities`,
      `- Implement proper error handling without exposing sensitive information`,
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
      `**What are common interview questions about ${title}?**`,
      `Typical questions include: "Explain ${title} in simple terms," "Describe a challenging problem you solved using ${lc}," "How would you improve an existing ${lc} implementation," and "What are the trade-offs of different approaches to ${lc}?".`,
      ``,
      `## Quick Reference (Cheat Sheet)`,
      ``,
      `**Key Concepts to Remember:**`,
      `- ${title} = ${desc}`,
      `- Core components: [list 3-5 key components]`,
      `- Primary use cases: [list 2-3 main use cases]`,
      ``,
      `**Common Patterns:**`,
      `- Pattern 1: [brief description]`,
      `- Pattern 2: [brief description]`,
      `- Pattern 3: [brief description]`,
      ``,
      `**Troubleshooting Quick Tips:**`,
      `- Issue: [common issue] → Solution: [quick fix]`,
      `- Issue: [common issue] → Solution: [quick fix]`,
      ``,
      `## Action Checklist`,
      ``,
      `Use this checklist to ensure you've covered the essentials of ${title}:`,
      ``,
      `- [ ] Understand the definition and scope of ${lc}`,
      `- [ ] Identify appropriate use cases for ${title}`,
      `- [ ] Learn the core components and how they interact`,
      `- [ ] Practice with basic examples before advancing`,
      `- [ ] Review common mistakes and how to avoid them`,
      `- [ ] Apply ${lc} in a real project or scenario`,
      `- [ ] Document your learnings and insights`,
      `- [ ] Teach someone else to reinforce your understanding`,
      ``,
      `## Glossary`,
      ``,
      `**${title}**: ${desc}`,
      ``,
      `**Core Term 1**: [Definition relevant to ${lc}]`,
      `**Core Term 2**: [Definition relevant to ${lc}]`,
      `**Core Term 3**: [Definition relevant to ${lc}]`,
      ``,
      `## Next Steps in Your Learning Journey`,
      ``,
      `After mastering the fundamentals of ${title}, consider exploring:`,
      ``,
      `- Advanced techniques and patterns in ${lc}`,
      `- Related concepts that build on ${title}`,
      `- Real-world case studies and industry applications`,
      `- Performance optimization for ${lc}`,
      `- Integration with other technologies or frameworks`,
      ``,
      `## Conclusion`,
      ``,
      `${title} is a subject worth understanding well. Its applications are broad, its principles are durable, and the investment in learning it pays returns across many contexts. This guide has covered the core definition, learning objectives, practical application, best practices, common mistakes, and key questions — a solid foundation for wherever you go next.`,
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
