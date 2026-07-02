/**
 * Context Builder
 *
 * Builds section-level context to frame content appropriately.
 * 
 * Principles:
 * - Each section should have a clear purpose
 * - Context should answer "why are we covering this?"
 * - Adapt context to reader's intent (inform, educate, guide, decide)
 * - Keep context concise and relevant
 */

export interface CompositionContext {
  facts: any[];
  config: any;
  subject: string;
  intent: "inform" | "educate" | "guide" | "decide";
  complexity: "beginner" | "intermediate" | "advanced";
}

export class ContextBuilder {
  /**
   * Build context for a section
   */
  buildContext(sectionType: string, context: CompositionContext): string | null {
    const contextTemplates = this.getContextTemplates(sectionType, context);
    
    if (!contextTemplates || contextTemplates.length === 0) {
      return null;
    }

    // Select template based on hash for consistency
    const index = this.hashString(`${sectionType}-${context.subject}`) % contextTemplates.length;
    const template = contextTemplates[Math.abs(index)];

    // Fill in template with subject
    return template.replace(/\{subject\}/g, context.subject);
  }

  /**
   * Get context templates for a section type
   */
  private getContextTemplates(
    sectionType: string,
    context: CompositionContext
  ): string[] | null {
    const templates: Record<string, Record<string, string[]>> = {
      "introduction": {
        inform: [
          "This section provides a clear definition of {subject}.",
          "Understanding {subject} begins with its fundamental definition.",
        ],
        educate: [
          "Let's start by understanding what {subject} actually means.",
          "Before diving into details, we need to establish what {subject} is.",
        ],
        guide: [
          "To use {subject} effectively, we first need to understand what it is.",
          "A clear understanding of {subject} is essential for the guidance that follows.",
        ],
        decide: [
          "Making an informed choice about {subject} starts with understanding it clearly.",
          "To evaluate {subject} properly, we need to know what it is.",
        ],
      },
      "core-concept": {
        inform: [
          "The core concept of {subject} rests on several key principles.",
          "Understanding {subject} requires grasping its fundamental ideas.",
        ],
        educate: [
          "At the heart of {subject} are several key concepts worth exploring.",
          "The foundation of {subject} is built on these essential principles.",
        ],
        guide: [
          "To apply {subject} correctly, you need to understand its core concepts.",
          "These fundamental ideas guide how {subject} works in practice.",
        ],
        decide: [
          "The core principles of {subject} are central to making the right choice.",
          "These fundamental concepts help evaluate {subject} effectively.",
        ],
      },
      "how-it-works": {
        inform: [
          "The operation of {subject} follows a specific mechanism.",
          "Understanding how {subject} works requires examining its process.",
        ],
        educate: [
          "Let's explore the mechanism behind {subject}.",
          "The inner workings of {subject} reveal why it functions this way.",
        ],
        guide: [
          "Following the process for {subject} requires understanding each step.",
          "This breakdown shows how to execute {subject} properly.",
        ],
        decide: [
          "The mechanism of {subject} helps determine if it fits your needs.",
          "Understanding how it works is crucial for evaluation.",
        ],
      },
      "example": {
        inform: [
          "A concrete example illustrates how {subject} operates.",
          "This example demonstrates {subject} in action.",
        ],
        educate: [
          "Let's see {subject} in action with a practical example.",
          "This example makes the concept of {subject} clearer.",
        ],
        guide: [
          "This example shows how to apply {subject} in a real situation.",
          "Seeing {subject} in practice helps you follow the steps correctly.",
        ],
        decide: [
          "This example helps visualize the choice you're making.",
          "A concrete scenario illustrates what {subject} looks like in practice.",
        ],
      },
      "applications": {
        inform: [
          "{subject} is applied in various contexts and scenarios.",
          "The practical uses of {subject} span multiple domains.",
        ],
        educate: [
          "Understanding where {subject} is applied shows its versatility.",
          "These applications demonstrate the practical value of {subject}.",
        ],
        guide: [
          "These applications show when and how to use {subject}.",
          "Knowing where {subject} applies helps you use it effectively.",
        ],
        decide: [
          "The applications of {subject} help determine if it meets your needs.",
          "Understanding use cases is essential for making the right choice.",
        ],
      },
      "benefits": {
        inform: [
          "Using {subject} offers several advantages.",
          "The benefits of {subject} make it a valuable approach.",
        ],
        educate: [
          "The advantages of {subject} explain why it's widely adopted.",
          "These benefits highlight the value of understanding {subject}.",
        ],
        guide: [
          "These benefits motivate following the approach outlined here.",
          "Understanding the advantages helps you commit to the process.",
        ],
        decide: [
          "These benefits are key factors in choosing {subject}.",
          "The advantages help justify the investment in {subject}.",
        ],
      },
      "limitations": {
        inform: [
          "It's important to understand the constraints of {subject}.",
          "{subject} has certain limitations that should be considered.",
        ],
        educate: [
          "A complete understanding of {subject} includes knowing its limitations.",
          "These constraints help set realistic expectations for {subject}.",
        ],
        guide: [
          "Being aware of these limitations helps you use {subject} effectively.",
          "These constraints inform how to apply the guidance correctly.",
        ],
        decide: [
          "The limitations of {subject} are crucial for making an informed choice.",
          "Understanding these constraints helps evaluate suitability.",
        ],
      },
      "mistakes": {
        inform: [
          "Common errors occur when working with {subject}.",
          "Many practitioners encounter these pitfalls with {subject}.",
        ],
        educate: [
          "Learning from these common mistakes deepens understanding of {subject}.",
          "These pitfalls illustrate what can go wrong with {subject}.",
        ],
        guide: [
          "Avoiding these mistakes is essential for success with {subject}.",
          "These common errors show where people typically go wrong.",
        ],
        decide: [
          "These mistakes highlight what to watch out for when choosing {subject}.",
          "Understanding pitfalls helps avoid poor decisions.",
        ],
      },
      "best-practices": {
        inform: [
          "Following established practices improves results with {subject}.",
          "These guidelines represent proven approaches to {subject}.",
        ],
        educate: [
          "These best practices distill expertise in {subject}.",
          "Following these guidelines helps master {subject} effectively.",
        ],
        guide: [
          "These practices are essential for following this guide successfully.",
          "Adhering to these standards ensures the best outcomes.",
        ],
        decide: [
          "These practices help implement {subject} correctly if you choose it.",
          "Following these guidelines maximizes the value of your decision.",
        ],
      },
      "history": {
        inform: [
          "The development of {subject} has an interesting historical context.",
          "Understanding the evolution of {subject} provides valuable background.",
        ],
        educate: [
          "The history of {subject} explains why it exists in its current form.",
          "Historical context enriches understanding of {subject}.",
        ],
        guide: [
          "Knowing the history helps appreciate current best practices.",
          "The evolution of {subject} informs the guidance provided.",
        ],
        decide: [
          "Historical context helps understand the maturity of {subject}.",
          "The evolution provides perspective on its current state.",
        ],
      },
      "related": {
        inform: [
          "{subject} connects to several related concepts.",
          "Exploring these connections expands understanding of {subject}.",
        ],
        educate: [
          "These related concepts deepen understanding of {subject}.",
          "The connections to other ideas enrich the learning journey.",
        ],
        guide: [
          "These related areas provide additional context for the guidance.",
          "Understanding these connections helps apply the advice more broadly.",
        ],
        decide: [
          "These related concepts may influence your decision about {subject}.",
          "Exploring connections helps place {subject} in broader context.",
        ],
      },
      "summary": {
        inform: [
          "Let's summarize the key points about {subject}.",
          "These are the main takeaways about {subject}.",
        ],
        educate: [
          "Consolidating these ideas helps retain understanding of {subject}.",
          "These key points represent the essence of {subject}.",
        ],
        guide: [
          "These takeaways help you remember and apply the guidance.",
          "Summarizing ensures you can follow the steps effectively.",
        ],
        decide: [
          "These points summarize the factors to consider about {subject}.",
          "This recap helps with making your final decision.",
        ],
      },
    };

    return templates[sectionType]?.[context.intent] || null;
  }

  /**
   * Build complexity-appropriate context
   */
  buildComplexityContext(
    sectionType: string,
    context: CompositionContext
  ): string | null {
    if (context.complexity === "beginner") {
      return this.buildBeginnerContext(sectionType, context);
    } else if (context.complexity === "advanced") {
      return this.buildAdvancedContext(sectionType, context);
    }

    // Intermediate uses standard context
    return this.buildContext(sectionType, context);
  }

  /**
   * Build simplified context for beginners
   */
  private buildBeginnerContext(
    sectionType: string,
    context: CompositionContext
  ): string | null {
    const beginnerTemplates: Record<string, string[]> = {
      "introduction": [
        "Let's start with the basics of {subject}.",
        "First, we need to understand what {subject} means.",
      ],
      "core-concept": [
        "Here are the main ideas behind {subject}.",
        "The key thing to know about {subject} is this.",
      ],
      "how-it-works": [
        "Here's how {subject} works in simple terms.",
        "Let's break down the process step by step.",
      ],
      "example": [
        "Let's look at a simple example of {subject}.",
        "This example shows {subject} in action.",
      ],
      "applications": [
        "Here's where you can use {subject}.",
        "These are the main situations where {subject} applies.",
      ],
      "benefits": [
        "Here's why {subject} is useful.",
        "These are the main advantages of {subject}.",
      ],
      "limitations": [
        "Here's what to watch out for with {subject}.",
        "These are the main limitations of {subject}.",
      ],
      "mistakes": [
        "Here are common mistakes to avoid with {subject}.",
        "Many people make these errors with {subject}.",
      ],
      "best-practices": [
        "Here's how to do {subject} the right way.",
        "Follow these tips for success with {subject}.",
      ],
      "history": [
        "Here's a bit of background on {subject}.",
        "This is how {subject} developed over time.",
      ],
      "related": [
        "These are related topics you might find interesting.",
        "Here are other areas connected to {subject}.",
      ],
      "summary": [
        "Here are the main points to remember about {subject}.",
        "Let's recap what we've learned about {subject}.",
      ],
    };

    const templates = beginnerTemplates[sectionType];
    if (!templates || templates.length === 0) {
      return null;
    }

    const index = this.hashString(`${sectionType}-${context.subject}`) % templates.length;
    const template = templates[Math.abs(index)];
    return template.replace(/\{subject\}/g, context.subject);
  }

  /**
   * Build advanced context for experts
   */
  private buildAdvancedContext(
    sectionType: string,
    context: CompositionContext
  ): string | null {
    const advancedTemplates: Record<string, string[]> = {
      "introduction": [
        "This section provides a precise technical definition of {subject}.",
        "We begin with a formal specification of {subject}.",
      ],
      "core-concept": [
        "The theoretical foundation of {subject} rests on these principles.",
        "These fundamental axioms underpin {subject}.",
      ],
      "how-it-works": [
        "The mechanism of {subject} operates through this process.",
        "This technical breakdown explains the inner workings.",
      ],
      "example": [
        "This technical example demonstrates the implementation.",
        "The following scenario illustrates the application.",
      ],
      "applications": [
        "These represent the primary use cases in production environments.",
        "The deployment scenarios for {subject} include these contexts.",
      ],
      "benefits": [
        "The technical advantages of {subject} include these factors.",
        "Performance and efficiency gains are realized through these mechanisms.",
      ],
      "limitations": [
        "The technical constraints of {subject} must be considered.",
        "These architectural limitations affect implementation.",
      ],
      "mistakes": [
        "These implementation errors are common in production.",
        "Technical pitfalls often occur in these scenarios.",
      ],
      "best-practices": [
        "These patterns represent industry-standard approaches.",
        "Following these conventions ensures optimal implementation.",
      ],
      "history": [
        "The evolution of {subject} reflects changing technical requirements.",
        "Historical development has led to the current architecture.",
      ],
      "related": [
        "These concepts are technically related to {subject}.",
        "The theoretical connections extend to these domains.",
      ],
      "summary": [
        "These are the technical takeaways regarding {subject}.",
        "The key technical points are summarized here.",
      ],
    };

    const templates = advancedTemplates[sectionType];
    if (!templates || templates.length === 0) {
      return null;
    }

    const index = this.hashString(`${sectionType}-${context.subject}`) % templates.length;
    const template = templates[Math.abs(index)];
    return template.replace(/\{subject\}/g, context.subject);
  }

  /**
   * Simple hash function for consistent selection
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }
}
