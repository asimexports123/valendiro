/**
 * Explanation Engine
 *
 * Contextualizes facts to ensure every statement answers:
 * - What? (definition)
 * - Why? (importance/reasoning)
 * - How? (mechanism/process)
 * - When? (timing/conditions)
 * - Where? (context/scope)
 * - Why does it matter? (impact/consequence)
 * - What happens if ignored? (risk/implication)
 *
 * Never present isolated facts. Every fact must have explanatory context.
 */

import type { PluginFact } from "../types";

export interface ExplainedFact {
  original: PluginFact;
  explanation: string;
  questionsAnswered: string[];
}

export interface CompositionContext {
  facts: PluginFact[];
  config: any;
  subject: string;
  intent: "inform" | "educate" | "guide" | "decide";
  complexity: "beginner" | "intermediate" | "advanced";
}

export class ExplanationEngine {
  /**
   * Explain facts by adding contextual information
   */
  explainFacts(facts: PluginFact[], context: CompositionContext): ExplainedFact[] {
    return facts.map((fact) => this.explainFact(fact, context));
  }

  /**
   * Explain a single fact by analyzing its content and adding context
   */
  private explainFact(fact: PluginFact, context: CompositionContext): ExplainedFact {
    const explained: ExplainedFact = {
      original: fact,
      explanation: "",
      questionsAnswered: [],
    };

    // Analyze the fact to determine what explanations are needed
    const analysis = this.analyzeFact(fact);
    
    // Generate explanations based on analysis
    if (analysis.needsWhatExplanation) {
      explained.explanation += this.generateWhatExplanation(fact, context);
      explained.questionsAnswered.push("What?");
    }
    
    if (analysis.needsWhyExplanation) {
      explained.explanation += " " + this.generateWhyExplanation(fact, context);
      explained.questionsAnswered.push("Why?");
    }
    
    if (analysis.needsHowExplanation) {
      explained.explanation += " " + this.generateHowExplanation(fact, context);
      explained.questionsAnswered.push("How?");
    }
    
    if (analysis.needsWhenExplanation) {
      explained.explanation += " " + this.generateWhenExplanation(fact, context);
      explained.questionsAnswered.push("When?");
    }
    
    if (analysis.needsImportanceExplanation) {
      explained.explanation += " " + this.generateImportanceExplanation(fact, context);
      explained.questionsAnswered.push("Why does it matter?");
    }
    
    if (analysis.needsImplicationExplanation) {
      explained.explanation += " " + this.generateImplicationExplanation(fact, context);
      explained.questionsAnswered.push("What happens if ignored?");
    }

    return explained;
  }

  /**
   * Analyze a fact to determine what explanations are needed
   */
  private analyzeFact(fact: PluginFact): FactAnalysis {
    const statement = fact.statement.toLowerCase();
    const analysis: FactAnalysis = {
      needsWhatExplanation: true,
      needsWhyExplanation: false,
      needsHowExplanation: false,
      needsWhenExplanation: false,
      needsImportanceExplanation: false,
      needsImplicationExplanation: false,
    };

    // Detect fact types based on content
    if (statement.includes("because") || statement.includes("since") || statement.includes("due to")) {
      analysis.needsWhyExplanation = true;
    }
    
    if (statement.includes("how") || statement.includes("process") || statement.includes("step") || 
        statement.includes("method") || statement.includes("technique")) {
      analysis.needsHowExplanation = true;
    }
    
    if (statement.includes("when") || statement.includes("before") || statement.includes("after") ||
        statement.includes("during") || statement.includes("while")) {
      analysis.needsWhenExplanation = true;
    }
    
    if (statement.includes("important") || statement.includes("critical") || statement.includes("essential") ||
        statement.includes("must") || statement.includes("should") || statement.includes("rule")) {
      analysis.needsImportanceExplanation = true;
    }
    
    if (statement.includes("risk") || statement.includes("danger") || statement.includes("warning") ||
        statement.includes("avoid") || statement.includes("never") || statement.includes("failure")) {
      analysis.needsImplicationExplanation = true;
    }

    // Rule-type facts always need importance and implication
    if (fact.factType === "rule") {
      analysis.needsImportanceExplanation = true;
      analysis.needsImplicationExplanation = true;
    }

    // Warning-type facts always need implication
    if (fact.factType === "warning") {
      analysis.needsImplicationExplanation = true;
    }

    return analysis;
  }

  /**
   * Generate "What" explanation - defines the concept
   */
  private generateWhatExplanation(fact: PluginFact, context: CompositionContext): string {
    // For definitions, the statement itself is the "what"
    if (fact.factType === "definition") {
      return fact.statement;
    }

    // For other types, add clarifying context
    const subject = context.subject;
    return `In the context of ${subject}, this means ${fact.statement.toLowerCase()}.`;
  }

  /**
   * Generate "Why" explanation - explains the reasoning
   */
  private generateWhyExplanation(fact: PluginFact, context: CompositionContext): string {
    const templates = [
      `This matters because ${this.extractReason(fact.statement)}.`,
      `The reason this is important is ${this.extractReason(fact.statement)}.`,
      `This exists because ${this.extractReason(fact.statement)}.`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Generate "How" explanation - explains the mechanism
   */
  private generateHowExplanation(fact: PluginFact, context: CompositionContext): string {
    const templates = [
      `This works by ${this.extractMechanism(fact.statement)}.`,
      `The mechanism involves ${this.extractMechanism(fact.statement)}.`,
      `This operates through ${this.extractMechanism(fact.statement)}.`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Generate "When" explanation - explains timing/conditions
   */
  private generateWhenExplanation(fact: PluginFact, context: CompositionContext): string {
    const templates = [
      `This applies when ${this.extractCondition(fact.statement)}.`,
      `Use this when ${this.extractCondition(fact.statement)}.`,
      `This is relevant when ${this.extractCondition(fact.statement)}.`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Generate importance explanation - why it matters
   */
  private generateImportanceExplanation(fact: PluginFact, context: CompositionContext): string {
    const templates = [
      `This is critical because ${this.extractImportance(fact.statement)}.`,
      `Ignoring this can lead to problems because ${this.extractImportance(fact.statement)}.`,
      `This is essential for success because ${this.extractImportance(fact.statement)}.`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Generate implication explanation - what happens if ignored
   */
  private generateImplicationExplanation(fact: PluginFact, context: CompositionContext): string {
    const templates = [
      `If you ignore this, ${this.extractConsequence(fact.statement)}.`,
      `Failure to follow this can result in ${this.extractConsequence(fact.statement)}.`,
      `Overlooking this leads to ${this.extractConsequence(fact.statement)}.`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Extract reasoning from a statement
   */
  private extractReason(statement: string): string {
    const lower = statement.toLowerCase();
    
    // Look for causal indicators
    const becauseMatch = lower.match(/because\s+(.+)/);
    if (becauseMatch) return becauseMatch[1];
    
    const sinceMatch = lower.match(/since\s+(.+)/);
    if (sinceMatch) return sinceMatch[1];
    
    const dueToMatch = lower.match(/due to\s+(.+)/);
    if (dueToMatch) return dueToMatch[1];

    // Default: return the statement itself
    return statement.toLowerCase();
  }

  /**
   * Extract mechanism from a statement
   */
  private extractMechanism(statement: string): string {
    const lower = statement.toLowerCase();
    
    // Look for process indicators
    const byMatch = lower.match(/by\s+(.+)/);
    if (byMatch) return byMatch[1];
    
    const throughMatch = lower.match(/through\s+(.+)/);
    if (throughMatch) return throughMatch[1];
    
    const viaMatch = lower.match(/via\s+(.+)/);
    if (viaMatch) return viaMatch[1];

    return statement.toLowerCase();
  }

  /**
   * Extract condition from a statement
   */
  private extractCondition(statement: string): string {
    const lower = statement.toLowerCase();
    
    const whenMatch = lower.match(/when\s+(.+)/);
    if (whenMatch) return whenMatch[1];
    
    const beforeMatch = lower.match(/before\s+(.+)/);
    if (beforeMatch) return beforeMatch[1];
    
    const afterMatch = lower.match(/after\s+(.+)/);
    if (afterMatch) return afterMatch[1];

    return statement.toLowerCase();
  }

  /**
   * Extract importance from a statement
   */
  private extractImportance(statement: string): string {
    const lower = statement.toLowerCase();
    
    // Look for importance indicators
    const importantMatch = lower.match(/important\s+(?:because|as|for)\s*(.+)/);
    if (importantMatch) return importantMatch[1];
    
    const criticalMatch = lower.match(/critical\s+(?:because|as|for)\s*(.+)/);
    if (criticalMatch) return criticalMatch[1];

    return statement.toLowerCase();
  }

  /**
   * Extract consequence from a statement
   */
  private extractConsequence(statement: string): string {
    const lower = statement.toLowerCase();
    
    const riskMatch = lower.match(/risk\s+(?:of\s+)?(.+)/);
    if (riskMatch) return riskMatch[1];
    
    const dangerMatch = lower.match(/danger\s+(?:of\s+)?(.+)/);
    if (dangerMatch) return dangerMatch[1];
    
    const failMatch = lower.match(/fail(?:ure)?\s+(?:to\s+)?(.+)/);
    if (failMatch) return failMatch[1];

    return statement.toLowerCase();
  }
}

interface FactAnalysis {
  needsWhatExplanation: boolean;
  needsWhyExplanation: boolean;
  needsHowExplanation: boolean;
  needsWhenExplanation: boolean;
  needsImportanceExplanation: boolean;
  needsImplicationExplanation: boolean;
}
