/**
 * Knowledge Composition Engine
 *
 * Transforms raw knowledge packages into reader-centric articles.
 * 
 * Philosophy: Every article should feel like it was written by an experienced educator,
 * not by a database. The reader should finish understanding the topic, not just reading facts.
 *
 * Core principles:
 * - Reader-first: "What does a complete beginner need to understand this?"
 * - Natural flow: Simple → Technical → Example → Application → Implications
 * - Every fact explained: What? Why? How? When? Where? Why does it matter?
 * - Dynamic length: Based on topic complexity, not word count targets
 * - Static output: All reasoning happens before rendering
 */

import type { PluginFact, RendererConfig, DocumentNode } from "../types";
import { ExplanationEngine } from "./explanationEngine";
import { ExampleGenerator } from "./exampleGenerator";
import { TransitionGenerator } from "./transitionGenerator";
import { ContextBuilder } from "./contextBuilder";
import { ReaderFlowValidator } from "./readerFlowValidator";

export interface CompositionContext {
  facts: PluginFact[];
  config: RendererConfig;
  subject: string;
  intent: "inform" | "educate" | "guide" | "decide";
  complexity: "beginner" | "intermediate" | "advanced";
}

export interface ComposedSection {
  type: string;
  heading: string;
  content: DocumentNode[];
  order: number;
  required: boolean;
}

export interface CompositionResult {
  documentTree: DocumentNode[];
  sections: ComposedSection[];
  qualityReport: QualityReport;
}

export interface QualityReport {
  educationalValue: number;
  clarity: number;
  logicalFlow: number;
  explanationDepth: number;
  readerExperience: number;
  issues: QualityIssue[];
}

export interface QualityIssue {
  type: "missing_explanation" | "weak_transition" | "no_example" | "repetitive" | "unclear" | "complexity_jump" | "missing_section";
  severity: "critical" | "warning" | "info";
  message: string;
  location: string;
}

export class KnowledgeComposer {
  private explanationEngine: ExplanationEngine;
  private exampleGenerator: ExampleGenerator;
  private transitionGenerator: TransitionGenerator;
  private contextBuilder: ContextBuilder;
  private flowValidator: ReaderFlowValidator;

  constructor() {
    this.explanationEngine = new ExplanationEngine();
    this.exampleGenerator = new ExampleGenerator();
    this.transitionGenerator = new TransitionGenerator();
    this.contextBuilder = new ContextBuilder();
    this.flowValidator = new ReaderFlowValidator();
  }

  /**
   * Main composition entry point
   * Transforms raw facts into a reader-centric article structure
   */
  compose(
    facts: PluginFact[],
    config: RendererConfig
  ): CompositionResult {
    const context: CompositionContext = {
      facts: this.sanitizeFacts(facts),
      config,
      subject: this.extractSubject(config.slug),
      intent: config.intent,
      complexity: this.assessComplexity(facts, config.style),
    };

    // Build the article structure following reader-first principles
    const sections = this.buildArticleStructure(context);
    
    // Enrich each section with explanations, examples, and context
    const enrichedSections = this.enrichSections(sections, context);
    
    // Generate the document tree
    const documentTree = this.buildDocumentTree(enrichedSections, context);
    
    // Validate reader flow and generate quality report
    const qualityReport = this.validateQuality(documentTree, context);

    return {
      documentTree,
      sections: enrichedSections,
      qualityReport,
    };
  }

  /**
   * Build article structure following natural reader journey
   * Introduction → Core Concept → How it Works → Example → Applications →
   * Benefits → Limitations → Common Mistakes → Best Practices → Related Concepts → Summary
   */
  private buildArticleStructure(context: CompositionContext): ComposedSection[] {
    const sections: ComposedSection[] = [];
    const { facts, subject } = context;

    // Group facts by type for intelligent section allocation
    const byType = this.groupFactsByType(facts);

    // 1. Problem/Introduction (always required)
    sections.push({
      type: "introduction",
      heading: `What is ${subject}?`,
      content: [],
      order: 1,
      required: true,
    });

    // 2. Why it matters (importance context)
    sections.push({
      type: "importance",
      heading: "Why This Matters",
      content: [],
      order: 2,
      required: true,
    });

    // 3. Fundamental concept (if definitions exist)
    if (byType.definition?.length > 0) {
      sections.push({
        type: "core-concept",
        heading: "Core Concept",
        content: [],
        order: 3,
        required: true,
      });
    }

    // 4. How it works (if procedural/causal facts exist)
    if (byType.procedural?.length > 0 || byType.causal?.length > 0) {
      sections.push({
        type: "how-it-works",
        heading: "How It Works",
        content: [],
        order: 4,
        required: true,
      });
    }

    // 5. Real-world example (always add for better comprehension)
    sections.push({
      type: "example",
      heading: "Real-World Example",
      content: [],
      order: 5,
      required: true,
    });

    // 6. Applications (if property facts exist)
    if (byType.property?.length > 0) {
      sections.push({
        type: "applications",
        heading: "Practical Applications",
        content: [],
        order: 6,
        required: true,
      });
    }

    // 7. Advantages (if property/comparison facts exist)
    if (byType.property?.length > 0 || byType.comparison?.length > 0) {
      sections.push({
        type: "benefits",
        heading: "Advantages and Benefits",
        content: [],
        order: 7,
        required: true,
      });
    }

    // 8. Limitations (if warning facts exist)
    if (byType.warning?.length > 0) {
      sections.push({
        type: "limitations",
        heading: "Limitations and Considerations",
        content: [],
        order: 8,
        required: true,
      });
    }

    // 9. Common mistakes (if rule facts exist)
    if (byType.rule?.length > 0) {
      sections.push({
        type: "mistakes",
        heading: "Common Mistakes to Avoid",
        content: [],
        order: 9,
        required: true,
      });
    }

    // 10. Best practices (if procedural facts exist)
    if (byType.procedural?.length > 0) {
      sections.push({
        type: "best-practices",
        heading: "Best Practices",
        content: [],
        order: 10,
        required: true,
      });
    }

    // 11. Summary (always required for completeness)
    sections.push({
      type: "summary",
      heading: "Key Takeaways",
      content: [],
      order: 11,
      required: true,
    });

    return sections;
      content: [],
      order: 12,
      required: true,
    });

    return sections;
  }

  /**
   * Enrich sections with explanations, examples, and context
   */
  private enrichSections(
    sections: ComposedSection[],
    context: CompositionContext
  ): ComposedSection[] {
    const byType = this.groupFactsByType(context.facts);

    return sections.map((section) => {
      const enriched = { ...section };
      
      // Allocate relevant facts to section
      const sectionFacts = this.allocateFactsToSection(section.type, byType);
      
      // Add examples where appropriate (skip explanation for now to avoid integration issues)
      const withExamples = this.exampleGenerator.addExamples(
        sectionFacts,
        section.type,
        context
      );
      
      // Build content nodes
      enriched.content = this.buildSectionContent(
        section.type,
        withExamples,
        context
      );
      
      return enriched;
    });
  }

  /**
   * Build document tree from enriched sections
   */
  private buildDocumentTree(
    sections: ComposedSection[],
    context: CompositionContext
  ): DocumentNode[] {
    const tree: DocumentNode[] = [];

    // Title
    tree.push({
      type: "heading",
      level: 1,
      text: context.subject,
      anchor: "title",
    });

    // Build sections with natural transitions
    let previousSection: string | null = null;
    for (const section of sections) {
      // Add transition between sections
      if (previousSection) {
        const transition = this.transitionGenerator.generateTransition(
          previousSection,
          section.type,
          context
        );
        if (transition) {
          tree.push({ type: "paragraph", children: [transition] });
        }
      }

      // Add section heading
      tree.push({
        type: "heading",
        level: 2,
        text: section.heading,
        anchor: section.heading.toLowerCase().replace(/\s+/g, "-"),
      });

      // Add section content
      tree.push(...section.content);

      previousSection = section.type;
    }

    return tree;
  }

  /**
   * Validate quality and generate report
   */
  private validateQuality(
    tree: DocumentNode[],
    context: CompositionContext
  ): QualityReport {
    return this.flowValidator.validate(tree, context);
  }

  /**
   * Allocate facts to appropriate sections
   */
  private allocateFactsToSection(
    sectionType: string,
    byType: Record<string, PluginFact[]>
  ): PluginFact[] {
    const allocation: Record<string, string[]> = {
      "introduction": ["definition"],
      "core-concept": ["definition"],
      "how-it-works": ["procedural", "causal"],
      "example": ["property"],
      "applications": ["procedural"],
      "benefits": ["property"],
      "limitations": ["comparison", "warning"],
      "mistakes": ["warning", "rule"],
      "best-practices": ["rule"],
      "history": ["historical"],
      "related": [],
      "summary": [],
    };

    const factTypes = allocation[sectionType] || [];
    const facts: PluginFact[] = [];
    
    for (const type of factTypes) {
      if (byType[type]) {
        facts.push(...byType[type]);
      }
    }

    return facts;
  }

  /**
   * Build section content from enriched facts
   */
  private buildSectionContent(
    sectionType: string,
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    
    if (facts.length === 0) {
      return nodes;
    }

    // Add section intro transition (not context - avoid duplication)
    const sectionIntro = this.transitionGenerator.generateSectionIntro(sectionType, context);
    if (sectionIntro) {
      nodes.push({ type: "paragraph", children: [sectionIntro] });
    }

    // Render facts based on section type with better explanations
    switch (sectionType) {
      case "introduction":
      case "core-concept":
        nodes.push(...this.renderDefinitionSection(facts, context));
        break;
      case "how-it-works":
      case "applications":
        nodes.push(...this.renderProceduralSection(facts, context));
        break;
      case "example":
      case "benefits":
        nodes.push(...this.renderPropertySection(facts, context));
        break;
      case "limitations":
      case "mistakes":
        nodes.push(...this.renderWarningSection(facts, context));
        break;
      case "best-practices":
        nodes.push(...this.renderRuleSection(facts, context));
        break;
      case "history":
        nodes.push(...this.renderHistoricalSection(facts, context));
        break;
      case "summary":
        nodes.push(...this.renderSummarySection(facts, context));
        break;
      default:
        nodes.push(...this.renderGenericSection(facts, context));
    }

    // Add section conclusion
    const sectionConclusion = this.transitionGenerator.generateSectionConclusion(sectionType, context);
    if (sectionConclusion) {
      nodes.push({ type: "paragraph", children: [sectionConclusion] });
    }

    return nodes;
  }

  // Section renderers
  private renderDefinitionSection(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    const subject = context.subject;
    const leadFact = facts[0];
    
    // Direct definition without repetitive openers
    const openers = [
      `${leadFact.statement}`,
      `${subject} is ${leadFact.statement.toLowerCase()}`,
      `At its core, ${subject} means: ${leadFact.statement}`,
    ];
    nodes.push({
      type: "paragraph",
      children: [openers[Math.floor(Math.random() * openers.length)]],
    });

    // Add remaining definitions with varied connectors
    const rest = facts.slice(1);
    const connectors = [
      ["Additionally", ""],
      ["Building on this", ""],
      ["Furthermore", ""],
      ["In practice", ""],
      ["This means", ""],
    ];
    
    for (let i = 0; i < rest.length; i++) {
      const fact = rest[i];
      const [connector] = connectors[i % connectors.length];
      nodes.push({
        type: "paragraph",
        children: [`${connector}, ${fact.statement.charAt(0).toLowerCase() + fact.statement.slice(1)}.`],
      });
    }

    return nodes;
  }

  private renderProceduralSection(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    const subject = context.subject;
    
    if (context.intent === "guide" || context.intent === "decide") {
      // Numbered steps with explanations for guide/decide intent
      nodes.push({
        type: "paragraph",
        children: [`To apply ${subject} effectively, follow these steps in order. Each step builds on the previous one, so don't skip ahead.`],
      });
      nodes.push({
        type: "list",
        ordered: true,
        items: facts.map((f, i) => ({
          type: "list-item",
          children: [`${f.statement} ${i === 0 ? "This is your starting point." : i === facts.length - 1 ? "This completes the process." : "Continue to the next step."}`],
        })),
      });
    } else {
      // Prose for educate/inform intent with explanatory flow
      nodes.push({
        type: "paragraph",
        children: [`The process for ${subject} follows a logical sequence. Understanding each step helps you apply the knowledge effectively.`],
      });
      
      const connectors = [
        "First,",
        "Next,",
        "Then,",
        "After that,",
        "Finally,",
      ];
      
      for (let i = 0; i < facts.length; i++) {
        const fact = facts[i];
        const connector = connectors[Math.min(i, connectors.length - 1)];
        nodes.push({
          type: "paragraph",
          children: [`${connector} ${fact.statement.charAt(0).toLowerCase() + fact.statement.slice(1)}. ${i === facts.length - 1 ? "This completes the core process." : "Let's continue to the next step."}`],
        });
      }
    }

    return nodes;
  }

  private renderPropertySection(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    const subject = context.subject;
    
    nodes.push({
      type: "paragraph",
      children: [`Understanding the characteristics of ${subject} helps explain why it's valuable and how it functions in practice.`],
    });
    
    // Group 2-3 facts per paragraph with explanatory connectors
    for (let i = 0; i < facts.length; i += 2) {
      const group = facts.slice(i, i + 2);
      const parts = group.map((f, j) => {
        const s = f.statement.replace(/\.$/, "");
        if (j === 0) return `${s}.`;
        const connectors = ["This means", "This is important because", "This suggests that"];
        const connector = connectors[Math.floor(Math.random() * connectors.length)];
        return `${connector} ${s.charAt(0).toLowerCase() + s.slice(1)}.`;
      });
      
      nodes.push({ 
        type: "paragraph", 
        children: [parts.join(" ") + (i + 2 < facts.length ? " These characteristics work together to define ${subject}." : "")] 
      });
    }

    return nodes;
  }

  private renderWarningSection(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    const subject = context.subject;
    
    nodes.push({
      type: "paragraph",
      children: [`Being aware of these common pitfalls when working with ${subject} will help you avoid costly mistakes and achieve better results.`],
    });
    
    for (const fact of facts) {
      nodes.push({
        type: "callout",
        variant: "warning",
        title: null,
        children: [{ type: "paragraph", children: [fact.statement] }],
      });
    }

    return nodes;
  }

  private renderRuleSection(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    const subject = context.subject;
    
    nodes.push({
      type: "paragraph",
      children: [`Following these best practices will help you get the most out of ${subject} and avoid common mistakes that many people make.`],
    });
    
    for (const fact of facts) {
      nodes.push({
        type: "callout",
        variant: "tip",
        title: null,
        children: [{ type: "paragraph", children: [fact.statement] }],
      });
    }

    return nodes;
  }

  private renderHistoricalSection(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    const subject = context.subject;
    
    nodes.push({
      type: "paragraph",
      children: [`Understanding the history of ${subject} provides valuable context for why it exists in its current form and how it has evolved over time.`],
    });
    
    for (let i = 0; i < facts.length; i += 2) {
      const group = facts.slice(i, i + 2);
      const parts = group.map((f) => f.statement).join(" ");
      nodes.push({ type: "paragraph", children: [parts] });
    }

    return nodes;
  }

  private renderSummarySection(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    const subject = context.subject;
    
    const intros = [
      `To summarize ${subject}:`,
      `Key points about ${subject}:`,
      `Here's what to remember about ${subject}:`,
    ];
    nodes.push({
      type: "paragraph",
      children: [intros[Math.floor(Math.random() * intros.length)]],
    });
    
    // Take top 5 facts for summary
    const topFacts = facts.slice(0, 5);
    const closings = [
      `With these fundamentals, you can apply ${subject} effectively.`,
      `These points will help you work with ${subject}.`,
      `You now have the basics to continue exploring ${subject}.`,
    ];
    nodes.push({
      type: "summary",
      keyPoints: topFacts.map((f) => f.statement),
      closingSentence: closings[Math.floor(Math.random() * closings.length)],
    });

    return nodes;
  }

  private renderGenericSection(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    
    for (const fact of facts) {
      nodes.push({ type: "paragraph", children: [fact.statement] });
    }

    return nodes;
  }

  // Utilities
  private sanitizeFacts(facts: PluginFact[]): PluginFact[] {
    const seen = new Set<string>();
    return facts.filter((f) => {
      const key = f.statement.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (seen.has(key)) return false;
      seen.add(key);
      return f.statement.trim().split(/\s+/).length > 4;
    });
  }

  private groupFactsByType(facts: PluginFact[]): Record<string, PluginFact[]> {
    const byType: Record<string, PluginFact[]> = {};
    for (const fact of facts) {
      if (!byType[fact.factType]) {
        byType[fact.factType] = [];
      }
      byType[fact.factType].push(fact);
    }
    return byType;
  }

  private extractSubject(slug: string): string {
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  private assessComplexity(
    facts: PluginFact[],
    style: string[]
  ): "beginner" | "intermediate" | "advanced" {
    if (style.includes("expert")) return "advanced";
    if (style.includes("beginner")) return "beginner";
    return "intermediate";
  }
}
