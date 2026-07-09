/**
 * Reader Flow Validator
 *
 * Validates that articles follow natural educational flow.
 * 
 * Principles:
 * - Articles should progress logically from simple to complex
 * - Transitions should feel natural, not forced
 * - No abrupt jumps in complexity
 * - Sections should build on each other
 * - Reader should never feel lost or confused
 */

import type { DocumentNode } from "../types";

export interface CompositionContext {
  facts: any[];
  config: any;
  subject: string;
  intent: "inform" | "educate" | "guide" | "decide";
  complexity: "beginner" | "intermediate" | "advanced";
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

export class ReaderFlowValidator {
  /**
   * Validate the document tree and generate quality report
   */
  validate(tree: DocumentNode[], context: CompositionContext): QualityReport {
    const issues: QualityIssue[] = [];

    // Phase 3 alignment: duplicate headings and content blocks
    this.validateDuplicateContent(tree, issues);

    // Validate structure (knowledge-driven — no fixed template scaffold)
    this.validateStructure(tree, context, issues);

    // Validate transitions
    this.validateTransitions(tree, context, issues);

    // Validate complexity progression
    this.validateComplexityProgression(tree, context, issues);

    // Validate content quality
    this.validateContentQuality(tree, context, issues);

    // Calculate scores
    const scores = this.calculateScores(issues, tree);

    return {
      educationalValue: scores.educationalValue,
      clarity: scores.clarity,
      logicalFlow: scores.logicalFlow,
      explanationDepth: scores.explanationDepth,
      readerExperience: scores.readerExperience,
      issues,
    };
  }

  /**
   * Phase 3: detect duplicate headings and repeated content blocks
   */
  private validateDuplicateContent(tree: DocumentNode[], issues: QualityIssue[]): void {
    const headingKeys = new Set<string>();
    const contentKeys = new Set<string>();

    for (const node of tree) {
      if (node.type === "heading" && node.level === 2) {
        const key = this.normalizeHeading(node.text);
        if (headingKeys.has(key)) {
          issues.push({
            type: "repetitive",
            severity: "critical",
            message: `Duplicate heading: ${node.text}`,
            location: node.text,
          });
        }
        headingKeys.add(key);
      }

      const text = this.extractText(node).trim();
      const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ");
      if (normalized.length >= 20 && contentKeys.has(normalized)) {
        issues.push({
          type: "repetitive",
          severity: "warning",
          message: "Duplicate content block detected",
          location: normalized.slice(0, 40),
        });
      }
      if (normalized.length >= 20) contentKeys.add(normalized);
    }
  }

  /**
   * Validate article structure
   */
  private validateStructure(tree: DocumentNode[], context: CompositionContext, issues: QualityIssue[]): void {
    const h2Count = tree.filter((n) => n.type === "heading" && n.level === 2).length;

    if (h2Count < 2) {
      issues.push({
        type: "missing_section",
        severity: "critical",
        message: "Article needs at least two knowledge-backed sections",
        location: "structure",
      });
    }

    // Teaching order for Phase 4 KE section types
    const sectionTypes = this.extractSectionTypes(tree);
    const expectedOrder = [
      "definition-card",
      "motivation",
      "core-concept",
      "history",
      "how-it-works",
      "use-cases",
      "comparison-table",
      "beginner-mistakes",
      "best-practices",
      "applications",
      "summary",
      // legacy aliases from heading text
      "introduction",
      "example",
      "benefits",
      "limitations",
      "mistakes",
      "related",
    ];

    for (let i = 0; i < sectionTypes.length - 1; i++) {
      const currentIdx = expectedOrder.indexOf(sectionTypes[i]);
      const nextIdx = expectedOrder.indexOf(sectionTypes[i + 1]);

      if (currentIdx > -1 && nextIdx > -1 && currentIdx > nextIdx) {
        issues.push({
          type: "complexity_jump",
          severity: "warning",
          message: `Section order may be illogical: ${sectionTypes[i]} before ${sectionTypes[i + 1]}`,
          location: "structure",
        });
      }
    }

    // Flag generic low-value headings
    for (const node of tree) {
      if (node.type !== "heading" || node.level !== 2) continue;
      const key = this.normalizeHeading(node.text);
      if (["overview", "key points", "concepts", "background"].includes(key)) {
        issues.push({
          type: "unclear",
          severity: "warning",
          message: `Generic heading reduces educational value: ${node.text}`,
          location: node.text,
        });
      }
    }
  }

  /**
   * Validate transitions between sections
   */
  private validateTransitions(tree: DocumentNode[], context: CompositionContext, issues: QualityIssue[]): void {
    let previousSection = "";
    let transitionCount = 0;

    for (let i = 0; i < tree.length; i++) {
      const node = tree[i];

      if (node.type === "heading" && node.level === 2) {
        const currentSection = this.normalizeHeading(node.text);

        // Check if there's a transition paragraph before this heading
        if (i > 0 && tree[i - 1].type === "paragraph") {
          transitionCount++;
        } else if (previousSection && this.shouldHaveTransition(previousSection, currentSection)) {
          issues.push({
            type: "weak_transition",
            severity: "warning",
            message: `Missing transition between ${previousSection} and ${currentSection}`,
            location: `before ${currentSection}`,
          });
        }

        previousSection = currentSection;
      }
    }

    // Check overall transition density
    const headingCount = tree.filter(n => n.type === "heading" && n.level === 2).length;
    if (headingCount > 3 && transitionCount < headingCount - 1) {
      issues.push({
        type: "weak_transition",
        severity: "info",
        message: "Consider adding more transitions between sections",
        location: "overall",
      });
    }
  }

  /**
   * Validate complexity progression
   */
  private validateComplexityProgression(tree: DocumentNode[], context: CompositionContext, issues: QualityIssue[]): void {
    const sections = this.groupBySection(tree);
    const complexityScores: Array<{ section: string; complexity: number }> = [];

    for (const [section, nodes] of Object.entries(sections)) {
      const complexity = this.assessSectionComplexity(nodes);
      complexityScores.push({ section, complexity });
    }

    // Check for jumps in complexity
    for (let i = 0; i < complexityScores.length - 1; i++) {
      const current = complexityScores[i].complexity;
      const next = complexityScores[i + 1].complexity;

      if (Math.abs(next - current) > 0.4) {
        issues.push({
          type: "complexity_jump",
          severity: "warning",
          message: `Significant complexity jump from ${complexityScores[i].section} to ${complexityScores[i + 1].section}`,
          location: `${complexityScores[i].section} → ${complexityScores[i + 1].section}`,
        });
      }
    }
  }

  /**
   * Validate content quality
   */
  private validateContentQuality(tree: DocumentNode[], context: CompositionContext, issues: QualityIssue[]): void {
    let paragraphCount = 0;
    let totalWordCount = 0;
    let repeatedOpenings = 0;
    const openings: string[] = [];

    for (const node of tree) {
      if (node.type === "paragraph") {
        paragraphCount++;
        const text = this.extractText(node);
        totalWordCount += text.split(/\s+/).length;

        // Check for repetitive openings
        const firstWords = text.split(/\s+/).slice(0, 3).join(" ").toLowerCase();
        if (openings.includes(firstWords)) {
          repeatedOpenings++;
        }
        openings.push(firstWords);
      }
    }

    // Phase 3: flag generic filler phrases
    const fillerPatterns = [
      /in today's rapidly evolving/i,
      /it is important to note/i,
      /let's explore/i,
      /now that we understand/i,
      /continue your learning journey/i,
    ];
    const fullText = tree.map((n) => this.extractText(n)).join("\n");
    for (const pattern of fillerPatterns) {
      if (pattern.test(fullText)) {
        issues.push({
          type: "unclear",
          severity: "warning",
          message: `Generic filler detected: ${pattern.source}`,
          location: "overall",
        });
      }
    }

    // Check for repetitive openings
    if (repeatedOpenings > paragraphCount * 0.2) {
      issues.push({
        type: "repetitive",
        severity: "warning",
        message: "Multiple paragraphs start with similar phrases",
        location: "overall",
      });
    }

    // Check word count (too short = insufficient depth)
    if (totalWordCount < 300) {
      issues.push({
        type: "missing_explanation",
        severity: "critical",
        message: "Article appears too short for meaningful content",
        location: "overall",
      });
    }

    // Check for missing examples in key sections
    const hasExampleSection = tree.some(n => 
      n.type === "heading" && 
      n.level === 2 && 
      n.text.toLowerCase().includes("example")
    );

    if (context.complexity === "beginner" && !hasExampleSection) {
      issues.push({
        type: "no_example",
        severity: "warning",
        message: "Beginner-level content should include examples",
        location: "structure",
      });
    }
  }

  /**
   * Calculate quality scores
   */
  private calculateScores(issues: QualityIssue[], tree: DocumentNode[]): {
    educationalValue: number;
    clarity: number;
    logicalFlow: number;
    explanationDepth: number;
    readerExperience: number;
  } {
    const criticalCount = issues.filter(i => i.severity === "critical").length;
    const warningCount = issues.filter(i => i.severity === "warning").length;
    const infoCount = issues.filter(i => i.severity === "info").length;

    // Base score starts at 100, deduct for issues
    let educationalValue = 100 - (criticalCount * 20) - (warningCount * 10) - (infoCount * 5);
    let clarity = 100 - (criticalCount * 25) - (warningCount * 10) - (infoCount * 5);
    let logicalFlow = 100 - (criticalCount * 15) - (warningCount * 10) - (infoCount * 5);
    let explanationDepth = 100 - (criticalCount * 20) - (warningCount * 10) - (infoCount * 5);
    let readerExperience = 100 - (criticalCount * 20) - (warningCount * 15) - (infoCount * 5);

    // Ensure scores are in valid range
    educationalValue = Math.max(0, Math.min(100, educationalValue));
    clarity = Math.max(0, Math.min(100, clarity));
    logicalFlow = Math.max(0, Math.min(100, logicalFlow));
    explanationDepth = Math.max(0, Math.min(100, explanationDepth));
    readerExperience = Math.max(0, Math.min(100, readerExperience));

    return {
      educationalValue,
      clarity,
      logicalFlow,
      explanationDepth,
      readerExperience,
    };
  }

  /**
   * Extract section types from document tree
   */
  private extractSectionTypes(tree: DocumentNode[]): string[] {
    const types: string[] = [];

    for (const node of tree) {
      if (node.type === "heading" && node.level === 2) {
        types.push(this.normalizeHeading(node.text));
      }
    }

    return types;
  }

  /**
   * Normalize heading text to section type
   */
  private normalizeHeading(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  /**
   * Check if a transition should exist between sections
   */
  private shouldHaveTransition(from: string, to: string): boolean {
    // Transitions are needed between most sections
    const noTransitionNeeded = ["summary", "related"];
    return !noTransitionNeeded.includes(to);
  }

  /**
   * Assess complexity of a section
   */
  private assessSectionComplexity(nodes: DocumentNode[]): number {
    let complexity = 0;
    let wordCount = 0;

    for (const node of nodes) {
      const text = this.extractText(node);
      const words = text.split(/\s+/);
      wordCount += words.length;

      // Complexity indicators
      if (text.includes("however") || text.includes("therefore") || text.includes("consequently")) {
        complexity += 0.1;
      }
      if (text.length > 100) {
        complexity += 0.05;
      }
      if (node.type === "callout") {
        complexity += 0.1;
      }
    }

    // Normalize by word count
    return wordCount > 0 ? Math.min(1, complexity / (wordCount / 100)) : 0;
  }

  /**
   * Group nodes by section
   */
  private groupBySection(tree: DocumentNode[]): Record<string, DocumentNode[]> {
    const sections: Record<string, DocumentNode[]> = {};
    let currentSection = "introduction";

    for (const node of tree) {
      if (node.type === "heading" && node.level === 2) {
        currentSection = this.normalizeHeading(node.text);
      }

      if (!sections[currentSection]) {
        sections[currentSection] = [];
      }
      sections[currentSection].push(node);
    }

    return sections;
  }

  /**
   * Extract text from a node
   */
  private extractText(node: DocumentNode): string {
    if (node.type === "paragraph") {
      if (typeof node.children === "string") {
        return node.children;
      }
      return node.children.join(" ");
    }
    if (node.type === "heading") {
      return node.text;
    }
    if (node.type === "list-item") {
      if (typeof node.children === "string") {
        return node.children;
      }
      return node.children.join(" ");
    }
    return "";
  }
}
