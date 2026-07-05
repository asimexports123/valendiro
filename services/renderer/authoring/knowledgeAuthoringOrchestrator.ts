/**
 * Knowledge Authoring Orchestrator
 *
 * Integrates all 8 modules into a complete knowledge authoring pipeline.
 *
 * Pipeline:
 * 1. Reader Psychology Engine - Answer questions before reader asks
 * 2. Narrative Planning Engine - Decide learning journey
 * 3. Knowledge Gap Completion Engine - Fill missing information
 * 4. Category Personality System - Different writing strategies
 * 5. Writing Engine - Human expert style, no templates
 * 6. Visual Intelligence - Decision-based visuals
 * 7. Editorial Pass - Auto-check quality issues
 * 8. Final Acceptance Test - 5 question gate before publishing
 *
 * Core Philosophy:
 * - Never ask "What facts do I have?"
 * - Always ask "What does the reader still need?"
 * - Facts are input, reader understanding is output
 */

import type { PluginFact, KnowledgePackage } from "../types";
import { ReaderPsychologyEngine, type ReaderQuestion } from "./readerPsychologyEngine";
import { NarrativePlanningEngine, type NarrativePlan, type NarrativeSection } from "./narrativePlanningEngine";
import { KnowledgeGapCompletionEngine, type GapCompletionResult } from "./knowledgeGapCompletionEngine";
import { CategoryPersonalitySystem, type StyledSection } from "./categoryPersonalitySystem";
import { WritingEngine, type WrittenDocument } from "./writingEngine";
import { VisualIntelligenceEngine, type VisualPlan } from "./visualIntelligenceEngine";
import { EditorialPassEngine, type EditorialResult } from "./editorialPassEngine";
import { FinalAcceptanceTestEngine, type AcceptanceTestResult } from "./finalAcceptanceTestEngine";

/**
 * Phase 30.4: Updated AuthoringContext to consume structured Knowledge Packages
 * The Knowledge Authoring Engine now consumes structured collections instead of paragraph-oriented inputs.
 * knowledgePackage is optional for backward compatibility during migration.
 */
export interface AuthoringContext {
  topic: string;
  subject: string;
  category: string;
  intent: "inform" | "educate" | "guide" | "decide";
  complexity: "beginner" | "intermediate" | "advanced";
  // Phase 30.4: Consume structured Knowledge Package (optional for backward compatibility)
  knowledgePackage?: KnowledgePackage;
  // Legacy facts for backward compatibility during migration
  facts: PluginFact[];
}

export interface AuthoringResult {
  document: WrittenDocument;
  readerQuestions: ReaderQuestion[];
  narrativePlan: NarrativePlan;
  gapCompletion: GapCompletionResult;
  visualPlan: VisualPlan;
  editorialResult: EditorialResult;
  acceptanceTest: AcceptanceTestResult;
  passesAllChecks: boolean;
  recommendation: "publish" | "revise" | "reject";
}

/**
 * Phase 30.4: Extract structured content from Knowledge Package for authoring
 * Converts structured collections into authoring-friendly format
 */
export function extractStructuredContent(pkg: KnowledgePackage) {
  return {
    definitions: pkg.definitions.map(d => ({
      term: d.term,
      definition: d.definition,
      context: d.context,
      confidence: d.confidence,
    })),
    concepts: pkg.concepts.map(c => ({
      name: c.name,
      description: c.description,
      category: c.category,
      confidence: c.confidence,
    })),
    procedures: pkg.procedures.map(p => ({
      name: p.name,
      steps: p.steps,
      prerequisites: p.prerequisites,
      confidence: p.confidence,
    })),
    examples: pkg.examples.map(e => ({
      title: e.title,
      description: e.description,
      code: e.code,
      output: e.output,
      confidence: e.confidence,
    })),
    comparisons: pkg.comparisons.map(c => ({
      items: c.items,
      criteria: c.criteria,
      confidence: c.confidence,
    })),
    commands: pkg.commands.map(c => ({
      command: c.command,
      description: c.description,
      parameters: c.parameters,
      confidence: c.confidence,
    })),
    formulae: pkg.formulae.map(f => ({
      name: f.name,
      formula: f.formula,
      description: f.description,
      variables: f.variables,
      confidence: f.confidence,
    })),
    warnings: pkg.warnings.map(w => ({
      title: w.title,
      description: w.description,
      severity: w.severity,
    })),
    bestPractices: pkg.bestPractices.map(bp => ({
      title: bp.title,
      description: bp.description,
      confidence: bp.confidence,
    })),
    commonMistakes: pkg.commonMistakes.map(cm => ({
      mistake: cm.mistake,
      correction: cm.correction,
      confidence: cm.confidence,
    })),
    faqs: pkg.faqs.map(f => ({
      question: f.question,
      answer: f.answer,
      confidence: f.confidence,
    })),
  };
}

export class KnowledgeAuthoringOrchestrator {
  private readerPsychology: ReaderPsychologyEngine | null = null;
  private narrativePlanning: NarrativePlanningEngine | null = null;
  private gapCompletion: KnowledgeGapCompletionEngine | null = null;
  private categoryPersonality: CategoryPersonalitySystem | null = null;
  private writing: WritingEngine | null = null;
  private visualIntelligence: VisualIntelligenceEngine | null = null;
  private editorialPass: EditorialPassEngine | null = null;
  private acceptanceTest: FinalAcceptanceTestEngine | null = null;

  constructor() {
    // Lazy initialization - engines created only when needed
  }

  private getReaderPsychology(): ReaderPsychologyEngine {
    if (!this.readerPsychology) {
      this.readerPsychology = new ReaderPsychologyEngine();
    }
    return this.readerPsychology;
  }

  private getNarrativePlanning(): NarrativePlanningEngine {
    if (!this.narrativePlanning) {
      this.narrativePlanning = new NarrativePlanningEngine();
    }
    return this.narrativePlanning;
  }

  private getGapCompletion(): KnowledgeGapCompletionEngine {
    if (!this.gapCompletion) {
      this.gapCompletion = new KnowledgeGapCompletionEngine();
    }
    return this.gapCompletion;
  }

  private getCategoryPersonality(): CategoryPersonalitySystem {
    if (!this.categoryPersonality) {
      this.categoryPersonality = new CategoryPersonalitySystem();
    }
    return this.categoryPersonality;
  }

  private getWriting(): WritingEngine {
    if (!this.writing) {
      this.writing = new WritingEngine();
    }
    return this.writing;
  }

  private getVisualIntelligence(): VisualIntelligenceEngine {
    if (!this.visualIntelligence) {
      this.visualIntelligence = new VisualIntelligenceEngine();
    }
    return this.visualIntelligence;
  }

  private getEditorialPass(): EditorialPassEngine {
    if (!this.editorialPass) {
      this.editorialPass = new EditorialPassEngine();
    }
    return this.editorialPass;
  }

  private getAcceptanceTest(): FinalAcceptanceTestEngine {
    if (!this.acceptanceTest) {
      this.acceptanceTest = new FinalAcceptanceTestEngine();
    }
    return this.acceptanceTest;
  }

  /**
   * Main entry point - author a complete document
   */
  async authorDocument(context: AuthoringContext): Promise<AuthoringResult> {
    console.log(`[Knowledge Authoring Engine] Starting authoring for: ${context.topic}`);

    // Stage 1: Reader Psychology - Answer questions before reader asks
    console.log("[Stage 1] Reader Psychology Engine...");
    const readerQuestions = this.getReaderPsychology().generateReaderQuestions(context);
    const questionsToAnswer = this.getReaderPsychology().getQuestionsToAnswer(readerQuestions);
    console.log(`  Generated ${readerQuestions.length} reader questions`);

    // Stage 2: Narrative Planning - Decide learning journey
    console.log("[Stage 2] Narrative Planning Engine...");
    const narrativeContext = {
      ...context,
      readerQuestions: questionsToAnswer,
    };
    const narrativePlan = this.getNarrativePlanning().createNarrativePlan(narrativeContext);
    console.log(`  Created narrative plan with ${narrativePlan.sections.length} sections`);

    // Stage 3: Knowledge Gap Completion - Fill missing information
    console.log("[Stage 3] Knowledge Gap Completion Engine...");
    const gapContext = {
      topic: context.topic,
      category: context.category,
      intent: context.intent,
      complexity: context.complexity,
      existingFacts: context.facts,
      narrativeSections: narrativePlan.sections,
      readerQuestions: questionsToAnswer,
    };
    const gapCompletion = this.getGapCompletion().completeGaps(gapContext);
    console.log(`  Identified ${gapCompletion.gaps.length} gaps, filled ${gapCompletion.filledGacts.length}`);
    console.log(`  Reader readiness score: ${gapCompletion.readerReadinessScore}/100`);

    // Merge gap-filled facts with original facts
    const enrichedFacts = [...context.facts, ...gapCompletion.filledGacts];

    // Re-run narrative planning with enriched facts
    const enrichedContext = { ...context, facts: enrichedFacts, readerQuestions: questionsToAnswer };
    const updatedNarrativePlan = this.getNarrativePlanning().createNarrativePlan(enrichedContext);

    // Stage 4: Category Personality - Different writing strategies
    console.log("[Stage 4] Category Personality System...");
    const personalityContext = {
      category: context.category,
      subject: context.subject,
      intent: context.intent,
      complexity: context.complexity,
      sections: updatedNarrativePlan.sections,
    };
    const styledSections = this.getCategoryPersonality().applyPersonalityToSections(personalityContext);
    console.log(`  Applied ${context.category} personality to ${styledSections.length} sections`);

    // Stage 5: Writing - Human expert style, no templates
    console.log("[Stage 5] Writing Engine...");
    const writingContext = {
      topic: context.topic,
      category: context.category,
      intent: context.intent,
      complexity: context.complexity,
      styledSections,
      readerQuestions: questionsToAnswer,
    };
    const document = this.getWriting().compose(writingContext);
    console.log(`  Composed document with ${document.sections.length} sections`);

    // Stage 6: Visual Intelligence - Decision-based visuals
    console.log("[Stage 6] Visual Intelligence Engine...");
    const visualContext = {
      category: context.category,
      intent: context.intent,
      complexity: context.complexity,
      sections: updatedNarrativePlan.sections,
    };
    const visualPlan = this.getVisualIntelligence().createVisualPlan(visualContext);
    const visualDecisions = visualPlan.decisions.filter(d => d.shouldIncludeVisual);
    console.log(`  Decided on ${visualDecisions.length} visual components`);

    // Stage 7: Editorial Pass - Auto-check quality issues
    console.log("[Stage 7] Editorial Pass Engine...");
    const editorialResult = this.getEditorialPass().performEditorialPass(document);
    console.log(`  Found ${editorialResult.issues.length} issues, fixed ${editorialResult.fixedIssues}`);
    console.log(`  Quality score: ${editorialResult.qualityScore}/100`);
    console.log(`  Passes editorial: ${editorialResult.passesEditorial}`);

    // Stage 8: Final Acceptance Test - 5 question gate
    console.log("[Stage 8] Final Acceptance Test...");
    
    // Validate against subject-specific rules
    const subjectValidation = this.getNarrativePlanning().validateAgainstSubjectRules(context.subject, updatedNarrativePlan);
    console.log(`  Subject validation: ${subjectValidation.passes ? "PASSED" : "FAILED"}`);
    if (!subjectValidation.passes) {
      console.log(`  Violations: ${subjectValidation.violations.join(", ")}`);
    }
    
    const acceptanceTest = this.getAcceptanceTest().runAcceptanceTest(document, editorialResult, subjectValidation);
    console.log(`  All questions passed: ${acceptanceTest.allPassed}`);
    console.log(`  Overall confidence: ${acceptanceTest.overallConfidence}/100`);
    console.log(`  Recommendation: ${acceptanceTest.recommendation}`);

    // Final determination
    const passesAllChecks =
      editorialResult.passesEditorial &&
      acceptanceTest.allPassed &&
      acceptanceTest.recommendation === "publish";

    console.log(`[Knowledge Authoring Engine] Complete. Passes all checks: ${passesAllChecks}`);

    return {
      document: editorialResult.document,
      readerQuestions,
      narrativePlan: updatedNarrativePlan,
      gapCompletion,
      visualPlan,
      editorialResult,
      acceptanceTest,
      passesAllChecks,
      recommendation: acceptanceTest.recommendation,
    };
  }

  /**
   * Get diagnostic information for debugging
   */
  getDiagnostics(result: AuthoringResult): any {
    return {
      readerQuestions: {
        total: result.readerQuestions.length,
        answered: result.readerQuestions.filter(q => q.shouldAnswer).length,
      },
      narrativePlan: {
        sections: result.narrativePlan.sections.length,
        omittedFacts: result.narrativePlan.omittedFacts.length,
        emphasisPoints: result.narrativePlan.emphasisPoints.length,
      },
      gapCompletion: {
        gaps: result.gapCompletion.gaps.length,
        filled: result.gapCompletion.filledGacts.length,
        readinessScore: result.gapCompletion.readerReadinessScore,
      },
      visualPlan: {
        decisions: result.visualPlan.decisions.length,
        visualsIncluded: result.visualPlan.decisions.filter(d => d.shouldIncludeVisual).length,
      },
      editorialResult: {
        issues: result.editorialResult.issues.length,
        fixed: result.editorialResult.fixedIssues,
        qualityScore: result.editorialResult.qualityScore,
        passes: result.editorialResult.passesEditorial,
      },
      acceptanceTest: {
        allPassed: result.acceptanceTest.allPassed,
        confidence: result.acceptanceTest.overallConfidence,
        recommendation: result.acceptanceTest.recommendation,
      },
    };
  }
}
