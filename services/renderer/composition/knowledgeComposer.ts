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
  category: string;
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
      category: config.category,
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
   * Introduction → Why it Matters → Core Concept → How it Works → Example →
   * Applications → Benefits → Pros & Cons → Common Mistakes → Best Practices →
   * Expert Insight → Comparison → FAQ → Summary → Continue Learning
   * 
   * Philosophy: Progressive teaching from simple to complex
   * Every section builds on the previous one
   * Reader should never feel lost or overwhelmed
   */
  private buildArticleStructure(context: CompositionContext): ComposedSection[] {
    const sections: ComposedSection[] = [];
    const { facts, subject } = context;
    const category = context.config.category;

    // Group facts by type for intelligent section allocation
    const byType = this.groupFactsByType(facts);

    // Category-specific component emphasis
    const categoryEmphasis = this.getCategoryEmphasis(category);

    // 1. Introduction (always required - sets the stage with engaging hook)
    const introHeading = this.generateEngagingIntroHeading(subject, category, context.intent);
    sections.push({
      type: "introduction",
      heading: introHeading,
      content: [],
      order: 1,
      required: true,
    });

    // Phase 19: Remove Learning Objectives and Importance sections to reduce word count

    // 2. Core Concept (foundational understanding)
    if (byType.definition?.length > 0) {
      sections.push({
        type: "core-concept",
        heading: this.generateSectionHeading("core-concept", subject, category),
        content: [],
        order: 2,
        required: true,
      });
    }

    // Phase 19: Remove How It Works, Real-World Example, Practical Applications to reduce word count
    // These are redundant with Core Concept and don't add significant value for compression goal

    // 3. Comparison (when relevant - context matters)
    if (byType.comparison?.length > 0 && (context.intent === "decide" || context.intent === "guide")) {
      sections.push({
        type: "comparison-table",
        heading: "Comparison",
        content: [],
        order: 9,
        required: false,
      });
    }

    // 10. Pros & Cons (balanced view)
    if (byType.comparison?.length > 0 || byType.warning?.length > 0) {
      sections.push({
        type: "pros-cons",
        heading: "Pros & Cons",
        content: [],
        order: 10,
        required: false,
      });
    }

    // 11. Common Mistakes (what to avoid)
    if (byType.warning?.length > 0) {
      sections.push({
        type: "mistakes",
        heading: "Common Mistakes to Avoid",
        content: [],
        order: 11,
        required: true,
      });
    }

    // 12. Best Practices (what to do)
    if (byType.rule?.length > 0 || byType.procedural?.length > 0) {
      sections.push({
        type: "best-practices",
        heading: "Best Practices",
        content: [],
        order: 12,
        required: true,
      });
    }

    // Category-specific: Pro Tip (expert advice)
    if ((category === "technology" || category === "business") && (byType.rule?.length > 0 || byType.procedural?.length > 0)) {
      sections.push({
        type: "pro-tip",
        heading: "Pro Tip",
        content: [],
        order: 13,
        required: false,
      });
    }

    // 13. Expert Insight (deeper context)
    if (byType.definition?.length > 0 || byType.historical?.length > 0) {
      sections.push({
        type: "expert-insight",
        heading: "Expert Insight",
        content: [],
        order: 14,
        required: false,
      });
    }

    // Category-specific: Framework (structured understanding)
    if ((category === "technology" || category === "education") && byType.definition?.length > 2) {
      sections.push({
        type: "framework-box",
        heading: "Key Framework",
        content: [],
        order: 15,
        required: false,
      });
    }

    // Category-specific: FAQ (natural questions)
    if (byType.definition?.length > 0 || byType.procedural?.length > 0) {
      sections.push({
        type: "faq",
        heading: "Frequently Asked Questions",
        content: [],
        order: 16,
        required: false,
      });
    }

    // Category-specific: Checklist (actionable steps)
    if ((category === "travel" || context.intent === "guide" || category === "home-lifestyle") && byType.procedural?.length > 0) {
      sections.push({
        type: "checklist",
        heading: "Practical Checklist",
        content: [],
        order: 17,
        required: false,
      });
    }

    // Category-specific: Safety Warning (health category)
    if (category === "health" && byType.warning?.length > 0) {
      sections.push({
        type: "safety-warning",
        heading: "Safety Considerations",
        content: [],
        order: 18,
        required: false,
      });
    }

    // Category-specific: Risk Analysis (finance category)
    if (category === "finance" && byType.warning?.length > 0) {
      sections.push({
        type: "risk-analysis",
        heading: "Risk Analysis",
        content: [],
        order: 18,
        required: false,
      });
    }

    // Category-specific: Code Example (technology category)
    if (category === "technology" && byType.procedural?.length > 0) {
      sections.push({
        type: "code-example",
        heading: "Code Example",
        content: [],
        order: 18,
        required: false,
      });
    }

    // 18. Summary (key takeaways)
    sections.push({
      type: "summary",
      heading: "Key Takeaways",
      content: [],
      order: 18,
      required: true,
    });

    // 19. Continue Learning (next steps)
    sections.push({
      type: "continue-learning",
      heading: "Continue Learning",
      content: [],
      order: 19,
      required: false,
    });

    return sections;
  }

  /**
   * Generate engaging opening hook for introduction
   */
  private generateOpeningHook(subject: string, category: string, intent: string): string {
    const hooks: Record<string, string[]> = {
      technology: [
        `In today's rapidly evolving tech landscape, ${subject} has become an essential skill.`,
        `Whether you're building your first project or scaling a system, ${subject} plays a crucial role.`,
        `Modern development relies heavily on ${subject} - here's what you need to know.`,
      ],
      finance: [
        `Making smart financial decisions starts with understanding ${subject}.`,
        `Your financial future depends on mastering concepts like ${subject}.`,
        `In the world of personal finance, ${subject} is a cornerstone of success.`,
      ],
      health: [
        `Your wellbeing depends on understanding ${subject}.`,
        `Making informed health choices starts with ${subject}.`,
        `${subject} is fundamental to maintaining a healthy lifestyle.`,
      ],
      travel: [
        `Great travel experiences begin with ${subject}.`,
        `Planning your trip? ${subject} is essential to know.`,
        `Smart travelers understand the importance of ${subject}.`,
      ],
      business: [
        `Business success often hinges on ${subject}.`,
        `In competitive markets, ${subject} gives you an edge.`,
        `Strategic thinking requires mastering ${subject}.`,
      ],
      education: [
        `Effective learning starts with ${subject}.`,
        `Academic success builds on foundations like ${subject}.`,
        `${subject} is key to developing strong study habits.`,
      ],
      "home-lifestyle": [
        `Everyday life is better when you understand ${subject}.`,
        `Practical living requires knowledge of ${subject}.`,
        `${subject} simplifies daily routines and decisions.`,
      ],
    };

    const categoryHooks = hooks[category] || [`Understanding ${subject} is important.`];
    return categoryHooks[Math.floor(Math.random() * categoryHooks.length)];
  }

  /**
   * Generate section heading based on type, subject, and category
   */
  private generateSectionHeading(sectionType: string, subject: string, category: string): string {
    const headings: Record<string, string> = {
      "core-concept": `Understanding ${subject}`,
      "comparison-table": `Comparing ${subject} Options`,
      "pros-cons": `${subject}: Pros and Cons`,
      "mistakes": `Common ${subject} Mistakes`,
      "best-practices": `${subject} Best Practices`,
      "expert-insight": `Expert Insight on ${subject}`,
      "framework-box": `${subject} Framework`,
      "faq": `${subject} FAQs`,
      "checklist": `${subject} Checklist`,
      "timeline": `${subject} Timeline`,
    };

    return headings[sectionType] || sectionType.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }

  /**
   * Generate motivation paragraph tailored to category and intent
   */
  private generateMotivationParagraph(subject: string, category: string, intent: string): string {
    const motivations: Record<string, string[]> = {
      technology: [
        `By mastering ${subject}, you'll be equipped to tackle real-world development challenges and build more robust solutions.`,
        `Learning ${subject} will help you write cleaner code, debug faster, and create more scalable applications.`,
      ],
      finance: [
        `Understanding ${subject} will help you make informed decisions, avoid common pitfalls, and build long-term wealth.`,
        `With ${subject} as part of your financial toolkit, you'll be better prepared to navigate market changes and achieve your goals.`,
      ],
      health: [
        `Applying this knowledge about ${subject} will help you make better choices for your wellbeing and prevent common health issues.`,
        `Understanding ${subject} empowers you to take control of your health and make informed decisions with confidence.`,
      ],
      travel: [
        `With ${subject} in your travel toolkit, you'll be able to plan smoother trips and avoid common travel headaches.`,
        `Mastering ${subject} will help you get more value from your travel experiences and create lasting memories.`,
      ],
      business: [
        `Implementing ${subject} in your business strategy can lead to better decision-making and improved outcomes.`,
        `By leveraging ${subject}, you'll gain a competitive advantage and drive sustainable growth.`,
      ],
      education: [
        `Mastering ${subject} will enhance your learning efficiency and help you achieve your academic goals.`,
        `With ${subject} as a foundation, you'll be better prepared for advanced topics and real-world applications.`,
      ],
      "home-lifestyle": [
        `Applying ${subject} in your daily life will simplify routines and improve your overall quality of life.`,
        `Understanding ${subject} helps you make smarter choices and avoid common household mistakes.`,
      ],
    };

    const categoryMotivations = motivations[category] || [`Understanding ${subject} will help you in many situations.`];
    return categoryMotivations[Math.floor(Math.random() * categoryMotivations.length)];
  }

  /**
   * Generate engaging introduction heading based on category and intent
   */
  private generateEngagingIntroHeading(subject: string, category: string, intent: string): string {
    const categoryHooks: Record<string, string[]> = {
      technology: [
        `${subject}: A Complete Guide`,
        `Understanding ${subject} in Modern Development`,
        `Why ${subject} Matters for Every Developer`,
      ],
      finance: [
        `${subject}: Essential Knowledge for Smart Decisions`,
        `Mastering ${subject} for Financial Success`,
        `Why ${subject} is Critical for Your Financial Future`,
      ],
      health: [
        `${subject}: What You Need to Know`,
        `Understanding ${subject} for Better Health`,
        `The Truth About ${subject}`,
      ],
      travel: [
        `${subject}: Your Complete Planning Guide`,
        `How to Make the Most of ${subject}`,
        `${subject}: Essential Tips for Travelers`,
      ],
      business: [
        `${subject}: A Strategic Framework`,
        `Why ${subject} Drives Business Success`,
        `Mastering ${subject} for Competitive Advantage`,
      ],
      education: [
        `${subject}: A Learner's Guide`,
        `Understanding ${subject} for Academic Success`,
        `Why ${subject} is Fundamental to Learning`,
      ],
      "home-lifestyle": [
        `${subject}: Practical Guide for Everyday Life`,
        `Making ${subject} Work for You`,
        `Why ${subject} Matters at Home`,
      ],
    };

    const intentModifiers: Record<string, string[]> = {
      educate: [
        "A Comprehensive Overview",
        "From Basics to Mastery",
        "Everything You Need to Know",
      ],
      guide: [
        "A Step-by-Step Guide",
        "Practical Implementation",
        "Actionable Insights",
      ],
      decide: [
        "Making the Right Choice",
        "A Decision Framework",
        "What You Need to Decide",
      ],
      inform: [
        "Key Insights",
        "Essential Understanding",
        "Core Concepts",
      ],
    };

    const categoryOptions = categoryHooks[category] || [`Understanding ${subject}`];
    const intentOptions = intentModifiers[intent] || [];

    // Combine category hook with intent modifier for more engaging headings
    if (intentOptions.length > 0 && Math.random() > 0.5) {
      const intentHook = intentOptions[Math.floor(Math.random() * intentOptions.length)];
      return `${subject}: ${intentHook}`;
    }

    return categoryOptions[Math.floor(Math.random() * categoryOptions.length)];
  }

  /**
   * Get category-specific component emphasis
   */
  private getCategoryEmphasis(category: string): string[] {
    const emphasis: Record<string, string[]> = {
      technology: ["comparison-table", "framework-box", "pro-tip", "code-example"],
      business: ["pros-cons", "comparison-table", "expert-insight", "case-study"],
      travel: ["timeline", "checklist", "did-you-know", "budget-summary"],
      finance: ["pros-cons", "comparison-table", "expert-insight", "risk-analysis"],
      health: ["pros-cons", "common-mistake", "remember-this", "safety-warning"],
      "home-lifestyle": ["checklist", "pro-tip", "comparison-table", "buying-guide"],
      education: ["framework-box", "timeline", "did-you-know", "learning-path"],
    };

    return emphasis[category] || [];
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

    // Add header metadata nodes at the beginning
    tree.push({
      type: "metadata",
      key: "reading-time",
      value: this.estimateReadingTime(context.facts).toString(),
    });

    tree.push({
      type: "metadata",
      key: "difficulty",
      value: context.complexity,
    });

    tree.push({
      type: "metadata",
      key: "category",
      value: context.config.category,
    });

    tree.push({
      type: "metadata",
      key: "updated-date",
      value: new Date().toISOString(),
    });

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

    // Add footer component nodes at the end
    tree.push({
      type: "metadata",
      key: "footer-continue-learning",
      value: "Continue Learning",
    });

    tree.push({
      type: "metadata",
      key: "footer-explore-category",
      value: context.config.category,
    });

    tree.push({
      type: "metadata",
      key: "footer-knowledge-graph",
      value: "Knowledge Graph",
    });

    tree.push({
      type: "metadata",
      key: "footer-related-topics",
      value: "Related Topics",
    });

    tree.push({
      type: "metadata",
      key: "footer-readers-also-read",
      value: "Readers Also Read",
    });

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
      "hero-summary": ["definition"],
      "introduction": ["definition"],
      "quick-answer": ["definition"],
      "learning-objectives": ["definition", "procedural"],
      "importance": ["definition", "property"],
      "core-concept": ["definition"],
      "how-it-works": ["procedural", "causal"],
      "example": ["property"],
      "applications": ["procedural"],
      "benefits": ["property"],
      "comparison-table": ["comparison"],
      "pros-cons": ["property", "warning"],
      "mistakes": ["warning", "rule"],
      "best-practices": ["rule"],
      "pro-tip": ["rule", "procedural"],
      "expert-insight": ["definition", "historical"],
      "framework-box": ["definition"],
      "faq": ["definition", "procedural", "rule"],
      "checklist": ["procedural"],
      "timeline": ["historical"],
      "remember-this": ["definition"],
      "history": ["historical"],
      "related": [],
      "summary": [],
      "continue-learning": ["definition", "procedural"],
      "decision-box": ["comparison", "definition"],
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

    // Phase 19: Remove section intro transitions to reduce word count
    // const sectionIntro = this.transitionGenerator.generateSectionIntro(sectionType, context);
    // if (sectionIntro) {
    //   nodes.push({ type: "paragraph", children: [sectionIntro] });
    // }

    // Render facts based on section type with better explanations
    switch (sectionType) {
      case "learning-objectives":
        nodes.push(...this.renderLearningObjectives(facts, context));
        break;
      case "importance":
        nodes.push(...this.renderImportance(facts, context));
        break;
      case "pro-tip":
        nodes.push(...this.renderProTip(facts, context));
        break;
      case "expert-insight":
        nodes.push(...this.renderExpertInsight(facts, context));
        break;
      case "remember-this":
        nodes.push(...this.renderRememberThis(facts, context));
        break;
      case "comparison-table":
        nodes.push(...this.renderComparisonTable(facts, context));
        break;
      case "pros-cons":
        nodes.push(...this.renderProsCons(facts, context));
        break;
      case "checklist":
        nodes.push(...this.renderChecklist(facts, context));
        break;
      case "timeline":
        nodes.push(...this.renderTimeline(facts, context));
        break;
      case "framework-box":
        nodes.push(...this.renderFrameworkBox(facts, context));
        break;
      case "faq":
        nodes.push(...this.renderFAQ(facts, context));
        break;
      case "continue-learning":
        nodes.push(...this.renderContinueLearning(facts, context));
        break;
      case "introduction":
      case "core-concept":
        nodes.push(...this.renderDefinitionSection(facts, context, sectionType));
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
  private renderHeroSummary(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    const subject = context.subject;
    const leadFact = facts[0];
    
    if (!leadFact) return nodes;

    // Estimate reading time based on fact count
    const readingTime = Math.max(3, Math.ceil(facts.length / 8));
    
    // Generate hero summary with key information
    nodes.push({
      type: "hero-summary",
      definition: leadFact.statement,
      whyItMatters: `Understanding ${subject} is essential for making informed decisions and solving problems effectively.`,
      difficulty: context.complexity,
      readingTime: `${readingTime} min`,
      audience: this.determineAudience(context),
      learningObjectives: this.extractLearningObjectives(facts),
      prerequisites: this.extractPrerequisites(facts),
    });

    return nodes;
  }

  private determineAudience(context: CompositionContext): string {
    const { complexity, category } = context;
    const audienceMap: Record<string, Record<string, string>> = {
      beginner: {
        technology: "Beginner programmers and students",
        finance: "New investors and curious learners",
        health: "Health-conscious individuals",
        travel: "Travel enthusiasts and planners",
        business: "Aspiring entrepreneurs and professionals",
        education: "Students and lifelong learners",
      },
      intermediate: {
        technology: "Developers with basic programming knowledge",
        finance: "Investors with some experience",
        health: "Individuals with basic health knowledge",
        travel: "Experienced travelers",
        business: "Professionals with business experience",
        education: "Learners with foundational knowledge",
      },
      advanced: {
        technology: "Experienced developers and engineers",
        finance: "Seasoned investors and financial professionals",
        health: "Individuals with advanced health knowledge",
        travel: "Expert travelers and nomads",
        business: "Business leaders and executives",
        education: "Advanced learners and professionals",
      },
    };
    
    return audienceMap[complexity]?.[category] || "Learners interested in this topic";
  }

  private extractLearningObjectives(facts: PluginFact[]): string[] {
    return facts.slice(0, 3).map(f => {
      const statement = f.statement
        .replace(/^(Think of|Think about|Consider|Remember that)\s+/i, "")
        .replace(/\.$/, "");
      return `Understand ${statement.toLowerCase()}`;
    });
  }

  private extractPrerequisites(facts: PluginFact[]): string[] {
    // Extract prerequisites from facts tagged with "prerequisite"
    const prereqFacts = facts.filter(f => f.tags && f.tags.includes("prerequisite"));
    if (prereqFacts.length > 0) {
      return prereqFacts.slice(0, 2).map(f => f.statement);
    }
    return [];
  }

  private renderQuickAnswer(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    const subject = context.subject;
    const leadFact = facts[0];
    
    if (!leadFact) return nodes;

    // Generate quick answer - the shortest correct explanation
    nodes.push({
      type: "quick-answer",
      answer: leadFact.statement,
      context: `In short, ${subject} ${leadFact.statement.toLowerCase()}`,
    });

    return nodes;
  }

  private renderDecisionBox(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    const subject = context.subject;
    const category = context.category;
    
    // Only show decision box for certain intents and categories
    if (context.intent !== "decide" && context.intent !== "guide") {
      return nodes;
    }

    // Generate decision framework based on category
    let question = "";
    let options: { option: string; whenToChoose: string; considerations: string[] }[] = [];

    if (category === "finance" && subject.toLowerCase().includes("invest")) {
      question = "Should I invest now?";
      options = [
        {
          option: "Yes, invest now",
          whenToChoose: "If you have emergency savings, no high-interest debt, and a long time horizon",
          considerations: [
            "Market timing is difficult - time in market is more important",
            "Start with index funds for diversification",
            "Consider dollar-cost averaging to reduce risk",
          ],
        },
        {
          option: "Wait and learn more",
          whenToChoose: "If you're not confident about your understanding or need to build emergency savings first",
          considerations: [
            "Education before action reduces mistakes",
            "Build a 3-6 month emergency fund first",
            "Pay off high-interest debt before investing",
          ],
        },
      ];
    } else if (category === "technology") {
      question = "Should I learn this?";
      options = [
        {
          option: "Yes, learn it",
          whenToChoose: "If it aligns with your career goals or project requirements",
          considerations: [
            "Practical application reinforces learning",
            "Build small projects to practice",
            "Join a community for support",
          ],
        },
        {
          option: "Start with basics first",
          whenToChoose: "If you're new to the field or lack foundational knowledge",
          considerations: [
            "Strong fundamentals make advanced topics easier",
            "Don't rush - understanding beats memorization",
            "Focus on concepts before syntax",
          ],
        },
      ];
    } else {
      // Generic decision framework
      question = `How should I approach ${subject}?`;
      options = [
        {
          option: "Start with fundamentals",
          whenToChoose: "If you're new to this topic",
          considerations: [
            "Build a strong foundation first",
            "Understand core concepts before diving deep",
            "Practice with simple examples",
          ],
        },
        {
          option: "Apply directly",
          whenToChoose: "If you have some experience and want to solve a specific problem",
          considerations: [
            "Learn by doing - practical application cements knowledge",
            "Focus on what you need for your current situation",
            "Reference as you go",
          ],
        },
      ];
    }

    nodes.push({
      type: "decision-box",
      question,
      options,
    });

    return nodes;
  }

  private renderLearningObjectives(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    const subject = context.subject;
    
    // Generate learning objectives from facts
    const objectives = facts.slice(0, 4).map(f => {
      // Convert fact statements into learning objectives
      const statement = f.statement
        .replace(/^(Think of|Think about|Consider|Remember that)\s+/i, "")
        .replace(/\.$/, "");
      return `Understand ${statement.toLowerCase()}`;
    });
    
    if (objectives.length > 0) {
      nodes.push({
        type: "list",
        ordered: true,
        items: objectives.map(obj => ({
          type: "list-item",
          children: [obj],
        })),
      });
    }

    return nodes;
  }

  private renderImportance(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    const subject = context.subject;
    
    nodes.push({
      type: "paragraph",
      children: [`Understanding ${subject} is essential because it forms the foundation for more advanced learning and practical application.`],
    });
    
    // Add importance facts
    for (const fact of facts.slice(0, 3)) {
      nodes.push({
        type: "paragraph",
        children: [fact.statement],
      });
    }

    return nodes;
  }

  private renderFAQ(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    
    // Create FAQ items from facts that are tagged with 'faq'
    const faqFacts = facts.filter(f => f.tags && f.tags.includes("faq")).slice(0, 4);
    
    for (const fact of faqFacts) {
      // Extract question from statement (first sentence or up to question mark)
      const statement = fact.statement;
      const questionEnd = statement.indexOf("?") + 1 || statement.indexOf(".");
      const question = statement.substring(0, questionEnd) || statement;
      const answer = statement.substring(questionEnd).trim() || statement;
      
      nodes.push({
        type: "callout",
        variant: "info",
        title: question,
        children: [{ type: "paragraph", children: [answer] }],
      });
    }

    return nodes;
  }

  private renderContinueLearning(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];

    // Extract continue learning facts
    const learningFacts = facts.filter(f => f.tags && f.tags.includes("continue-learning")).slice(0, 4);

    // Generate intelligent learning progression based on category and complexity
    const progression = this.generateLearningProgression(context.subject, context.category, context.complexity);

    if (progression.length > 0) {
      nodes.push({
        type: "paragraph",
        children: ["To continue your learning journey, explore these next steps:"],
      });

      nodes.push({
        type: "list",
        ordered: true,
        items: progression.map(step => ({
          type: "list-item",
          children: [step],
        })),
      });
    }

    return nodes;
  }

  /**
   * Generate intelligent learning progression based on category and complexity
   */
  private generateLearningProgression(subject: string, category: string, complexity: string): string[] {
    const progressions: Record<string, Record<string, string[]>> = {
      technology: {
        beginner: [
          `Practice ${subject} with small projects to reinforce your understanding`,
          `Learn related concepts that build on ${subject}`,
          `Explore real-world applications of ${subject} in modern development`,
        ],
        intermediate: [
          `Apply ${subject} in more complex scenarios and projects`,
          `Learn advanced techniques and patterns related to ${subject}`,
          `Contribute to open-source projects using ${subject}`,
        ],
        advanced: [
          `Optimize ${subject} for performance and scalability`,
          `Teach ${subject} to others to deepen your mastery`,
          `Stay updated with latest developments in ${subject}`,
        ],
      },
      finance: {
        beginner: [
          `Apply ${subject} to create a personal financial plan`,
          `Learn basic investment strategies that complement ${subject}`,
          `Track your progress with ${subject} using practical tools`,
        ],
        intermediate: [
          `Diversify your approach to ${subject} for better risk management`,
          `Analyze case studies of ${subject} in different market conditions`,
          `Integrate ${subject} with advanced financial planning techniques`,
        ],
        advanced: [
          `Use ${subject} for complex wealth management and tax optimization`,
          `Evaluate alternative approaches to ${subject} for specific goals`,
          `Stay informed about regulatory changes affecting ${subject}`,
        ],
      },
      health: {
        beginner: [
          `Incorporate ${subject} into your daily routine with simple habits`,
          `Track your progress with ${subject} using measurable indicators`,
          `Learn about complementary practices that enhance ${subject}`,
        ],
        intermediate: [
          `Customize ${subject} based on your specific needs and goals`,
          `Understand the scientific evidence behind ${subject}`,
          `Consult healthcare professionals to optimize your approach to ${subject}`,
        ],
        advanced: [
          `Teach others about ${subject} to reinforce your own understanding`,
          `Stay updated with latest research on ${subject}`,
          `Integrate ${subject} into a comprehensive wellness strategy`,
        ],
      },
      travel: {
        beginner: [
          `Plan your first trip using ${subject} as a guide`,
          `Learn basic travel skills that complement ${subject}`,
          `Start with short trips to practice ${subject}`,
        ],
        intermediate: [
          `Apply ${subject} to more complex travel itineraries`,
          `Optimize your travel budget using ${subject}`,
          `Share your ${subject} experiences with other travelers`,
        ],
        advanced: [
          `Use ${subject} for long-term travel planning`,
          `Teach ${subject} to aspiring travelers`,
          `Combine ${subject} with advanced travel hacking techniques`,
        ],
      },
      business: {
        beginner: [
          `Apply ${subject} to improve your current work processes`,
          `Learn foundational business concepts that support ${subject}`,
          `Practice ${subject} with small-scale projects`,
        ],
        intermediate: [
          `Scale ${subject} across your organization`,
          `Measure the impact of ${subject} on business outcomes`,
          `Integrate ${subject} with other business frameworks`,
        ],
        advanced: [
          `Innovate on ${subject} for competitive advantage`,
          `Teach ${subject} to teams and stakeholders`,
          `Stay updated with industry best practices for ${subject}`,
        ],
      },
      education: {
        beginner: [
          `Apply ${subject} to your current studies or learning goals`,
          `Practice ${subject} with exercises and quizzes`,
          `Connect ${subject} to other subjects you're learning`,
        ],
        intermediate: [
          `Use ${subject} to tackle more complex academic challenges`,
          `Teach ${subject} to peers to reinforce your understanding`,
          `Apply ${subject} in real-world problem-solving scenarios`,
        ],
        advanced: [
          `Conduct research or projects related to ${subject}`,
          `Mentor others in ${subject}`,
          `Stay current with academic developments in ${subject}`,
        ],
      },
      "home-lifestyle": {
        beginner: [
          `Implement ${subject} in your daily routine with simple steps`,
          `Track your progress with ${subject}`,
          `Learn complementary skills that enhance ${subject}`,
        ],
        intermediate: [
          `Customize ${subject} for your specific home situation`,
          `Teach family members about ${subject}`,
          `Optimize ${subject} for efficiency and cost savings`,
        ],
        advanced: [
          `Innovate on ${subject} for your unique needs`,
          `Share your ${subject} expertise with your community`,
          `Stay updated with best practices and trends in ${subject}`,
        ],
      },
    };

    return progressions[category]?.[complexity] || [
      `Continue practicing ${subject} to build mastery`,
      `Apply ${subject} in new contexts`,
      `Learn related topics that build on ${subject}`,
    ];
  }

  private renderQuickSummary(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    const subject = context.subject;
    
    // Take top 3-5 definition facts for quick summary
    const summaryFacts = facts.slice(0, 5);
    
    nodes.push({
      type: "quick-summary",
      content: [
        `${subject} is ${summaryFacts[0]?.statement.toLowerCase() || "an important concept"}.`,
        ...summaryFacts.slice(1).map(f => f.statement),
      ],
    });

    return nodes;
  }

  private renderProTip(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    
    // Take the first rule or procedural fact as a pro tip
    const tipFact = facts[0];
    if (!tipFact) return nodes;
    
    nodes.push({
      type: "pro-tip",
      content: tipFact.statement,
      context: `When working with ${context.subject}, keep this in mind.`,
    });

    return nodes;
  }

  private renderDidYouKnow(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    
    // Take the first historical or property fact
    const fact = facts[0];
    if (!fact) return nodes;
    
    nodes.push({
      type: "did-you-know",
      fact: fact.statement,
    });

    return nodes;
  }

  private renderExpertInsight(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    
    // Take the first definition or historical fact as expert insight
    const fact = facts[0];
    if (!fact) return nodes;
    
    nodes.push({
      type: "expert-insight",
      insight: fact.statement,
      source: "Valendiro Editorial Team",
    });

    return nodes;
  }

  private renderRememberThis(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    
    // Take the most important definition fact
    const fact = facts[0];
    if (!fact) return nodes;
    
    nodes.push({
      type: "remember-this",
      point: fact.statement,
    });

    return nodes;
  }

  private renderComparisonTable(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    
    // Group comparison facts into a table structure
    // For now, create a simple table from comparison facts
    const items = facts.slice(0, 5).map(f => ({
      name: context.subject,
      values: [f.statement],
    }));
    
    nodes.push({
      type: "comparison-table",
      headers: ["Feature", "Description"],
      items,
    });

    return nodes;
  }

  private renderProsCons(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    
    // Split facts into pros (property) and cons (warning)
    const pros = facts.filter(f => f.factType === "property").slice(0, 3).map(f => f.statement);
    const cons = facts.filter(f => f.factType === "warning").slice(0, 3).map(f => f.statement);
    
    nodes.push({
      type: "pros-cons",
      pros,
      cons,
    });

    return nodes;
  }

  private renderChecklist(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    
    // Create checklist from procedural facts
    const items = facts.slice(0, 8).map(f => ({
      text: f.statement,
      checked: false,
    }));
    
    nodes.push({
      type: "checklist",
      items,
    });

    return nodes;
  }

  private renderTimeline(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    
    // Create timeline from historical facts
    const events = facts.slice(0, 5).map((f, i) => ({
      title: `Event ${i + 1}`,
      description: f.statement,
      date: undefined,
    }));
    
    nodes.push({
      type: "timeline",
      events,
    });

    return nodes;
  }

  private renderFrameworkBox(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    
    // Create framework from definition facts
    const components = facts.slice(0, 5).map(f => f.statement);
    
    nodes.push({
      type: "framework-box",
      title: `Key Framework: ${context.subject}`,
      components,
      description: `The core components of ${context.subject} that you need to understand.`,
    });

    return nodes;
  }

  private renderDefinitionSection(
    facts: PluginFact[],
    context: CompositionContext,
    sectionType: string = "core-concept"
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    const subject = context.subject;
    const leadFact = facts[0];
    
    if (!leadFact) return nodes;

    if (sectionType === "introduction") {
      // Introduction section: Single hook + definition, no walls of text
      const openingHook = this.generateOpeningHook(subject, context.category, context.intent);
      nodes.push({
        type: "paragraph",
        children: [openingHook],
      });

      nodes.push({
        type: "paragraph",
        children: [leadFact.statement],
      });

      // No additional paragraphs - keep it scannable
    } else {
      // Core Concept section: Convert to bullet points for scanability
      nodes.push({
        type: "list",
        ordered: true,
        items: facts.slice(0, 5).map(f => ({
          type: "list-item",
          children: [f.statement],
        })),
      });
    }

    return nodes;
  }

  private renderProceduralSection(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];

    const compressedFacts = this.removeRedundantFacts(facts);

    // Always use numbered steps - more scannable
    nodes.push({
      type: "list",
      ordered: true,
      items: compressedFacts.slice(0, 7).map(f => ({
        type: "list-item",
        children: [this.removeFillerTransitions(f.statement)],
      })),
    });

    return nodes;
  }

  private renderPropertySection(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];

    const compressedFacts = this.removeRedundantFacts(facts);

    // Always use bullet points for scanability
    nodes.push({
      type: "list",
      ordered: false,
      items: compressedFacts.slice(0, 7).map(f => ({
        type: "list-item",
        children: [this.removeFillerTransitions(f.statement)],
      })),
    });

    return nodes;
  }

  private renderWarningSection(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];

    const compressedFacts = this.removeRedundantFacts(facts);

    // Always use bullet points for scanability
    nodes.push({
      type: "list",
      ordered: false,
      items: compressedFacts.slice(0, 5).map(f => ({
        type: "list-item",
        children: [this.removeFillerTransitions(f.statement)],
      })),
    });

    return nodes;
  }

  private renderRuleSection(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];

    const compressedFacts = this.removeRedundantFacts(facts);

    // Always use bullet points for scanability
    nodes.push({
      type: "list",
      ordered: false,
      items: compressedFacts.slice(0, 7).map(f => ({
        type: "list-item",
        children: [this.removeFillerTransitions(f.statement)],
      })),
    });

    return nodes;
  }

  private renderHistoricalSection(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];

    const compressedFacts = this.removeRedundantFacts(facts);

    // Always use bullet points for scanability
    nodes.push({
      type: "list",
      ordered: false,
      items: compressedFacts.slice(0, 5).map(f => ({
        type: "list-item",
        children: [this.removeFillerTransitions(f.statement)],
      })),
    });

    return nodes;
  }

  private renderSummarySection(
    facts: PluginFact[],
    context: CompositionContext
  ): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    const subject = context.subject;

    // Quick summary as bullet points - no paragraphs
    const keyPoints = facts.slice(0, 5).map(f => f.statement);

    nodes.push({
      type: "list",
      ordered: true,
      items: keyPoints.map(point => ({
        type: "list-item",
        children: [this.removeFillerTransitions(point)],
      })),
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

  private estimateReadingTime(facts: PluginFact[]): number {
    // Estimate reading time based on word count
    // Average reading speed: 200-250 words per minute
    const totalWords = facts.reduce((sum, f) => sum + f.statement.split(/\s+/).length, 0);
    return Math.ceil(totalWords / 200);
  }

  // Compression utilities for Phase 19 - Content Compression & Information Gain
  private compressParagraphs(facts: PluginFact[], context: CompositionContext): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    
    // Group facts by similarity to remove redundancy
    const uniqueFacts = this.removeRedundantFacts(facts);
    
    // Compress long paragraphs into bullets where appropriate
    const compressed = this.compressToStructuredFormat(uniqueFacts, context);
    
    return compressed;
  }

  private removeRedundantFacts(facts: PluginFact[]): PluginFact[] {
    const seen = new Set<string>();
    const unique: PluginFact[] = [];
    
    for (const fact of facts) {
      // Normalize for comparison
      const normalized = fact.statement
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/g, '')
        .trim();
      
      // Skip if very similar to already seen
      let isRedundant = false;
      for (const seenKey of seen) {
        if (this.calculateSimilarity(normalized, seenKey) > 0.8) {
          isRedundant = true;
          break;
        }
      }
      
      if (!isRedundant) {
        seen.add(normalized);
        unique.push(fact);
      }
    }
    
    return unique;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    const intersection = words1.filter(w => words2.includes(w));
    const union = [...new Set([...words1, ...words2])];
    return intersection.length / union.length;
  }

  private compressToStructuredFormat(facts: PluginFact[], context: CompositionContext): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    
    // Phase 19: Lower threshold to 2+ facts for more aggressive compression
    if (facts.length >= 2) {
      nodes.push({
        type: "list",
        ordered: false,
        items: facts.map(f => ({
          type: "list-item",
          children: [f.statement.replace(/^(Additionally|Furthermore|Moreover|Also|In addition),?\s*/i, '')],
        })),
      });
    } else {
      // For single facts, keep as paragraphs
      for (const fact of facts) {
        nodes.push({
          type: "paragraph",
          children: [fact.statement],
        });
      }
    }
    
    return nodes;
  }

  private removeFillerTransitions(text: string): string {
    return text
      .replace(/^(Additionally|Furthermore|Moreover|Also|In addition|What's more|Plus),?\s*/gi, '')
      .replace(/^(In conclusion|To summarize|Overall|All in all|In summary),?\s*/gi, '')
      .replace(/^(It is important to note that|It's worth noting that|It should be mentioned that),?\s*/gi, '')
      .replace(/^(As mentioned earlier|As previously stated|As we discussed),?\s*/gi, '')
      .trim();
  }
}
