/**
 * Visual Intelligence Engine (Stage 7)
 *
 * Decides when to use visual components based on understanding.
 * Not because templates exist, but because they improve understanding.
 *
 * Visual Components:
 * - Comparison Tables
 * - Checklists
 * - Decision Trees
 * - Timelines
 * - Framework Boxes
 * - Process Flows
 * - Code Blocks
 * - Calculations
 *
 * Decision Criteria:
 * - Content type
 * - Reader intent
 * - Complexity
 * - Number of items
 * - Relationship between items
 */

import type { PluginFact } from "../types";
import type { NarrativeSection } from "./narrativePlanningEngine";

export interface VisualIntelligenceContext {
  category: string;
  intent: "inform" | "educate" | "guide" | "decide";
  complexity: "beginner" | "intermediate" | "advanced";
  sections: NarrativeSection[];
}

export interface VisualDecision {
  sectionType: string;
  shouldIncludeVisual: boolean;
  visualType: "comparison-table" | "checklist" | "timeline" | "framework" | "process-flow" | "code-block" | "calculation" | "decision-tree" | null;
  reasoning: string;
}

export interface VisualPlan {
  decisions: VisualDecision[];
}

export class VisualIntelligenceEngine {
  /**
   * Create the visual plan for the document
   */
  createVisualPlan(context: VisualIntelligenceContext): VisualPlan {
    const decisions: VisualDecision[] = [];

    for (const section of context.sections) {
      const decision = this.decideVisualForSection(section, context);
      decisions.push(decision);
    }

    return { decisions };
  }

  /**
   * Decide if a section needs a visual component
   */
  private decideVisualForSection(
    section: NarrativeSection,
    context: VisualIntelligenceContext
  ): VisualDecision {
    const { category, intent, complexity } = context;
    const facts = section.factsToInclude;

    // Check if visual was already planned in narrative planning
    if (section.visualType) {
      return {
        sectionType: section.type,
        shouldIncludeVisual: true,
        visualType: section.visualType,
        reasoning: "Planned in narrative stage",
      };
    }

    // Make intelligent decision based on content
    const decision = this.makeIntelligentDecision(section, category, intent, complexity, facts);

    return decision;
  }

  /**
   * Make intelligent visual decision based on content analysis
   */
  private makeIntelligentDecision(
    section: NarrativeSection,
    category: string,
    intent: string,
    complexity: string,
    facts: PluginFact[]
  ): VisualDecision {
    const sectionType = section.type;
    const factCount = facts.length;

    // Comparison Table Decision
    if (this.shouldUseComparisonTable(sectionType, category, intent, facts)) {
      return {
        sectionType,
        shouldIncludeVisual: true,
        visualType: "comparison-table",
        reasoning: `Comparing ${factCount} items requires table format for clarity`,
      };
    }

    // Checklist Decision
    if (this.shouldUseChecklist(sectionType, category, intent, facts)) {
      return {
        sectionType,
        shouldIncludeVisual: true,
        visualType: "checklist",
        reasoning: `${factCount} sequential action items benefit from checklist format`,
      };
    }

    // Timeline Decision
    if (this.shouldUseTimeline(sectionType, category, intent, facts)) {
      return {
        sectionType,
        shouldIncludeVisual: true,
        visualType: "timeline",
        reasoning: `Sequential or historical information with ${factCount} events`,
      };
    }

    // Framework Decision
    if (this.shouldUseFramework(sectionType, category, intent, facts)) {
      return {
        sectionType,
        shouldIncludeVisual: true,
        visualType: "framework",
        reasoning: `${factCount} related concepts form a mental framework`,
      };
    }

    // Process Flow Decision
    if (this.shouldUseProcessFlow(sectionType, category, intent, facts)) {
      return {
        sectionType,
        shouldIncludeVisual: true,
        visualType: "process-flow",
        reasoning: `${factCount} steps form a process that benefits from visualization`,
      };
    }

    // Code Block Decision
    if (this.shouldUseCodeBlock(sectionType, category, intent, facts)) {
      return {
        sectionType,
        shouldIncludeVisual: true,
        visualType: "code-block",
        reasoning: "Technical syntax requires code block formatting",
      };
    }

    // Calculation Decision
    if (this.shouldUseCalculation(sectionType, category, intent, facts)) {
      return {
        sectionType,
        shouldIncludeVisual: true,
        visualType: "calculation",
        reasoning: "Numerical examples benefit from calculation format",
      };
    }

    // Decision Tree Decision
    if (this.shouldUseDecisionTree(sectionType, category, intent, facts)) {
      return {
        sectionType,
        shouldIncludeVisual: true,
        visualType: "decision-tree",
        reasoning: "Conditional decision paths need tree visualization",
      };
    }

    // No visual needed
    return {
      sectionType,
      shouldIncludeVisual: false,
      visualType: null,
      reasoning: "Content is best presented as prose",
    };
  }

  /**
   * Decision criteria for comparison tables
   */
  private shouldUseComparisonTable(
    sectionType: string,
    category: string,
    intent: string,
    facts: PluginFact[]
  ): boolean {
    // Direct comparison sections
    if (sectionType === "comparison" || sectionType === "comparison-table") {
      return facts.length >= 2;
    }

    // Comparison facts present
    const hasComparisonFacts = facts.some(f => f.factType === "comparison");
    if (hasComparisonFacts && facts.length >= 3) {
      return true;
    }

    // Decision intent with alternatives
    if (intent === "decide" && (sectionType === "benefits" || sectionType === "applications")) {
      return facts.length >= 3;
    }

    // Business and finance benefit from comparisons
    if ((category === "business" || category === "finance") && sectionType === "benefits") {
      return facts.length >= 3;
    }

    return false;
  }

  /**
   * Decision criteria for checklists
   */
  private shouldUseChecklist(
    sectionType: string,
    category: string,
    intent: string,
    facts: PluginFact[]
  ): boolean {
    // Direct checklist sections
    if (sectionType === "checklist" || sectionType === "practical-checklist") {
      return facts.length >= 3;
    }

    // Procedural facts with intent=guide
    if (intent === "guide" && facts.some(f => f.factType === "procedural")) {
      return facts.length >= 5;
    }

    // Travel preparation
    if (category === "travel" && (sectionType === "preparation" || sectionType === "planning")) {
      return facts.length >= 4;
    }

    // Home projects
    if (category === "home" && facts.some(f => f.factType === "procedural")) {
      return facts.length >= 4;
    }

    return false;
  }

  /**
   * Decision criteria for timelines
   */
  private shouldUseTimeline(
    sectionType: string,
    category: string,
    intent: string,
    facts: PluginFact[]
  ): boolean {
    // Direct timeline sections
    if (sectionType === "timeline") {
      return facts.length >= 3;
    }

    // Historical facts
    const hasHistoricalFacts = facts.some(f => f.factType === "historical");
    if (hasHistoricalFacts && facts.length >= 3) {
      return true;
    }

    // Travel timing
    if (category === "travel" && sectionType === "timing") {
      return facts.length >= 3;
    }

    // Education learning path
    if (category === "education" && sectionType === "learning-path") {
      return facts.length >= 3;
    }

    return false;
  }

  /**
   * Decision criteria for frameworks
   */
  private shouldUseFramework(
    sectionType: string,
    category: string,
    intent: string,
    facts: PluginFact[]
  ): boolean {
    // Direct framework sections
    if (sectionType === "framework" || sectionType === "framework-box") {
      return facts.length >= 3;
    }

    // Core concept sections with multiple definitions
    if (sectionType === "core-concept" && facts.length >= 4) {
      return true;
    }

    // Education concepts
    if (category === "education" && sectionType === "core-concept") {
      return facts.length >= 3;
    }

    return false;
  }

  /**
   * Decision criteria for process flows
   */
  private shouldUseProcessFlow(
    sectionType: string,
    category: string,
    intent: string,
    facts: PluginFact[]
  ): boolean {
    // How it works with multiple procedural steps
    if (sectionType === "how-it-works" && facts.some(f => f.factType === "procedural")) {
      return facts.length >= 3;
    }

    // Implementation sections
    if (sectionType === "implementation" || sectionType === "getting-started") {
      return facts.length >= 4;
    }

    return false;
  }

  /**
   * Decision criteria for code blocks
   */
  private shouldUseCodeBlock(
    sectionType: string,
    category: string,
    intent: string,
    facts: PluginFact[]
  ): boolean {
    // Technology category
    if (category === "technology") {
      if (sectionType === "code-example" || sectionType === "how-it-works") {
        return true;
      }
      if (facts.some(f => f.statement.includes("```") || f.statement.includes("function") || f.statement.includes("class"))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Decision criteria for calculations
   */
  private shouldUseCalculation(
    sectionType: string,
    category: string,
    intent: string,
    facts: PluginFact[]
  ): boolean {
    // Finance category
    if (category === "finance") {
      if (sectionType === "roi" || sectionType === "budget") {
        return true;
      }
      if (facts.some(f => f.statement.match(/\d+%|\$\d+|\d+\.\d+/))) {
        return true;
      }
    }

    // Business ROI
    if (category === "business" && sectionType === "roi") {
      return true;
    }

    return false;
  }

  /**
   * Decision criteria for decision trees
   */
  private shouldUseDecisionTree(
    sectionType: string,
    category: string,
    intent: string,
    facts: PluginFact[]
  ): boolean {
    // Decision intent with framework
    if (intent === "decide" && sectionType === "decision-framework") {
      return facts.length >= 3;
    }

    // Business decision frameworks
    if (category === "business" && sectionType === "decision-framework") {
      return facts.length >= 3;
    }

    return false;
  }
}
