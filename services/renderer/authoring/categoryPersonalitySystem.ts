/**
 * Category Personality System (Stage 9)
 *
 * Each category should have its own writing strategy.
 * Every category should feel different.
 *
 * Technology: Clear, Technical, Example-driven
 * Business: Strategic, Decision-oriented
 * Finance: Risk, Trade-offs
 * Travel: Storytelling, Experience, Planning
 * Health: Calm, Responsible, Evidence-first
 * Home: Practical, Friendly
 * Education: Teaching
 */

import type { PluginFact } from "../types";
import type { NarrativeSection } from "./narrativePlanningEngine";
import type { ReaderQuestion } from "./readerPsychologyEngine";

export interface CategoryPersonalityContext {
  category: string;
  intent: "inform" | "educate" | "guide" | "decide";
  complexity: "beginner" | "intermediate" | "advanced";
  sections: NarrativeSection[];
}

export interface CategoryPersonality {
  voice: string;
  style: string;
  transitionStyle: string;
  exampleStyle: string;
  emphasisStyle: string;
  visualPreference: string[];
  sentenceStructure: string;
  tone: string;
}

export interface StyledSection {
  section: NarrativeSection;
  personality: CategoryPersonality;
  suggestedTransitions: string[];
  suggestedEmphasis: string[];
}

export class CategoryPersonalitySystem {
  /**
   * Get the personality profile for a category
   */
  getCategoryPersonality(category: string, intent: string): CategoryPersonality {
    const personalities: Record<string, CategoryPersonality> = {
      technology: {
        voice: "Clear and direct",
        style: "Technical precision with practical examples",
        transitionStyle: "Functional, minimal filler",
        exampleStyle: "Code-first, terminal output, real API calls",
        emphasisStyle: "Emphasize practical application and syntax",
        visualPreference: ["code-block", "architecture-diagram", "terminal-output"],
        sentenceStructure: "Concise, declarative, action-oriented",
        tone: "Professional but accessible",
      },
      business: {
        voice: "Strategic and decision-oriented",
        style: "ROI-focused, trade-off aware",
        transitionStyle: "Business logic flow",
        exampleStyle: "Case studies, ROI calculations, decision frameworks",
        emphasisStyle: "Emphasize business impact and risk assessment",
        visualPreference: ["decision-matrix", "roi-table", "comparison-table"],
        sentenceStructure: "Causal, outcome-focused",
        tone: "Professional, authoritative",
      },
      finance: {
        voice: "Cautious and risk-aware",
        style: "Trade-off focused, numbers-driven",
        transitionStyle: "Risk/benefit flow",
        exampleStyle: "Real calculations, portfolio scenarios, tax examples",
        emphasisStyle: "Emphasize risk management and long-term impact",
        visualPreference: ["comparison-table", "risk-matrix", "calculation"],
        sentenceStructure: "Conditional, analytical",
        tone: "Responsible, consultative",
      },
      travel: {
        voice: "Storytelling and experiential",
        style: "Planning-oriented, practical",
        transitionStyle: "Journey flow",
        exampleStyle: "Real itineraries, cost breakdowns, time estimates",
        emphasisStyle: "Emphasize practical logistics and safety",
        visualPreference: ["timeline", "checklist", "map", "cost-breakdown"],
        sentenceStructure: "Narrative, descriptive",
        tone: "Enthusiastic, helpful",
      },
      health: {
        voice: "Calm and responsible",
        style: "Evidence-first, cautious",
        transitionStyle: "Gentle, supportive",
        exampleStyle: "Real scenarios, dosage examples, symptom timelines",
        emphasisStyle: "Emphasize safety and evidence",
        visualPreference: ["timeline", "checklist", "dosage-table", "warning-box"],
        sentenceStructure: "Cautious, consultative",
        tone: "Reassuring, authoritative",
      },
      home: {
        voice: "Practical and friendly",
        style: "Step-by-step, accessible",
        transitionStyle: "Process flow",
        exampleStyle: "Real workflows, supply lists, time estimates",
        emphasisStyle: "Emphasize feasibility and safety",
        visualPreference: ["checklist", "supply-list", "time-estimate", "process-flow"],
        sentenceStructure: "Instructional, supportive",
        tone: "Friendly, encouraging",
      },
      education: {
        voice: "Teaching-focused",
        style: "Concept-first, then application",
        transitionStyle: "Learning progression",
        exampleStyle: "Analogies, then real applications",
        emphasisStyle: "Emphasize understanding and practice",
        visualPreference: ["framework", "concept-diagram", "practice-exercise"],
        sentenceStructure: "Explanatory, scaffolded",
        tone: "Encouraging, patient",
      },
    };

    return personalities[category] || this.getGenericPersonality();
  }

  /**
   * Get generic personality (fallback)
   */
  private getGenericPersonality(): CategoryPersonality {
    return {
      voice: "Clear and informative",
      style: "Balanced explanation",
      transitionStyle: "Logical flow",
      exampleStyle: "Practical examples",
      emphasisStyle: "Emphasize key points",
      visualPreference: ["comparison-table", "checklist"],
      sentenceStructure: "Clear and varied",
      tone: "Professional",
    };
  }

  /**
   * Apply personality to sections
   */
  applyPersonalityToSections(
    context: CategoryPersonalityContext
  ): StyledSection[] {
    const personality = this.getCategoryPersonality(context.category, context.intent);
    const styledSections: StyledSection[] = [];

    for (const section of context.sections) {
      const styledSection = this.applyPersonalityToSection(section, personality, context);
      styledSections.push(styledSection);
    }

    return styledSections;
  }

  /**
   * Apply personality to a single section
   */
  private applyPersonalityToSection(
    section: NarrativeSection,
    personality: CategoryPersonality,
    context: CategoryPersonalityContext
  ): StyledSection {
    const suggestedTransitions = this.generateTransitions(section, personality, context);
    const suggestedEmphasis = this.generateEmphasis(section, personality, context);

    return {
      section,
      personality,
      suggestedTransitions,
      suggestedEmphasis,
    };
  }

  /**
   * Generate transitions based on category personality
   */
  private generateTransitions(
    section: NarrativeSection,
    personality: CategoryPersonality,
    context: CategoryPersonalityContext
  ): string[] {
    const transitions: string[] = [];

    if (context.category === "technology") {
      // Technology: Functional, minimal filler
      transitions.push(
        "Here's how this works in practice",
        "Let's see the code",
        "This implementation handles",
        "The syntax for this is"
      );
    } else if (context.category === "business") {
      // Business: Business logic flow
      transitions.push(
        "From a business perspective",
        "This impacts your bottom line by",
        "The decision framework suggests",
        "Strategically, this means"
      );
    } else if (context.category === "finance") {
      // Finance: Risk/benefit flow
      transitions.push(
        "From a risk standpoint",
        "This affects your returns by",
        "Financially speaking",
        "The tax implication is"
      );
    } else if (context.category === "travel") {
      // Travel: Journey flow
      transitions.push(
        "On your journey",
        "As you explore",
        "The next step in your trip",
        "This experience offers"
      );
    } else if (context.category === "health") {
      // Health: Gentle, supportive
      transitions.push(
        "For your wellbeing",
        "Health-wise, this means",
        "Consulting your healthcare provider about",
        "The evidence suggests"
      );
    } else if (context.category === "home") {
      // Home: Process flow
      transitions.push(
        "The next step is",
        "Moving forward with",
        "This requires",
        "After completing this"
      );
    } else if (context.category === "education") {
      // Education: Learning progression
      transitions.push(
        "Building on this foundation",
        "As you progress",
        "This concept connects to",
        "To deepen your understanding"
      );
    }

    return transitions;
  }

  /**
   * Generate emphasis points based on category personality
   */
  private generateEmphasis(
    section: NarrativeSection,
    personality: CategoryPersonality,
    context: CategoryPersonalityContext
  ): string[] {
    const emphasis: string[] = [];

    if (context.category === "technology") {
      emphasis.push("Practical application", "Syntax correctness", "Common errors");
    } else if (context.category === "business") {
      emphasis.push("Business impact", "ROI", "Risk assessment");
    } else if (context.category === "finance") {
      emphasis.push("Risk management", "Tax implications", "Long-term impact");
    } else if (context.category === "travel") {
      emphasis.push("Safety", "Budget", "Practical logistics");
    } else if (context.category === "health") {
      emphasis.push("Safety", "Evidence", "Professional guidance");
    } else if (context.category === "home") {
      emphasis.push("Feasibility", "Safety", "Time commitment");
    } else if (context.category === "education") {
      emphasis.push("Understanding", "Practice", "Application");
    }

    return emphasis;
  }

  /**
   * Get sentence structure guidance for the category
   */
  getSentenceStructure(category: string): string {
    const structures: Record<string, string> = {
      technology: "Use short, declarative sentences. Start with the subject or action. Avoid fluff.",
      business: "Use cause-effect structure. Start with business impact, then explain.",
      finance: "Use conditional structure. Present scenarios with outcomes.",
      travel: "Use narrative structure. Tell the story of the experience.",
      health: "Use consultative structure. Present information with care.",
      home: "Use instructional structure. Step-by-step, clear actions.",
      education: "Use explanatory structure. Concept first, then application.",
    };

    return structures[category] || "Use clear, varied sentence structures.";
  }

  /**
   * Get tone guidance for the category
   */
  getToneGuidance(category: string): string {
    const tones: Record<string, string> = {
      technology: "Be direct and precise. Technical but accessible. Avoid jargon without explanation.",
      business: "Be professional and strategic. Focus on outcomes and decisions.",
      finance: "Be responsible and cautious. Acknowledge risks clearly.",
      travel: "Be enthusiastic and helpful. Share the excitement of discovery.",
      health: "Be reassuring and authoritative. Balance hope with realism.",
      home: "Be friendly and encouraging. Make tasks feel approachable.",
      education: "Be patient and encouraging. Celebrate learning progress.",
    };

    return tones[category] || "Be professional and clear.";
  }

  /**
   * Get example style guidance for the category
   */
  getExampleStyle(category: string): string {
    const styles: Record<string, string> = {
      technology: "Use actual code snippets, terminal output, API responses. Show, don't tell.",
      business: "Use real case studies, ROI calculations, decision frameworks. Quantify impact.",
      finance: "Use real calculations with numbers. Show tax implications, inflation impact.",
      travel: "Use real itineraries with costs, time estimates, logistics. Make it feel real.",
      health: "Use realistic scenarios with dosage, timelines, warning signs. Be specific.",
      home: "Use step-by-step workflows with supplies, time estimates, safety notes.",
      education: "Use analogies first, then real applications. Build understanding progressively.",
    };

    return styles[category] || "Use concrete, specific examples.";
  }
}
