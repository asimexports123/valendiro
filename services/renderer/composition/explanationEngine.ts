/**
 * Explanation Engine
 *
 * Adds minimal teaching context without wrapping facts in generic AI filler.
 * Prefer the source statement; append implication language only when missing.
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
  explainFacts(facts: PluginFact[], context: CompositionContext): ExplainedFact[] {
    return facts.map((fact) => this.explainFact(fact, context));
  }

  private explainFact(fact: PluginFact, _context: CompositionContext): ExplainedFact {
    const explained: ExplainedFact = {
      original: fact,
      explanation: fact.statement,
      questionsAnswered: ["What?"],
    };

    // Definitions and properties stand alone — no wrapper templates
    if (fact.factType === "definition" || fact.factType === "property") {
      return explained;
    }

    const analysis = this.analyzeFact(fact);

    if (
      analysis.needsImplicationExplanation &&
      !/\b(if ignored|leads to|results in|can cause|risk|failure)\b/i.test(fact.statement)
    ) {
      const consequence = this.extractConsequence(fact.statement);
      if (consequence && consequence !== fact.statement.toLowerCase()) {
        explained.explanation = `${fact.statement} Ignoring this often leads to ${consequence}.`;
        explained.questionsAnswered.push("What happens if ignored?");
      }
    }

    return explained;
  }

  private analyzeFact(fact: PluginFact): FactAnalysis {
    const statement = fact.statement.toLowerCase();
    const analysis: FactAnalysis = {
      needsImplicationExplanation: false,
    };

    if (
      statement.includes("risk") ||
      statement.includes("danger") ||
      statement.includes("warning") ||
      statement.includes("avoid") ||
      statement.includes("never") ||
      statement.includes("failure")
    ) {
      analysis.needsImplicationExplanation = true;
    }

    if (fact.factType === "rule" || fact.factType === "warning") {
      analysis.needsImplicationExplanation = true;
    }

    return analysis;
  }

  private extractConsequence(statement: string): string {
    const lower = statement.toLowerCase();

    const riskMatch = lower.match(/risk\s+(?:of\s+)?(.+)/);
    if (riskMatch) return riskMatch[1];

    const dangerMatch = lower.match(/danger\s+(?:of\s+)?(.+)/);
    if (dangerMatch) return dangerMatch[1];

    const failMatch = lower.match(/fail(?:ure)?\s+(?:to\s+)?(.+)/);
    if (failMatch) return failMatch[1];

    const avoidMatch = lower.match(/avoid\s+(.+)/);
    if (avoidMatch) return avoidMatch[1];

    return statement.toLowerCase();
  }
}

interface FactAnalysis {
  needsImplicationExplanation: boolean;
}
