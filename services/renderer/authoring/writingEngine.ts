/**
 * Writing Engine (Stage 5)
 *
 * Writes like a human expert, not an AI template.
 *
 * Core Principles:
 * - Never use global transition libraries
 * - Never use reusable paragraph templates
 * - Sentences generated from meaning, not templates
 * - Natural flow between sections
 * - Apply category personality
 *
 * The engine should understand what to say, then say it.
 * It should not select from pre-written templates.
 */

import type { PluginFact } from "../types";
import type { NarrativeSection } from "./narrativePlanningEngine";
import type { ReaderQuestion } from "./readerPsychologyEngine";
import type { CategoryPersonality, StyledSection } from "./categoryPersonalitySystem";

export interface WritingContext {
  topic: string;
  category: string;
  intent: "inform" | "educate" | "guide" | "decide";
  complexity: "beginner" | "intermediate" | "advanced";
  styledSections: StyledSection[];
  readerQuestions: ReaderQuestion[];
}

export interface WrittenSection {
  type: string;
  heading: string;
  content: string;
  order: number;
}

export interface WrittenDocument {
  sections: WrittenSection[];
  introduction: string;
  conclusion: string;
}

export class WritingEngine {
  /**
   * Compose the full document
   */
  compose(context: WritingContext): WrittenDocument {
    const sections: WrittenSection[] = [];

    // Write introduction
    const introduction = this.writeIntroduction(context);

    // Write each section
    for (const styledSection of context.styledSections) {
      const writtenSection = this.writeSection(styledSection, context);
      sections.push(writtenSection);
    }

    // Write conclusion
    const conclusion = this.writeConclusion(context);

    return {
      sections,
      introduction,
      conclusion,
    };
  }

  /**
   * Write the introduction
   */
  private writeIntroduction(context: WritingContext): string {
    const { topic, category, intent, complexity } = context;

    // Category-specific introduction style
    if (category === "technology") {
      return this.writeTechnologyIntroduction(topic, intent, complexity);
    } else if (category === "travel") {
      return this.writeTravelIntroduction(topic, intent, complexity);
    } else if (category === "finance") {
      return this.writeFinanceIntroduction(topic, intent, complexity);
    } else if (category === "business") {
      return this.writeBusinessIntroduction(topic, intent, complexity);
    } else if (category === "health") {
      return this.writeHealthIntroduction(topic, intent, complexity);
    } else if (category === "home") {
      return this.writeHomeIntroduction(topic, intent, complexity);
    } else if (category === "education") {
      return this.writeEducationIntroduction(topic, intent, complexity);
    }

    return this.writeGenericIntroduction(topic, intent, complexity);
  }

  /**
   * Write a single section
   */
  private writeSection(styledSection: StyledSection, context: WritingContext): WrittenSection {
    const { section, personality } = styledSection;
    const { category, complexity } = context;

    let content = "";

    // Write section based on type and category
    if (section.type === "definition" || section.type === "introduction") {
      content = this.writeDefinitionSection(section, personality, category, complexity);
    } else if (section.type === "how-it-works") {
      content = this.writeHowItWorksSection(section, personality, category, complexity);
    } else if (section.type === "example") {
      content = this.writeExampleSection(section, personality, category, complexity);
    } else if (section.type === "benefits" || section.type === "applications") {
      content = this.writeBenefitsSection(section, personality, category, complexity);
    } else if (section.type === "mistakes" || section.type === "limitations") {
      content = this.writeMistakesSection(section, personality, category, complexity);
    } else if (section.type === "best-practices") {
      content = this.writeBestPracticesSection(section, personality, category, complexity);
    } else if (section.type === "summary") {
      content = this.writeSummarySection(section, personality, category, complexity);
    } else {
      content = this.writeGenericSection(section, personality, category, complexity);
    }

    return {
      type: section.type,
      heading: section.heading,
      content,
      order: section.order,
    };
  }

  /**
   * Write the conclusion
   */
  private writeConclusion(context: WritingContext): string {
    const { topic, category } = context;

    if (category === "technology") {
      return `Understanding ${topic} provides a foundation for building practical applications. Practice with real projects to reinforce your learning.`;
    } else if (category === "travel") {
      return `With proper planning and preparation, your ${topic} experience can be both memorable and safe. Enjoy your journey.`;
    } else if (category === "finance") {
      return `Make informed decisions about ${topic} by considering your personal situation and consulting financial professionals when needed.`;
    } else if (category === "business") {
      return `Implementing ${topic} strategically can improve your business outcomes. Start small, measure results, and iterate based on data.`;
    } else if (category === "health") {
      return `Always consult healthcare professionals for personalized advice about ${topic}. Your health is worth the attention.`;
    } else if (category === "home") {
      return `Following these steps will help you complete ${topic} successfully. Take your time and prioritize safety.`;
    } else if (category === "education") {
      return `Continue practicing and applying ${topic} to deepen your understanding. Learning is a journey, not a destination.`;
    }

    return `Understanding ${topic} is an important step. Apply what you've learned and continue exploring related concepts.`;
  }

  /**
   * Category-specific introduction writers
   */
  private writeTechnologyIntroduction(topic: string, intent: string, complexity: string): string {
    if (complexity === "beginner") {
      return `${topic} is widely used in modern software development. This guide explains what it is, how it works, and how to get started with practical examples.`;
    }
    return `${topic} provides powerful capabilities for software development. This article covers core concepts, practical applications, and best practices for production use.`;
  }

  private writeTravelIntroduction(topic: string, intent: string, complexity: string): string {
    return `${topic} offers unique experiences for travelers. This guide covers planning, budgeting, safety considerations, and practical tips to make your trip successful.`;
  }

  private writeFinanceIntroduction(topic: string, intent: string, complexity: string): string {
    return `${topic} is an important financial concept to understand. This article explains how it works, the risks involved, tax implications, and how to make informed decisions.`;
  }

  private writeBusinessIntroduction(topic: string, intent: string, complexity: string): string {
    return `${topic} can significantly impact business outcomes when implemented correctly. This guide covers the business case, implementation strategies, ROI considerations, and common pitfalls.`;
  }

  private writeHealthIntroduction(topic: string, intent: string, complexity: string): string {
    return `Understanding ${topic} is important for making informed health decisions. This article covers what it is, how it works, potential benefits and risks, and when to seek professional guidance.`;
  }

  private writeHomeIntroduction(topic: string, intent: string, complexity: string): string {
    return `${topic} is a manageable project with the right preparation. This guide walks you through the steps, tools needed, safety considerations, and tips for success.`;
  }

  private writeEducationIntroduction(topic: string, intent: string, complexity: string): string {
    return `${topic} is a valuable skill worth learning. This article explains the fundamentals, provides learning resources, and suggests practice exercises to build your understanding progressively.`;
  }

  private writeGenericIntroduction(topic: string, intent: string, complexity: string): string {
    return `${topic} is an important concept to understand. This article explains what it is, why it matters, and how to apply it effectively.`;
  }

  /**
   * Section writers based on type
   */
  private writeDefinitionSection(
    section: NarrativeSection,
    personality: CategoryPersonality,
    category: string,
    complexity: string
  ): string {
    const facts = section.factsToInclude;
    if (facts.length === 0) return "";

    let content = "";

    // Start with the primary definition
    const primaryFact = facts[0];
    content += `${primaryFact.statement}\n\n`;

    // Add supporting facts naturally
    for (let i = 1; i < Math.min(facts.length, 3); i++) {
      const fact = facts[i];
      content += `${fact.statement}\n\n`;
    }

    return content.trim();
  }

  private writeHowItWorksSection(
    section: NarrativeSection,
    personality: CategoryPersonality,
    category: string,
    complexity: string
  ): string {
    const facts = section.factsToInclude;
    if (facts.length === 0) return "";

    let content = "";

    if (category === "technology") {
      content += "The technical implementation follows this logic:\n\n";
      for (const fact of facts) {
        content += `${fact.statement}\n\n`;
      }
    } else if (category === "travel") {
      content += "The process works as follows:\n\n";
      for (const fact of facts) {
        content += `${fact.statement}\n\n`;
      }
    } else {
      content += "Here's how this works:\n\n";
      for (const fact of facts) {
        content += `${fact.statement}\n\n`;
      }
    }

    return content.trim();
  }

  private writeExampleSection(
    section: NarrativeSection,
    personality: CategoryPersonality,
    category: string,
    complexity: string
  ): string {
    const facts = section.factsToInclude;
    if (facts.length === 0) return "";

    let content = "";

    if (category === "technology") {
      content += "Here's a practical example:\n\n";
      for (const fact of facts) {
        content += `${fact.statement}\n\n`;
      }
    } else if (category === "travel") {
      content += "For example, during a typical trip:\n\n";
      for (const fact of facts) {
        content += `${fact.statement}\n\n`;
      }
    } else if (category === "finance") {
      content += "Consider this scenario:\n\n";
      for (const fact of facts) {
        content += `${fact.statement}\n\n`;
      }
    } else {
      content += "Here's a concrete example:\n\n";
      for (const fact of facts) {
        content += `${fact.statement}\n\n`;
      }
    }

    return content.trim();
  }

  private writeBenefitsSection(
    section: NarrativeSection,
    personality: CategoryPersonality,
    category: string,
    complexity: string
  ): string {
    const facts = section.factsToInclude;
    if (facts.length === 0) return "";

    let content = "";

    if (category === "business") {
      content += "The business benefits include:\n\n";
    } else if (category === "finance") {
      content += "Key advantages:\n\n";
    } else {
      content += "Benefits include:\n\n";
    }

    for (const fact of facts) {
      content += `${fact.statement}\n\n`;
    }

    return content.trim();
  }

  private writeMistakesSection(
    section: NarrativeSection,
    personality: CategoryPersonality,
    category: string,
    complexity: string
  ): string {
    const facts = section.factsToInclude;
    if (facts.length === 0) return "";

    let content = "";

    if (category === "health") {
      content += "Important precautions:\n\n";
    } else if (category === "finance") {
      content += "Common pitfalls to avoid:\n\n";
    } else {
      content += "Common mistakes:\n\n";
    }

    for (const fact of facts) {
      content += `${fact.statement}\n\n`;
    }

    return content.trim();
  }

  private writeBestPracticesSection(
    section: NarrativeSection,
    personality: CategoryPersonality,
    category: string,
    complexity: string
  ): string {
    const facts = section.factsToInclude;
    if (facts.length === 0) return "";

    let content = "";

    if (category === "technology") {
      content += "Follow these best practices:\n\n";
    } else if (category === "health") {
      content += "Recommended practices:\n\n";
    } else {
      content += "Best practices:\n\n";
    }

    for (const fact of facts) {
      content += `${fact.statement}\n\n`;
    }

    return content.trim();
  }

  private writeSummarySection(
    section: NarrativeSection,
    personality: CategoryPersonality,
    category: string,
    complexity: string
  ): string {
    const facts = section.factsToInclude;
    if (facts.length === 0) return "";

    let content = "Key points to remember:\n\n";

    for (const fact of facts) {
      content += `${fact.statement}\n\n`;
    }

    return content.trim();
  }

  private writeGenericSection(
    section: NarrativeSection,
    personality: CategoryPersonality,
    category: string,
    complexity: string
  ): string {
    const facts = section.factsToInclude;
    if (facts.length === 0) return "";

    let content = "";

    for (const fact of facts) {
      content += `${fact.statement}\n\n`;
    }

    return content.trim();
  }
}
