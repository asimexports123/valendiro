/**
 * Improved Quality Scorer
 *
 * Evaluates articles on educational value, clarity, logical flow, and reader experience.
 * 
 * Scoring dimensions:
 * - Educational Value: Does the reader actually learn?
 * - Clarity: Is the content easy to understand?
 * - Logical Flow: Does the article progress naturally?
 * - Explanation Depth: Are facts explained, not just stated?
 * - Reader Experience: Is it enjoyable to read?
 */

import type { DocumentNode, PluginFact, RenderQualityScore } from "../types";

export interface CompositionContext {
  facts: PluginFact[];
  config: any;
  subject: string;
  intent: "inform" | "educate" | "guide" | "decide";
  complexity: "beginner" | "intermediate" | "advanced";
}

export interface DetailedQualityScore {
  educationalValue: number;
  clarity: number;
  logicalFlow: number;
  explanationDepth: number;
  readerExperience: number;
  overall: number;
  breakdown: QualityBreakdown;
}

export interface QualityBreakdown {
  introductionStrength: number;
  exampleQuality: number;
  transitionQuality: number;
  explanationCoverage: number;
  readabilityScore: number;
  redundancyScore: number;
  completenessScore: number;
}

export class ImprovedQualityScorer {
  /**
   * Score the document tree with detailed metrics
   */
  score(
    tree: DocumentNode[],
    facts: PluginFact[],
    context: CompositionContext
  ): DetailedQualityScore {
    const breakdown = this.analyzeQuality(tree, facts, context);
    const scores = this.calculateDetailedScores(breakdown, context);

    return {
      educationalValue: scores.educationalValue,
      clarity: scores.clarity,
      logicalFlow: scores.logicalFlow,
      explanationDepth: scores.explanationDepth,
      readerExperience: scores.readerExperience,
      overall: scores.overall,
      breakdown,
    };
  }

  /**
   * Convert detailed score to legacy RenderQualityScore format
   */
  toLegacyScore(detailed: DetailedQualityScore, tree: DocumentNode[], facts: PluginFact[]): RenderQualityScore {
    const wordCount = this.countWords(tree);
    const sectionCount = this.countSections(tree);

    return {
      overall: detailed.overall,
      factCoverage: detailed.explanationDepth,
      citationCoverage: 100, // Assume full coverage for now
      sectionCompleteness: detailed.breakdown.completenessScore,
      readabilityEstimate: detailed.clarity,
      missingKnowledgeCount: 0,
      missingKnowledgeSeverity: {},
      wordCount,
      sectionCount,
      internalLinkCount: 0,
      citationCount: 0,
      readingFlow: {
        repeatedOpenings: 100 - detailed.breakdown.redundancyScore,
        paragraphLengthBalance: 100,
        headingDensity: this.calculateHeadingDensity(tree),
        bulletListRatio: this.calculateBulletListRatio(tree),
        transitionQuality: detailed.breakdown.transitionQuality,
        sentenceVariety: 100,
        overallFlowScore: detailed.logicalFlow,
      },
    };
  }

  /**
   * Analyze quality dimensions
   */
  private analyzeQuality(
    tree: DocumentNode[],
    facts: PluginFact[],
    context: CompositionContext
  ): QualityBreakdown {
    return {
      introductionStrength: this.scoreIntroduction(tree),
      exampleQuality: this.scoreExamples(tree, context),
      transitionQuality: this.scoreTransitions(tree),
      explanationCoverage: this.scoreExplanationCoverage(tree, facts),
      readabilityScore: this.scoreReadability(tree),
      redundancyScore: this.scoreRedundancy(tree),
      completenessScore: this.scoreCompleteness(tree, context),
    };
  }

  /**
   * Calculate detailed scores from breakdown
   */
  private calculateDetailedScores(
    breakdown: QualityBreakdown,
    context: CompositionContext
  ): {
    educationalValue: number;
    clarity: number;
    logicalFlow: number;
    explanationDepth: number;
    readerExperience: number;
    overall: number;
  } {
    // Educational Value: introduction + examples + explanation + completeness
    const educationalValue = Math.round(
      (breakdown.introductionStrength * 0.25 +
        breakdown.exampleQuality * 0.25 +
        breakdown.explanationCoverage * 0.3 +
        breakdown.completenessScore * 0.2)
    );

    // Clarity: readability + explanation
    const clarity = Math.round(
      (breakdown.readabilityScore * 0.6 +
        breakdown.explanationCoverage * 0.4)
    );

    // Logical Flow: transitions + completeness
    const logicalFlow = Math.round(
      (breakdown.transitionQuality * 0.6 +
        breakdown.completenessScore * 0.4)
    );

    // Explanation Depth: explanation coverage
    const explanationDepth = breakdown.explanationCoverage;

    // Reader Experience: readability + transitions - redundancy
    const readerExperience = Math.round(
      (breakdown.readabilityScore * 0.4 +
        breakdown.transitionQuality * 0.4 +
        (100 - breakdown.redundancyScore) * 0.2)
    );

    // Overall: weighted average
    const overall = Math.round(
      (educationalValue * 0.3 +
        clarity * 0.2 +
        logicalFlow * 0.2 +
        explanationDepth * 0.15 +
        readerExperience * 0.15)
    );

    return {
      educationalValue,
      clarity,
      logicalFlow,
      explanationDepth,
      readerExperience,
      overall,
    };
  }

  /**
   * Score introduction strength
   */
  private scoreIntroduction(tree: DocumentNode[]): number {
    const introNodes = tree.slice(0, 10); // First 10 nodes
    let score = 0;

    // Check for heading
    const hasHeading = introNodes.some(n => n.type === "heading" && n.level === 1);
    if (hasHeading) score += 25;

    // Check for definition paragraph
    const hasDefinition = introNodes.some(n => 
      n.type === "paragraph" && 
      this.extractText(n).length > 50
    );
    if (hasDefinition) score += 35;

    // Check for "why it matters" framing
    const hasWhyMatters = introNodes.some(n =>
      n.type === "paragraph" &&
      this.extractText(n).toLowerCase().includes("important") ||
      this.extractText(n).toLowerCase().includes("matters")
    );
    if (hasWhyMatters) score += 40;

    return Math.min(100, score);
  }

  /**
   * Score example quality
   */
  private scoreExamples(tree: DocumentNode[], context: CompositionContext): number {
    let score = 0;
    let exampleCount = 0;

    for (const node of tree) {
      const text = this.extractText(node).toLowerCase();
      
      if (text.includes("example") || text.includes("for instance") || text.includes("consider")) {
        exampleCount++;
      }
    }

    // Base score for having examples
    if (exampleCount > 0) score += 50;
    
    // Bonus for multiple examples
    if (exampleCount >= 2) score += 25;
    if (exampleCount >= 3) score += 25;

    // Beginner content requires examples
    if (context.complexity === "beginner" && exampleCount === 0) {
      score = 0;
    }

    return Math.min(100, score);
  }

  /**
   * Score transition quality
   */
  private scoreTransitions(tree: DocumentNode[]): number {
    const headings = tree.filter(n => n.type === "heading" && n.level === 2);
    let transitionCount = 0;

    for (let i = 0; i < tree.length; i++) {
      const node = tree[i];
      const prevNode = tree[i - 1];

      if (node.type === "heading" && node.level === 2) {
        if (prevNode && prevNode.type === "paragraph") {
          transitionCount++;
        }
      }
    }

    // Ideal: transition before each heading (except first)
    const idealTransitions = Math.max(0, headings.length - 1);
    
    if (idealTransitions === 0) return 100;
    
    const ratio = transitionCount / idealTransitions;
    return Math.round(ratio * 100);
  }

  /**
   * Score explanation coverage
   */
  private scoreExplanationCoverage(tree: DocumentNode[], facts: PluginFact[]): number {
    let explainedCount = 0;

    for (const fact of facts) {
      const statement = fact.statement.toLowerCase();
      
      // Check for explanation indicators
      const hasExplanation =
        statement.includes("because") ||
        statement.includes("since") ||
        statement.includes("due to") ||
        statement.includes("why") ||
        statement.includes("how") ||
        statement.includes("when") ||
        statement.includes("where");

      if (hasExplanation) {
        explainedCount++;
      }
    }

    if (facts.length === 0) return 100;
    
    return Math.round((explainedCount / facts.length) * 100);
  }

  /**
   * Score readability
   */
  private scoreReadability(tree: DocumentNode[]): number {
    let totalSentences = 0;
    let totalWords = 0;
    let longSentences = 0;

    for (const node of tree) {
      if (node.type === "paragraph") {
        const text = this.extractText(node);
        const sentences = text.split(/[.!?]+/);
        const words = text.split(/\s+/).filter(w => w.length > 0);

        totalSentences += sentences.length;
        totalWords += words.length;

        for (const sentence of sentences) {
          const sentenceWords = sentence.split(/\s+/).filter(w => w.length > 0);
          if (sentenceWords.length > 25) {
            longSentences++;
          }
        }
      }
    }

    if (totalSentences === 0) return 100;

    // Penalty for long sentences
    const longSentenceRatio = longSentences / totalSentences;
    const readabilityPenalty = longSentenceRatio * 50;

    // Average sentence length (ideal: 15-20 words)
    const avgSentenceLength = totalWords / totalSentences;
    let lengthScore = 100;
    if (avgSentenceLength > 25) {
      lengthScore -= (avgSentenceLength - 25) * 5;
    } else if (avgSentenceLength < 10) {
      lengthScore -= (10 - avgSentenceLength) * 5;
    }

    return Math.max(0, Math.min(100, Math.round(lengthScore - readabilityPenalty)));
  }

  /**
   * Score redundancy
   */
  private scoreRedundancy(tree: DocumentNode[]): number {
    const paragraphs = tree.filter(n => n.type === "paragraph");
    const openings: string[] = [];
    let repeatedOpenings = 0;

    for (const para of paragraphs) {
      const text = this.extractText(para);
      const words = text.split(/\s+/);
      const opening = words.slice(0, 3).join(" ").toLowerCase();

      if (openings.includes(opening)) {
        repeatedOpenings++;
      }
      openings.push(opening);
    }

    if (paragraphs.length === 0) return 100;

    const redundancyRatio = repeatedOpenings / paragraphs.length;
    return Math.round((1 - redundancyRatio) * 100);
  }

  /**
   * Score completeness
   */
  private scoreCompleteness(tree: DocumentNode[], context: CompositionContext): number {
    const headings = tree
      .filter(n => n.type === "heading" && (n as any).level === 2)
      .map(n => (n as any).text.toLowerCase());

    const requiredSections = ["what", "how", "example"];
    const optionalSections = ["benefits", "limitations", "best", "practice", "history"];

    let score = 0;
    let foundRequired = 0;

    for (const required of requiredSections) {
      if (headings.some(h => h.includes(required))) {
        foundRequired++;
      }
    }

    // Score based on required sections
    score = (foundRequired / requiredSections.length) * 70;

    // Bonus for optional sections
    for (const optional of optionalSections) {
      if (headings.some(h => h.includes(optional))) {
        score += 5;
      }
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Count words in document tree
   */
  private countWords(tree: DocumentNode[]): number {
    let count = 0;

    for (const node of tree) {
      const text = this.extractText(node);
      count += text.split(/\s+/).filter(w => w.length > 0).length;
    }

    return count;
  }

  /**
   * Count sections in document tree
   */
  private countSections(tree: DocumentNode[]): number {
    return tree.filter(n => n.type === "heading" && n.level === 2).length;
  }

  /**
   * Calculate heading density
   */
  private calculateHeadingDensity(tree: DocumentNode[]): number {
    const headingCount = tree.filter(n => n.type === "heading").length;
    const totalNodes = tree.length;

    if (totalNodes === 0) return 100;

    const density = headingCount / totalNodes;
    // Ideal density: 10-20%
    if (density < 0.1) return 80;
    if (density > 0.2) return 80;
    return 100;
  }

  /**
   * Calculate bullet list ratio
   */
  private calculateBulletListRatio(tree: DocumentNode[]): number {
    const listCount = tree.filter(n => n.type === "list").length;
    const paragraphCount = tree.filter(n => n.type === "paragraph").length;

    if (paragraphCount === 0) return 100;

    const ratio = listCount / paragraphCount;
    // Ideal ratio: 20-40%
    if (ratio < 0.2) return 80;
    if (ratio > 0.4) return 80;
    return 100;
  }

  /**
   * Extract text from a node
   */
  private extractText(node: DocumentNode): string {
    if (node.type === "paragraph") {
      if (typeof node.children === "string") {
        return node.children;
      }
      return Array.isArray(node.children) ? node.children.join(" ") : "";
    }
    if (node.type === "heading") {
      return node.text;
    }
    if (node.type === "list-item") {
      if (typeof node.children === "string") {
        return node.children;
      }
      return Array.isArray(node.children) ? node.children.join(" ") : "";
    }
    if (node.type === "list") {
      return node.items.map(item => {
        if (typeof item.children === "string") {
          return item.children;
        }
        return Array.isArray(item.children) ? item.children.join(" ") : "";
      }).join(" ");
    }
    return "";
  }
}
