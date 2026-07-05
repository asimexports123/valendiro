/**
 * Narrative Planning Engine (Stage 4)
 *
 * Decides the learning journey BEFORE writing.
 *
 * Decisions:
 * - What should the reader learn first?
 * - What should come second?
 * - What should be omitted?
 * - What deserves emphasis?
 * - Where should examples appear?
 * - Where should comparisons appear?
 * - Where should visual components appear?
 * - How deep should each section go based on reader level?
 *
 * This planning must happen before writing begins.
 */

import type { PluginFact } from "../types";
import { ReaderPsychologyEngine, type ReaderQuestion } from "./readerPsychologyEngine";

export interface NarrativePlanningContext {
  topic: string;
  subject: string;
  category: string;
  intent: "inform" | "educate" | "guide" | "decide";
  complexity: "beginner" | "intermediate" | "advanced";
  facts: PluginFact[];
  readerQuestions: ReaderQuestion[];
}

export interface NarrativeSection {
  type: string;
  heading: string;
  order: number;
  emphasis: "high" | "medium" | "low";
  depth: "introductory" | "intermediate" | "deep";
  includeExample: boolean;
  includeComparison: boolean;
  includeVisual: boolean;
  visualType: "comparison-table" | "checklist" | "timeline" | "framework" | "process-flow" | "code-block" | "calculation" | "decision-tree" | null;
  readerQuestions: ReaderQuestion[];
  factsToInclude: PluginFact[];
  factsToOmit: PluginFact[];
}

export interface NarrativePlan {
  sections: NarrativeSection[];
  omittedFacts: PluginFact[];
  emphasisPoints: string[];
  learningJourney: string[];
}

export interface SubjectValidationRules {
  mandatorySections: string[];
  forbiddenSections: string[];
  requireExamples: boolean;
  requireTables: boolean;
  requireCodeBlocks: boolean;
  requireFormulas: boolean;
  requireSafetyWarnings: boolean;
  requireChecklists: boolean;
  requireFAQs: boolean;
  requireComparisons: boolean;
  requireInternalLinks: boolean;
}

export interface ValidationResult {
  passes: boolean;
  violations: string[];
}

export class NarrativePlanningEngine {
  private readerPsychology: ReaderPsychologyEngine | null = null;

  // Subject-specific validation rules
  private subjectValidationRules: Record<string, SubjectValidationRules> = {
    "python-programming-fundamentals": {
      mandatorySections: ["syntax-basics", "data-types", "control-flow", "functions", "code-example"],
      forbiddenSections: [],
      requireExamples: true,
      requireTables: false,
      requireCodeBlocks: true,
      requireFormulas: false,
      requireSafetyWarnings: false,
      requireChecklists: false,
      requireFAQs: false,
      requireComparisons: false,
      requireInternalLinks: false,
    },
    "git-version-control": {
      mandatorySections: ["installation", "basic-commands", "branching", "merging", "remote-workflow"],
      forbiddenSections: [],
      requireExamples: true,
      requireTables: false,
      requireCodeBlocks: true,
      requireFormulas: false,
      requireSafetyWarnings: false,
      requireChecklists: true,
      requireFAQs: false,
      requireComparisons: false,
      requireInternalLinks: false,
    },
    "investing-basics": {
      mandatorySections: ["investment-types", "risk-return", "asset-allocation", "diversification"],
      forbiddenSections: [],
      requireExamples: true,
      requireTables: true,
      requireCodeBlocks: false,
      requireFormulas: true,
      requireSafetyWarnings: false,
      requireChecklists: false,
      requireFAQs: true,
      requireComparisons: true,
      requireInternalLinks: false,
    },
    "data-structures": {
      mandatorySections: ["arrays", "linked-lists", "trees", "graphs", "hash-tables", "time-complexity", "space-complexity"],
      forbiddenSections: [],
      requireExamples: true,
      requireTables: true,
      requireCodeBlocks: true,
      requireFormulas: false,
      requireSafetyWarnings: false,
      requireChecklists: false,
      requireFAQs: false,
      requireComparisons: true,
      requireInternalLinks: false,
    },
  };

  constructor() {
    // Lazy initialization
  }

  private getReaderPsychology(): ReaderPsychologyEngine {
    if (!this.readerPsychology) {
      this.readerPsychology = new ReaderPsychologyEngine();
    }
    return this.readerPsychology;
  }

  /**
   * Create the narrative plan for the article
   */
  createNarrativePlan(context: NarrativePlanningContext): NarrativePlan {
    // 1. Generate reader questions
    const readerQuestions = this.getReaderPsychology().generateReaderQuestions(context);
    const questionsToAnswer = this.getReaderPsychology().getQuestionsToAnswer(readerQuestions);

    // 2. Categorize facts by type
    const factsByType = this.categorizeFacts(context.facts);

    // 3. Decide learning order
    const learningJourney = this.decideLearningOrder(context, factsByType);

    // 4. Create sections based on learning journey
    const sections = this.createSections(context, factsByType, questionsToAnswer, learningJourney);

    // 5. Determine emphasis points
    const emphasisPoints = this.determineEmphasisPoints(context, factsByType, questionsToAnswer);

    // 6. Identify facts to omit
    const omittedFacts = this.identifyFactsToOmit(context, factsByType, sections);

    return {
      sections,
      omittedFacts,
      emphasisPoints,
      learningJourney,
    };
  }

  /**
   * Categorize facts by their type
   */
  private categorizeFacts(facts: PluginFact[]): Record<string, PluginFact[]> {
    const byType: Record<string, PluginFact[]> = {};

    for (const fact of facts) {
      const type = fact.factType || "property";
      if (!byType[type]) {
        byType[type] = [];
      }
      byType[type].push(fact);
    }

    return byType;
  }

  /**
   * Decide the learning order for the reader
   */
  private decideLearningOrder(
    context: NarrativePlanningContext,
    factsByType: Record<string, PluginFact[]>
  ): string[] {
    const journey: string[] = [];

    // Subject-specific learning journeys (highest priority)
    const subjectJourneys: Record<string, string[]> = {
      // Technology subjects
      "python-programming-fundamentals": [
        "definition", "why-it-matters", "getting-started", "syntax-basics", "data-types", 
        "control-flow", "functions", "modules-packages", "common-libraries", "code-example",
        "best-practices", "common-mistakes", "resources", "summary"
      ],
      "git-version-control": [
        "definition", "why-it-matters", "installation", "basic-commands", "branching", 
        "merging", "remote-workflow", "common-workflows", "best-practices", "common-mistakes", "resources", "summary"
      ],
      "docker-containers": [
        "definition", "why-it-matters", "installation", "dockerfile-basics", "docker-compose",
        "images", "volumes", "networks", "best-practices", "common-mistakes", "resources", "summary"
      ],
      "data-structures": [
        "definition", "why-it-matters", "arrays", "linked-lists", "stacks-queues", 
        "trees", "graphs", "hash-tables", "time-complexity", "space-complexity", 
        "code-example", "best-practices", "common-mistakes", "summary"
      ],
      "javascript-fundamentals": [
        "definition", "why-it-matters", "getting-started", "syntax-basics", "variables-types",
        "functions", "dom-manipulation", "es6-features", "common-patterns", "code-example",
        "best-practices", "common-mistakes", "resources", "summary"
      ],
      // Finance subjects
      "investing-basics": [
        "definition", "why-it-matters", "investment-types", "risk-return", "getting-started",
        "asset-allocation", "diversification", "investment-accounts", "tax-implications",
        "expert-advice", "common-mistakes", "best-practices", "summary"
      ],
      "stock-market-fundamentals": [
        "definition", "why-it-matters", "market-basics", "stock-types", "order-types",
        "analysis-methods", "risk-management", "tax-implications", "expert-advice",
        "common-mistakes", "best-practices", "resources", "summary"
      ],
      "etf-fundamentals": [
        "definition", "why-it-matters", "etf-structure", "types-of-etfs", "expense-ratios",
        "selection-criteria", "tax-efficiency", "portfolio-allocation", "expert-advice",
        "common-mistakes", "best-practices", "resources", "summary"
      ],
      // Health subjects
      "diabetes": [
        "definition", "why-it-matters", "types-symptoms", "diagnosis", "blood-sugar-management",
        "diet-exercise", "medications", "complications", "warning-signs", "expert-recommendations",
        "when-to-seek-help", "best-practices", "summary"
      ],
      "nutrition-fundamentals": [
        "definition", "why-it-matters", "macronutrients", "micronutrients", "dietary-guidelines",
        "meal-planning", "supplements", "special-diets", "expert-recommendations", "common-mistakes",
        "best-practices", "resources", "summary"
      ],
      // Travel subjects
      "travel-planning-fundamentals": [
        "overview", "booking-strategy", "itinerary-planning", "budgeting", "packing", 
        "documents", "safety", "common-mistakes", "tips", "resources", "summary"
      ],
      "budget-travel": [
        "definition", "why-it-matters", "destinations", "cost-saving-strategies", "accommodation",
        "transport", "food", "timing", "common-mistakes", "tips", "resources", "summary"
      ],
      // Lifestyle subjects
      "home-organization-fundamentals": [
        "definition", "why-it-matters", "decluttering", "storage-solutions", "room-by-room-guide",
        "systems", "maintenance", "tools", "time-estimates", "common-mistakes", "tips", "summary"
      ],
    };

    // Check if subject has specific journey
    if (context.subject && subjectJourneys[context.subject]) {
      return subjectJourneys[context.subject];
    }

    // Base order that applies to most topics
    const baseOrder = [
      "definition",
      "importance",
      "core-concept",
      "how-it-works",
      "example",
      "applications",
      "benefits",
      "comparison",
      "limitations",
      "mistakes",
      "best-practices",
      "summary",
    ];

    // Adjust based on category (fallback if no subject-specific journey)
    if (context.category === "technology") {
      journey.push(
        "definition",
        "why-it-matters",
        "getting-started",
        "core-concepts",
        "how-it-works",
        "code-example",
        "common-use-cases",
        "best-practices",
        "common-mistakes",
        "resources",
        "summary"
      );
    } else if (context.category === "travel") {
      journey.push(
        "overview",
        "planning",
        "budget",
        "timing",
        "preparation",
        "what-to-expect",
        "common-mistakes",
        "tips",
        "summary"
      );
    } else if (context.category === "finance") {
      journey.push(
        "definition",
        "why-it-matters",
        "how-it-works",
        "benefits",
        "risks",
        "comparison",
        "tax-implications",
        "expert-advice",
        "common-mistakes",
        "summary"
      );
    } else if (context.category === "business") {
      journey.push(
        "definition",
        "business-case",
        "how-it-works",
        "roi",
        "risks",
        "implementation",
        "common-failures",
        "best-practices",
        "decision-framework",
        "summary"
      );
    } else if (context.category === "health") {
      journey.push(
        "definition",
        "importance",
        "how-it-works",
        "benefits",
        "risks-side-effects",
        "when-to-use",
        "warning-signs",
        "expert-recommendations",
        "summary"
      );
    } else {
      journey.push(...baseOrder);
    }

    // Adjust based on intent
    if (context.intent === "guide") {
      // Guides should be more action-oriented
      const guideOrder = journey.filter(s => s !== "definition" && s !== "importance");
      journey.splice(0, journey.length, ...guideOrder);
      journey.unshift("quick-start");
    } else if (context.intent === "decide") {
      // Decision-focused should emphasize comparison and risks
      const comparisonIndex = journey.indexOf("comparison");
      if (comparisonIndex > 0) {
        journey.splice(comparisonIndex, 1);
        journey.splice(3, 0, "comparison");
      }
      const risksIndex = journey.indexOf("risks") || journey.indexOf("limitations");
      if (risksIndex > 0) {
        journey.splice(risksIndex, 1);
        journey.splice(4, 0, "risks");
      }
    }

    return journey;
  }

  /**
   * Create sections based on learning journey
   */
  private createSections(
    context: NarrativePlanningContext,
    factsByType: Record<string, PluginFact[]>,
    questionsToAnswer: ReaderQuestion[],
    learningJourney: string[]
  ): NarrativeSection[] {
    const sections: NarrativeSection[] = [];

    for (let i = 0; i < learningJourney.length; i++) {
      const sectionType = learningJourney[i];
      const section = this.createSection(
        context,
        sectionType,
        i,
        factsByType,
        questionsToAnswer,
        learningJourney.length
      );

      // Only include sections that have facts allocated to them
      if (section && section.factsToInclude.length > 0) {
        sections.push(section);
      }
    }

    return sections;
  }

  /**
   * Create a single section
   */
  private createSection(
    context: NarrativePlanningContext,
    sectionType: string,
    order: number,
    factsByType: Record<string, PluginFact[]>,
    questionsToAnswer: ReaderQuestion[],
    totalSections: number
  ): NarrativeSection | null {
    const section = this.getSectionMetadata(sectionType, context);
    if (!section) return null;

    // Allocate facts to this section
    const sectionFacts = this.allocateFactsToSection(sectionType, factsByType, context);

    // Allocate relevant reader questions
    const sectionQuestions = this.allocateQuestionsToSection(sectionType, questionsToAnswer);

    // Determine if example should be included
    const includeExample = this.shouldIncludeExample(sectionType, context, sectionFacts);

    // Determine if comparison should be included
    const includeComparison = this.shouldIncludeComparison(sectionType, context, sectionFacts);

    // Determine visual component
    const visualType = this.determineVisualType(sectionType, context, sectionFacts);

    // Determine depth based on complexity and order
    const depth = this.determineSectionDepth(context, order, totalSections);

    return {
      type: sectionType,
      heading: section.heading,
      order,
      emphasis: section.emphasis,
      depth,
      includeExample,
      includeComparison,
      includeVisual: visualType !== null,
      visualType,
      readerQuestions: sectionQuestions,
      factsToInclude: sectionFacts,
      factsToOmit: [],
    };
  }

  /**
   * Get metadata for a section type
   */
  private getSectionMetadata(sectionType: string, context: NarrativePlanningContext): {
    heading: string;
    emphasis: "high" | "medium" | "low";
  } | null {
    const metadata: Record<string, { heading: string; emphasis: "high" | "medium" | "low" }> = {
      "definition": { heading: `What is ${context.topic}?`, emphasis: "high" },
      "importance": { heading: "Why This Matters", emphasis: "high" },
      "core-concept": { heading: "Core Concepts", emphasis: "high" },
      "how-it-works": { heading: "How It Works", emphasis: "high" },
      "example": { heading: "Real-World Example", emphasis: "medium" },
      "applications": { heading: "Practical Applications", emphasis: "medium" },
      "benefits": { heading: "Benefits", emphasis: "medium" },
      "comparison": { heading: "Comparison", emphasis: context.intent === "decide" ? "high" : "medium" },
      "limitations": { heading: "Limitations", emphasis: "medium" },
      "risks": { heading: "Risks", emphasis: "high" },
      "mistakes": { heading: "Common Mistakes", emphasis: "medium" },
      "best-practices": { heading: "Best Practices", emphasis: "medium" },
      "summary": { heading: "Key Takeaways", emphasis: "high" },
      // Technology-specific
      "getting-started": { heading: "Getting Started", emphasis: "high" },
      "code-example": { heading: "Code Example", emphasis: "high" },
      "common-use-cases": { heading: "Common Use Cases", emphasis: "medium" },
      "resources": { heading: "Resources", emphasis: "low" },
      // Travel-specific
      "overview": { heading: "Overview", emphasis: "high" },
      "planning": { heading: "Planning", emphasis: "high" },
      "budget": { heading: "Budget", emphasis: "high" },
      "timing": { heading: "Best Time to Visit", emphasis: "medium" },
      "preparation": { heading: "Preparation", emphasis: "high" },
      "what-to-expect": { heading: "What to Expect", emphasis: "medium" },
      "tips": { heading: "Tips", emphasis: "medium" },
      // Finance-specific
      "tax-implications": { heading: "Tax Implications", emphasis: "medium" },
      "expert-advice": { heading: "Expert Advice", emphasis: "medium" },
      // Business-specific
      "business-case": { heading: "Business Case", emphasis: "high" },
      "roi": { heading: "Return on Investment", emphasis: "high" },
      "implementation": { heading: "Implementation", emphasis: "medium" },
      "common-failures": { heading: "Common Failures", emphasis: "medium" },
      "decision-framework": { heading: "Decision Framework", emphasis: "medium" },
      // Health-specific
      "risks-side-effects": { heading: "Risks and Side Effects", emphasis: "high" },
      "when-to-use": { heading: "When to Use", emphasis: "medium" },
      "warning-signs": { heading: "Warning Signs", emphasis: "high" },
      "expert-recommendations": { heading: "Expert Recommendations", emphasis: "medium" },
      // General
      "quick-start": { heading: "Quick Start", emphasis: "high" },
    };

    return metadata[sectionType] || null;
  }

  /**
   * Allocate facts to a section
   */
  private allocateFactsToSection(
    sectionType: string,
    factsByType: Record<string, PluginFact[]>,
    context: NarrativePlanningContext
  ): PluginFact[] {
    const allocation: Record<string, string[]> = {
      "definition": ["definition"],
      "importance": ["property", "definition"],
      "core-concept": ["definition", "property"],
      "how-it-works": ["procedural", "causal"],
      "example": ["property", "procedural"],
      "applications": ["procedural", "property"],
      "benefits": ["property"],
      "comparison": ["comparison"],
      "limitations": ["warning", "property"],
      "risks": ["warning"],
      "mistakes": ["warning", "rule"],
      "best-practices": ["rule", "procedural"],
      "summary": ["definition", "property"],
      // Technology
      "getting-started": ["procedural"],
      "code-example": ["procedural"],
      "common-use-cases": ["property", "procedural"],
      "resources": ["property"],
      // Travel
      "overview": ["definition", "property"],
      "planning": ["procedural"],
      "budget": ["property"],
      "timing": ["property", "historical"],
      "preparation": ["procedural", "rule"],
      "what-to-expect": ["property"],
      "tips": ["rule", "property"],
      // Finance
      "tax-implications": ["property", "rule"],
      "expert-advice": ["rule", "property"],
      // Business
      "business-case": ["property", "definition"],
      "roi": ["property"],
      "implementation": ["procedural"],
      "common-failures": ["warning", "property"],
      "decision-framework": ["rule", "definition"],
      // Health
      "risks-side-effects": ["warning"],
      "when-to-use": ["rule", "procedural"],
      "warning-signs": ["warning"],
      "expert-recommendations": ["rule", "property"],
      // General
      "quick-start": ["procedural", "rule"],
    };

    const factTypes = allocation[sectionType] || [];
    const facts: PluginFact[] = [];

    for (const type of factTypes) {
      if (factsByType[type]) {
        facts.push(...factsByType[type]);
      }
    }

    // Limit facts based on section emphasis
    if (facts.length > 10) {
      return facts.slice(0, 10);
    }

    return facts;
  }

  /**
   * Allocate reader questions to a section
   */
  private allocateQuestionsToSection(
    sectionType: string,
    questionsToAnswer: ReaderQuestion[]
  ): ReaderQuestion[] {
    const sectionContextMap: Record<string, string[]> = {
      "definition": ["Definition", "Overview"],
      "importance": ["Importance"],
      "core-concept": ["Definition", "Overview"],
      "how-it-works": ["Mechanism", "Learning curve"],
      "example": ["Practical application", "Practice"],
      "applications": ["Practical application"],
      "benefits": ["Benefits"],
      "comparison": ["Comparison", "Alternatives", "Decision making"],
      "limitations": ["Risks", "Alternatives"],
      "risks": ["Risk", "Warning signs"],
      "mistakes": ["Mistakes", "Troubleshooting"],
      "best-practices": ["Expert advice"],
      "summary": [],
      // Technology
      "getting-started": ["Prerequisites", "Tools", "Time investment"],
      "code-example": ["Practice"],
      "common-use-cases": ["Practical application"],
      "resources": ["Resources"],
      // Travel
      "overview": ["Definition", "Overview"],
      "planning": ["Time", "Budget"],
      "budget": ["Budget"],
      "timing": ["Timing"],
      "preparation": ["Packing", "Documentation"],
      "what-to-expect": ["Safety", "Warnings"],
      "tips": ["Mistakes"],
      // Finance
      "tax-implications": ["Taxes"],
      "expert-advice": ["Expert advice"],
      // Business
      "business-case": ["ROI", "Risk"],
      "roi": ["ROI"],
      "implementation": ["Resources", "Timeline"],
      "common-failures": ["Failure patterns", "Risk"],
      "decision-framework": ["Decision making"],
      // Health
      "risks-side-effects": ["Side effects", "Safety"],
      "when-to-use": ["Medical attention"],
      "warning-signs": ["Warning signs"],
      "expert-recommendations": ["Expert advice"],
      // General
      "quick-start": ["Time", "Prerequisites"],
    };

    const contextKeywords = sectionContextMap[sectionType] || [];
    const sectionQuestions: ReaderQuestion[] = [];

    for (const question of questionsToAnswer) {
      if (contextKeywords.some(keyword => question.context.toLowerCase().includes(keyword.toLowerCase()))) {
        sectionQuestions.push(question);
      }
    }

    return sectionQuestions;
  }

  /**
   * Determine if a section should include an example
   */
  private shouldIncludeExample(
    sectionType: string,
    context: NarrativePlanningContext,
    sectionFacts: PluginFact[]
  ): boolean {
    // Always include examples for these sections
    const exampleSections = ["example", "code-example", "applications", "common-use-cases"];
    if (exampleSections.includes(sectionType)) {
      return true;
    }

    // Include examples for beginners in conceptual sections
    if (context.complexity === "beginner") {
      const conceptualSections = ["core-concept", "how-it-works", "definition"];
      if (conceptualSections.includes(sectionType)) {
        return true;
      }
    }

    // Include examples if facts are procedural
    const hasProceduralFacts = sectionFacts.some(f => f.factType === "procedural");
    if (hasProceduralFacts && sectionType === "how-it-works") {
      return true;
    }

    return false;
  }

  /**
   * Determine if a section should include a comparison
   */
  private shouldIncludeComparison(
    sectionType: string,
    context: NarrativePlanningContext,
    sectionFacts: PluginFact[]
  ): boolean {
    // Always include comparisons for comparison section
    if (sectionType === "comparison") {
      return true;
    }

    // Include comparisons if intent is decide
    if (context.intent === "decide" && sectionType === "benefits") {
      return true;
    }

    // Include comparisons if we have comparison facts
    const hasComparisonFacts = sectionFacts.some(f => f.factType === "comparison");
    if (hasComparisonFacts) {
      return true;
    }

    return false;
  }

  /**
   * Determine the visual component type for a section
   */
  private determineVisualType(
    sectionType: string,
    context: NarrativePlanningContext,
    sectionFacts: PluginFact[]
  ): "comparison-table" | "checklist" | "timeline" | "framework" | "process-flow" | "code-block" | "calculation" | "decision-tree" | null {
    // Technology: code blocks for code examples
    if (context.category === "technology" && (sectionType === "code-example" || sectionType === "how-it-works")) {
      return "code-block";
    }

    // Travel: timelines and checklists
    if (context.category === "travel") {
      if (sectionType === "preparation" || sectionType === "planning") {
        return "checklist";
      }
      if (sectionType === "timing") {
        return "timeline";
      }
    }

    // Finance: calculations for ROI or budget
    if (context.category === "finance") {
      if (sectionType === "roi" || sectionType === "budget") {
        return "calculation";
      }
    }

    // Business: decision trees and comparison tables
    if (context.category === "business") {
      if (sectionType === "decision-framework" || sectionType === "comparison") {
        return "decision-tree";
      }
      if (sectionType === "comparison") {
        return "comparison-table";
      }
    }

    // General: comparison tables for comparison section
    if (sectionType === "comparison" && sectionFacts.length >= 3) {
      return "comparison-table";
    }

    // General: checklists for procedural sections with many steps
    if (sectionFacts.length >= 5 && sectionFacts.some(f => f.factType === "procedural")) {
      return "checklist";
    }

    // General: framework boxes for conceptual sections
    if (sectionType === "core-concept" && sectionFacts.length >= 3) {
      return "framework";
    }

    // General: process flow for how-it-works
    if (sectionType === "how-it-works" && sectionFacts.length >= 3) {
      return "process-flow";
    }

    return null;
  }

  /**
   * Determine the depth of a section
   */
  private determineSectionDepth(
    context: NarrativePlanningContext,
    order: number,
    totalSections: number
  ): "introductory" | "intermediate" | "deep" {
    // First sections are introductory
    if (order < 3) {
      return "introductory";
    }

    // Middle sections are intermediate
    if (order < totalSections - 2) {
      return context.complexity === "advanced" ? "deep" : "intermediate";
    }

    // Last sections are summary/conclusion
    return "intermediate";
  }

  /**
   * Determine emphasis points in the article
   */
  private determineEmphasisPoints(
    context: NarrativePlanningContext,
    factsByType: Record<string, PluginFact[]>,
    questionsToAnswer: ReaderQuestion[]
  ): string[] {
    const emphasis: string[] = [];

    // Critical reader questions become emphasis points
    const criticalQuestions = questionsToAnswer.filter(q => q.priority === "critical");
    for (const question of criticalQuestions) {
      emphasis.push(question.question);
    }

    // Category-specific emphasis
    if (context.category === "technology") {
      emphasis.push("Practical application");
      emphasis.push("Getting started");
    } else if (context.category === "travel") {
      emphasis.push("Budget planning");
      emphasis.push("Safety");
    } else if (context.category === "finance") {
      emphasis.push("Risk management");
      emphasis.push("Long-term impact");
    } else if (context.category === "business") {
      emphasis.push("ROI");
      emphasis.push("Risk assessment");
    } else if (context.category === "health") {
      emphasis.push("Safety");
      emphasis.push("Evidence");
    }

    return emphasis;
  }

  /**
   * Identify facts that should be omitted
   */
  private identifyFactsToOmit(
    context: NarrativePlanningContext,
    factsByType: Record<string, PluginFact[]>,
    sections: NarrativeSection[]
  ): PluginFact[] {
    const includedFactIds = new Set<string>();
    for (const section of sections) {
      for (const fact of section.factsToInclude) {
        includedFactIds.add(fact.id);
      }
    }

    const omitted: PluginFact[] = [];
    for (const facts of Object.values(factsByType)) {
      for (const fact of facts) {
        if (!includedFactIds.has(fact.id)) {
          omitted.push(fact);
        }
      }
    }

    return omitted;
  }

  /**
   * Validate narrative plan against subject-specific rules
   */
  validateAgainstSubjectRules(subject: string, narrativePlan: NarrativePlan): ValidationResult {
    const rules = this.subjectValidationRules[subject];
    if (!rules) {
      // No specific rules for this subject, pass by default
      return { passes: true, violations: [] };
    }

    const violations: string[] = [];
    const sectionTypes = narrativePlan.sections.map(s => s.type);

    // Check mandatory sections
    for (const mandatorySection of rules.mandatorySections) {
      if (!sectionTypes.includes(mandatorySection)) {
        violations.push(`Missing mandatory section: ${mandatorySection}`);
      }
    }

    // Check forbidden sections
    for (const forbiddenSection of rules.forbiddenSections) {
      if (sectionTypes.includes(forbiddenSection)) {
        violations.push(`Contains forbidden section: ${forbiddenSection}`);
      }
    }

    // Check code blocks requirement
    if (rules.requireCodeBlocks) {
      const hasCodeBlocks = narrativePlan.sections.some(s => s.visualType === "code-block");
      if (!hasCodeBlocks) {
        violations.push("Missing required code blocks");
      }
    }

    // Check tables requirement
    if (rules.requireTables) {
      const hasTables = narrativePlan.sections.some(s => s.visualType === "comparison-table");
      if (!hasTables) {
        violations.push("Missing required tables");
      }
    }

    // Check examples requirement
    if (rules.requireExamples) {
      const hasExamples = narrativePlan.sections.some(s => s.includeExample);
      if (!hasExamples) {
        violations.push("Missing required examples");
      }
    }

    // Check comparisons requirement
    if (rules.requireComparisons) {
      const hasComparisons = narrativePlan.sections.some(s => s.includeComparison);
      if (!hasComparisons) {
        violations.push("Missing required comparisons");
      }
    }

    // Check checklists requirement
    if (rules.requireChecklists) {
      const hasChecklists = narrativePlan.sections.some(s => s.visualType === "checklist");
      if (!hasChecklists) {
        violations.push("Missing required checklists");
      }
    }

    return {
      passes: violations.length === 0,
      violations,
    };
  }
}
