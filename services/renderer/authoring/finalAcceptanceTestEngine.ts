/**
 * Final Acceptance Test Engine (Stage 11)
 *
 * Before any article is published, the engine should ask:
 *
 * 1. Could a beginner understand this? YES / NO
 * 2. Would an expert respect it? YES / NO
 * 3. Would the reader bookmark it? YES / NO
 * 4. Would the reader stop searching Google? YES / NO
 * 5. Does this actually solve the user's problem? YES / NO
 *
 * If any answer is NO, return to the editorial stage.
 *
 * Success Criteria:
 * - The reader should never think: "This was written by AI"
 * - Instead they should think: "This is surprisingly well explained"
 */

import type { WrittenDocument } from "./writingEngine";
import type { EditorialResult } from "./editorialPassEngine";
import type { NarrativePlan } from "./narrativePlanningEngine";
import type { ValidationResult } from "./narrativePlanningEngine";

export interface AcceptanceTestQuestion {
  question: string;
  answer: "YES" | "NO";
  confidence: number; // 0-100
  reasoning: string;
}

export interface AcceptanceTestResult {
  questions: AcceptanceTestQuestion[];
  allPassed: boolean;
  overallConfidence: number;
  recommendation: "publish" | "revise" | "reject";
  feedback: string[];
  subjectValidation?: ValidationResult;
}

export class FinalAcceptanceTestEngine {
  /**
   * Run the final acceptance test on the document
   */
  runAcceptanceTest(
    document: WrittenDocument,
    editorialResult: EditorialResult,
    subjectValidation?: ValidationResult
  ): AcceptanceTestResult {
    const questions: AcceptanceTestQuestion[] = [];

    // Question 1: Could a beginner understand this?
    questions.push(this.testBeginnerUnderstanding(document));

    // Question 2: Would an expert respect it?
    questions.push(this.testExpertRespect(document));

    // Question 3: Would the reader bookmark it?
    questions.push(this.testBookmarkability(document));

    // Question 4: Would the reader stop searching Google?
    questions.push(this.testSearchStoppage(document));

    // Question 5: Does this actually solve the user's problem?
    questions.push(this.testProblemSolving(document));

    // Subject validation check (if provided)
    let subjectValidationPassed = true;
    if (subjectValidation) {
      subjectValidationPassed = subjectValidation.passes;
      if (!subjectValidationPassed) {
        questions.push({
          question: "Does this meet subject-specific requirements?",
          answer: "NO",
          confidence: 0,
          reasoning: subjectValidation.violations.join("; "),
        });
      } else {
        questions.push({
          question: "Does this meet subject-specific requirements?",
          answer: "YES",
          confidence: 100,
          reasoning: "All subject requirements satisfied",
        });
      }
    }

    // Check if all passed
    const allPassed = questions.every(q => q.answer === "YES");

    // Calculate overall confidence
    const overallConfidence = Math.round(
      questions.reduce((sum, q) => sum + q.confidence, 0) / questions.length
    );

    // Generate recommendation
    const recommendation = this.generateRecommendation(allPassed, overallConfidence, editorialResult, subjectValidationPassed);

    // Generate feedback
    const feedback = this.generateFeedback(questions, recommendation, subjectValidation);

    return {
      questions,
      allPassed,
      overallConfidence,
      recommendation,
      feedback,
      subjectValidation,
    };
  }

  /**
   * Test 1: Could a beginner understand this?
   */
  private testBeginnerUnderstanding(document: WrittenDocument): AcceptanceTestQuestion {
    const { introduction, sections, conclusion } = document;

    let score = 70; // Base score
    const checks: string[] = [];

    // Check introduction clarity
    if (introduction.length > 100 && introduction.length < 500) {
      score += 10;
      checks.push("Introduction length appropriate");
    }

    // Check for jargon
    const jargonWords = ["paradigm", "methodology", "implementation", "architectural"];
    const hasJargon = jargonWords.some(word =>
      introduction.toLowerCase().includes(word) ||
      sections.some(s => s.content.toLowerCase().includes(word))
    );
    if (!hasJargon) {
      score += 10;
      checks.push("No excessive jargon");
    }

    // Check section clarity
    const avgSectionLength = sections.reduce((sum, s) => sum + s.content.length, 0) / sections.length;
    if (avgSectionLength > 100 && avgSectionLength < 1000) {
      score += 10;
      checks.push("Section lengths appropriate");
    }

    const answer = score >= 80 ? "YES" : "NO";

    return {
      question: "Could a beginner understand this?",
      answer,
      confidence: score,
      reasoning: checks.join("; ") || "Standard clarity",
    };
  }

  /**
   * Test 2: Would an expert respect it?
   */
  private testExpertRespect(document: WrittenDocument): AcceptanceTestQuestion {
    const { sections } = document;

    let score = 70;
    const checks: string[] = [];

    // Check for depth
    const totalLength = sections.reduce((sum, s) => sum + s.content.length, 0);
    if (totalLength > 1000) {
      score += 15;
      checks.push("Sufficient depth");
    }

    // Check for accuracy indicators
    const hasSpecifics = sections.some(s =>
      s.content.includes("specific") ||
      s.content.includes("example") ||
      s.content.match(/\d+/)
    );
    if (hasSpecifics) {
      score += 15;
      checks.push("Contains specific examples");
    }

    const answer = score >= 80 ? "YES" : "NO";

    return {
      question: "Would an expert respect it?",
      answer,
      confidence: score,
      reasoning: checks.join("; ") || "Standard quality",
    };
  }

  /**
   * Test 3: Would the reader bookmark it?
   */
  private testBookmarkability(document: WrittenDocument): AcceptanceTestQuestion {
    const { sections, conclusion } = document;

    let score = 70;
    const checks: string[] = [];

    // Check for actionable content
    const hasActionable = sections.some(s =>
      s.content.includes("should") ||
      s.content.includes("can") ||
      s.content.includes("step") ||
      s.content.includes("how to")
    );
    if (hasActionable) {
      score += 15;
      checks.push("Contains actionable information");
    }

    // Check for reference value
    const hasReference = sections.some(s =>
      s.type === "summary" ||
      s.type === "best-practices" ||
      s.type === "checklist"
    );
    if (hasReference) {
      score += 15;
      checks.push("Has reference value");
    }

    const answer = score >= 80 ? "YES" : "NO";

    return {
      question: "Would the reader bookmark it?",
      answer,
      confidence: score,
      reasoning: checks.join("; ") || "Standard value",
    };
  }

  /**
   * Test 4: Would the reader stop searching Google?
   */
  private testSearchStoppage(document: WrittenDocument): AcceptanceTestQuestion {
    const { sections } = document;

    let score = 70;
    const checks: string[] = [];

    // Check for completeness
    const hasDefinition = sections.some(s => s.type === "definition" || s.type === "introduction");
    const hasHowTo = sections.some(s => s.type === "how-it-works" || s.type === "applications");
    const hasExamples = sections.some(s => s.type === "example");

    if (hasDefinition && hasHowTo && hasExamples) {
      score += 15;
      checks.push("Covers definition, how-to, and examples");
    }

    // Check for comprehensiveness
    if (sections.length >= 6) {
      score += 15;
      checks.push("Comprehensive coverage");
    }

    const answer = score >= 80 ? "YES" : "NO";

    return {
      question: "Would the reader stop searching Google?",
      answer,
      confidence: score,
      reasoning: checks.join("; ") || "Standard completeness",
    };
  }

  /**
   * Test 5: Does this actually solve the user's problem?
   */
  private testProblemSolving(document: WrittenDocument): AcceptanceTestQuestion {
    const { sections } = document;

    let score = 70;
    const checks: string[] = [];

    // Check for practical solutions
    const hasSolutions = sections.some(s =>
      s.content.includes("solution") ||
      s.content.includes("fix") ||
      s.content.includes("resolve") ||
      s.content.includes("address")
    );
    if (hasSolutions) {
      score += 15;
      checks.push("Contains practical solutions");
    }

    // Check for clear guidance
    const hasGuidance = sections.some(s =>
      s.type === "how-it-works" ||
      s.type === "best-practices" ||
      s.type === "guide"
    );
    if (hasGuidance) {
      score += 15;
      checks.push("Provides clear guidance");
    }

    const answer = score >= 80 ? "YES" : "NO";

    return {
      question: "Does this actually solve the user's problem?",
      answer,
      confidence: score,
      reasoning: checks.join("; ") || "Standard problem-solving",
    };
  }

  /**
   * Generate recommendation based on test results
   */
  private generateRecommendation(
    allPassed: boolean,
    overallConfidence: number,
    editorialResult: EditorialResult,
    subjectValidationPassed: boolean
  ): "publish" | "revise" | "reject" {
    if (allPassed && overallConfidence >= 85 && editorialResult.passesEditorial && subjectValidationPassed) {
      return "publish";
    }

    if (overallConfidence >= 70 && editorialResult.qualityScore >= 70 && subjectValidationPassed) {
      return "revise";
    }

    return "reject";
  }

  /**
   * Generate feedback for improvement
   */
  private generateFeedback(
    questions: AcceptanceTestQuestion[],
    recommendation: string,
    subjectValidation?: ValidationResult
  ): string[] {
    const feedback: string[] = [];

    for (const question of questions) {
      if (question.answer === "NO") {
        feedback.push(`Failed: ${question.question} - ${question.reasoning}`);
      }
    }

    if (subjectValidation && !subjectValidation.passes) {
      feedback.push("Subject validation failed:");
      for (const violation of subjectValidation.violations) {
        feedback.push(`  - ${violation}`);
      }
    }

    if (recommendation === "publish") {
      feedback.push("Document passes all acceptance criteria");
    } else if (recommendation === "revise") {
      feedback.push("Document needs minor revisions before publishing");
    } else {
      feedback.push("Document requires significant improvements");
    }

    return feedback;
  }
}
