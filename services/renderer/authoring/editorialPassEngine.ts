/**
 * Editorial Pass Engine (Stage 10)
 *
 * Before rendering, perform an editorial review.
 * Check for and fix quality issues automatically.
 *
 * Checks:
 * - Repetition
 * - Weak transitions
 * - Filler
 * - AI phrases
 * - Knowledge duplication
 * - Missing examples
 * - Wall of text
 * - Weak conclusions
 * - Low practical value
 *
 * Fix these automatically before HTML generation.
 */

import type { WrittenDocument, WrittenSection } from "./writingEngine";

export interface EditorialIssue {
  type: "repetition" | "weak-transition" | "filler" | "ai-phrase" | "duplication" | "missing-example" | "wall-of-text" | "weak-conclusion" | "low-practical-value";
  severity: "critical" | "warning" | "info";
  location: string;
  message: string;
  suggestion: string;
  autoFixed: boolean;
}

export interface EditorialResult {
  document: WrittenDocument;
  issues: EditorialIssue[];
  fixedIssues: number;
  remainingIssues: number;
  qualityScore: number;
  passesEditorial: boolean;
}

export class EditorialPassEngine {
  private aiPhrases: string[] = [
    "In today's world",
    "It is important to note",
    "Let's understand",
    "Now that you know",
    "Building on this",
    "Furthermore",
    "In practice",
    "With this foundation in place",
    "Additionally",
    "This is important because",
    "These characteristics work together to define",
    "Worth highlighting",
    "Specifically",
    "In particular",
    "Of note",
    "Importantly",
  ];

  private fillerWords: string[] = [
    "basically",
    "essentially",
    "actually",
    "really",
    "very",
    "quite",
    "rather",
    "somewhat",
  ];

  /**
   * Perform editorial pass on the document
   */
  performEditorialPass(document: WrittenDocument): EditorialResult {
    const issues: EditorialIssue[] = [];

    // Check introduction
    const introIssues = this.checkIntroduction(document.introduction);
    issues.push(...introIssues);

    // Check each section
    for (const section of document.sections) {
      const sectionIssues = this.checkSection(section);
      issues.push(...sectionIssues);
    }

    // Check conclusion
    const conclusionIssues = this.checkConclusion(document.conclusion);
    issues.push(...conclusionIssues);

    // Auto-fix issues
    const { fixedDocument, fixedCount } = this.autoFixIssues(document, issues);

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(issues, fixedCount);

    // Determine if passes editorial
    const passesEditorial = this.determinePassStatus(issues, qualityScore);

    return {
      document: fixedDocument,
      issues,
      fixedIssues: fixedCount,
      remainingIssues: issues.length - fixedCount,
      qualityScore,
      passesEditorial,
    };
  }

  /**
   * Check introduction for issues
   */
  private checkIntroduction(introduction: string): EditorialIssue[] {
    const issues: EditorialIssue[] = [];

    if (!introduction || introduction.length < 50) {
      issues.push({
        type: "weak-conclusion",
        severity: "warning",
        location: "introduction",
        message: "Introduction is too short",
        suggestion: "Expand introduction to provide better context",
        autoFixed: false,
      });
    }

    return issues;
  }

  /**
   * Check section for issues
   */
  private checkSection(section: WrittenSection): EditorialIssue[] {
    const issues: EditorialIssue[] = [];
    const content = section.content;

    // Check for AI phrases
    for (const phrase of this.aiPhrases) {
      if (content.toLowerCase().includes(phrase.toLowerCase())) {
        issues.push({
          type: "ai-phrase",
          severity: "critical",
          location: section.type,
          message: `Contains AI phrase: "${phrase}"`,
          suggestion: `Remove "${phrase}" and write a natural transition`,
          autoFixed: true,
        });
      }
    }

    // Check for filler words
    for (const filler of this.fillerWords) {
      const regex = new RegExp(`\\b${filler}\\b`, "gi");
      if (regex.test(content)) {
        issues.push({
          type: "filler",
          severity: "warning",
          location: section.type,
          message: `Contains filler word: "${filler}"`,
          suggestion: `Remove "${filler}" for more direct writing`,
          autoFixed: true,
        });
      }
    }

    // Check for wall of text
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 5 && !content.includes("\n")) {
      issues.push({
        type: "wall-of-text",
        severity: "warning",
        location: section.type,
        message: "Wall of text detected",
        suggestion: "Break into shorter paragraphs or add visual components",
        autoFixed: false,
      });
    }

    // Check for repetition
    const words = content.toLowerCase().split(/\s+/);
    const wordCounts = new Map<string, number>();
    for (const word of words) {
      if (word.length > 4) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }

    for (const [word, count] of wordCounts) {
      if (count > 3) {
        issues.push({
          type: "repetition",
          severity: "warning",
          location: section.type,
          message: `Word repeated: "${word}" (${count} times)`,
          suggestion: "Use synonyms or restructure to avoid repetition",
          autoFixed: false,
        });
      }
    }

    // Check for missing examples in certain sections
    const needsExample = ["how-it-works", "applications", "benefits", "example"];
    if (needsExample.includes(section.type) && content.length < 100) {
      issues.push({
        type: "missing-example",
        severity: "warning",
        location: section.type,
        message: "Section lacks practical example",
        suggestion: "Add a concrete example to improve understanding",
        autoFixed: false,
      });
    }

    return issues;
  }

  /**
   * Check conclusion for issues
   */
  private checkConclusion(conclusion: string): EditorialIssue[] {
    const issues: EditorialIssue[] = [];

    if (!conclusion || conclusion.length < 30) {
      issues.push({
        type: "weak-conclusion",
        severity: "warning",
        location: "conclusion",
        message: "Conclusion is too short",
        suggestion: "Expand conclusion to provide better closure",
        autoFixed: false,
      });
    }

    // Check for generic conclusion phrases
    const genericPhrases = [
      "In conclusion",
      "To summarize",
      "In summary",
      "To wrap up",
    ];

    for (const phrase of genericPhrases) {
      if (conclusion.toLowerCase().includes(phrase.toLowerCase())) {
        issues.push({
          type: "weak-conclusion",
          severity: "warning",
          location: "conclusion",
          message: `Generic conclusion phrase: "${phrase}"`,
          suggestion: "Write a more natural, specific conclusion",
          autoFixed: true,
        });
      }
    }

    return issues;
  }

  /**
   * Auto-fix issues that can be automatically corrected
   */
  private autoFixIssues(document: WrittenDocument, issues: EditorialIssue[]): {
    fixedDocument: WrittenDocument;
    fixedCount: number;
  } {
    let fixedCount = 0;
    const fixedDocument = { ...document };

    // Fix introduction
    for (const issue of issues) {
      if (issue.location === "introduction" && issue.autoFixed) {
        fixedDocument.introduction = this.fixText(fixedDocument.introduction, issue);
        fixedCount++;
      }
    }

    // Fix sections
    for (const issue of issues) {
      if (issue.location !== "introduction" && issue.location !== "conclusion" && issue.autoFixed) {
        const sectionIndex = fixedDocument.sections.findIndex(s => s.type === issue.location);
        if (sectionIndex !== -1) {
          fixedDocument.sections[sectionIndex].content = this.fixText(
            fixedDocument.sections[sectionIndex].content,
            issue
          );
          fixedCount++;
        }
      }
    }

    // Fix conclusion
    for (const issue of issues) {
      if (issue.location === "conclusion" && issue.autoFixed) {
        fixedDocument.conclusion = this.fixText(fixedDocument.conclusion, issue);
        fixedCount++;
      }
    }

    return { fixedDocument, fixedCount };
  }

  /**
   * Fix text based on issue type
   */
  private fixText(text: string, issue: EditorialIssue): string {
    if (issue.type === "ai-phrase") {
      return text.replace(new RegExp(issue.message.match(/"([^"]+)"/)?.[1] || "", "gi"), "");
    }

    if (issue.type === "filler") {
      return text.replace(new RegExp(issue.message.match(/"([^"]+)"/)?.[1] || "", "gi"), "");
    }

    if (issue.type === "weak-conclusion") {
      return text.replace(new RegExp(issue.message.match(/"([^"]+)"/)?.[1] || "", "gi"), "");
    }

    return text;
  }

  /**
   * Calculate quality score based on issues
   */
  private calculateQualityScore(issues: EditorialIssue[], fixedCount: number): number {
    const totalIssues = issues.length;
    if (totalIssues === 0) return 100;

    const criticalIssues = issues.filter(i => i.severity === "critical").length;
    const warningIssues = issues.filter(i => i.severity === "warning").length;

    // Deduct points for issues
    let score = 100;
    score -= criticalIssues * 10;
    score -= warningIssues * 5;

    // Add points back for auto-fixed issues
    score += fixedCount * 3;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determine if document passes editorial
   */
  private determinePassStatus(issues: EditorialIssue[], qualityScore: number): boolean {
    const criticalIssues = issues.filter(i => i.severity === "critical");
    const remainingCritical = criticalIssues.filter(i => !i.autoFixed);

    // Must have no remaining critical issues
    if (remainingCritical.length > 0) {
      return false;
    }

    // Must have quality score of at least 80
    if (qualityScore < 80) {
      return false;
    }

    return true;
  }
}
