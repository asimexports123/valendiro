/**
 * Transition Generator
 *
 * Creates natural, reader-friendly transitions between sections.
 * 
 * Principles:
 * - Transitions should feel like a teacher guiding the reader
 * - Avoid robotic "Next, we will..." patterns
 * - Use varied sentence structures
 * - Connect concepts logically, not just sequentially
 */

export interface CompositionContext {
  facts: any[];
  config: any;
  subject: string;
  intent: "inform" | "educate" | "guide" | "decide";
  complexity: "beginner" | "intermediate" | "advanced";
}

export class TransitionGenerator {
  private transitionMap: Record<string, Record<string, string[]>> = {
    "introduction": {
      "core-concept": [
        "Now that we understand what this is, let's explore the core concept in more detail.",
        "With this foundation in place, we can dive deeper into how it actually works.",
        "Before moving forward, it's important to grasp the fundamental principles.",
      ],
      "how-it-works": [
        "Let's see how this operates in practice.",
        "Now, let's examine the mechanics behind this.",
        "Here's how this actually functions.",
      ],
    },
    "core-concept": {
      "how-it-works": [
        "Understanding the theory is one thing—seeing it in action is another.",
        "Now that we've covered the basics, let's look at how this works in practice.",
        "With the concept clear, let's explore its operation.",
      ],
      "example": [
        "To make this concrete, let's look at a real example.",
        "This becomes clearer when we see it in action.",
        "Let's illustrate this with a practical example.",
      ],
    },
    "how-it-works": {
      "example": [
        "This process becomes clearer with a concrete example.",
        "Let's see this in action with a real scenario.",
        "To better understand, let's walk through an example.",
      ],
      "applications": [
        "Now that we understand how it works, let's explore where it's actually used.",
        "This mechanism has several practical applications worth examining.",
        "Understanding the process helps us see its real-world uses.",
      ],
    },
    "example": {
      "applications": [
        "This example shows just one of many applications.",
        "Beyond this specific case, there are numerous other uses.",
        "This illustrates the principle in action—now let's see broader applications.",
      ],
      "benefits": [
        "From this example, we can see several key benefits.",
        "This demonstrates why this approach is valuable.",
        "The advantages become clear when we see it applied.",
      ],
    },
    "applications": {
      "benefits": [
        "These applications highlight several important benefits.",
        "The practical uses reveal why this matters.",
        "From these applications, we can see the value it provides.",
      ],
      "limitations": [
        "While useful, it's important to understand the limitations.",
        "No approach is perfect—let's consider the constraints.",
        "Before adopting this, we should be aware of its limitations.",
      ],
    },
    "benefits": {
      "limitations": [
        "Despite these benefits, there are some limitations to consider.",
        "The advantages are significant, but we should also understand the tradeoffs.",
        "To use this effectively, we need to know where it falls short.",
      ],
      "best-practices": [
        "To maximize these benefits, certain best practices help.",
        "Getting the most out of this requires following some guidelines.",
        "These benefits are fully realized when we apply best practices.",
      ],
    },
    "limitations": {
      "mistakes": [
        "These limitations often lead to common mistakes.",
        "Understanding these constraints helps us avoid pitfalls.",
        "Being aware of these limitations prevents several common errors.",
      ],
      "best-practices": [
        "To work within these limitations, certain practices help.",
        "Despite these constraints, we can still use it effectively by following best practices.",
        "These limitations are manageable with the right approach.",
      ],
    },
    "mistakes": {
      "best-practices": [
        "Avoiding these mistakes is easier when following best practices.",
        "The right approach prevents many of these errors.",
        "Let's look at the practices that help us avoid these pitfalls.",
      ],
      "history": [
        "Understanding these mistakes helps us appreciate how the approach evolved.",
        "These common errors have shaped the development of best practices over time.",
        "The history of this field includes lessons learned from these mistakes.",
      ],
    },
    "best-practices": {
      "history": [
        "These practices have evolved over time.",
        "Let's look at how these guidelines developed historically.",
        "Understanding the history helps us appreciate current best practices.",
      ],
      "related": [
        "With these fundamentals in place, let's explore related concepts.",
        "This connects to several other important ideas worth exploring.",
        "Mastering this foundation opens doors to related subjects.",
      ],
    },
    "history": {
      "related": [
        "This historical context connects to several related concepts.",
        "Understanding the evolution helps us see connections to other ideas.",
        "The development of this field influenced many related areas.",
      ],
      "summary": [
        "With this historical understanding, let's summarize the key points.",
        "This background gives us perspective for the main takeaways.",
        "Now let's consolidate what we've learned.",
      ],
    },
    "related": {
      "summary": [
        "Before exploring these connections, let's recap the essentials.",
        "Understanding these related concepts builds on what we've covered.",
        "Let's summarize the key ideas before branching out.",
      ],
    },
  };

  /**
   * Generate a natural transition between sections
   */
  generateTransition(
    fromSection: string,
    toSection: string,
    context: CompositionContext
  ): string | null {
    // Check if we have a predefined transition
    const transitions = this.transitionMap[fromSection]?.[toSection];
    if (transitions && transitions.length > 0) {
      const index = this.hashString(`${fromSection}-${toSection}-${context.subject}`) % transitions.length;
      return transitions[Math.abs(index)];
    }

    // Generate a dynamic transition based on intent
    return this.generateDynamicTransition(fromSection, toSection, context);
  }

  /**
   * Generate a dynamic transition when no predefined one exists
   */
  private generateDynamicTransition(
    fromSection: string,
    toSection: string,
    context: CompositionContext
  ): string {
    const templates = [
      `Moving from ${this.formatSectionName(fromSection)} to ${this.formatSectionName(toSection)}, let's continue our exploration.`,
      `With ${this.formatSectionName(fromSection)} covered, we can now turn our attention to ${this.formatSectionName(toSection)}.`,
      `Building on our understanding of ${this.formatSectionName(fromSection)}, let's examine ${this.formatSectionName(toSection)}.`,
    ];

    const index = this.hashString(`${fromSection}-${toSection}-${context.subject}`) % templates.length;
    return templates[Math.abs(index)];
  }

  /**
   * Format section name for transitions
   */
  private formatSectionName(section: string): string {
    const names: Record<string, string> = {
      "introduction": "the basics",
      "core-concept": "the core concept",
      "how-it-works": "the mechanics",
      "example": "this example",
      "applications": "practical applications",
      "benefits": "the benefits",
      "limitations": "the limitations",
      "mistakes": "common mistakes",
      "best-practices": "best practices",
      "history": "historical context",
      "related": "related concepts",
      "summary": "the key points",
    };

    return names[section] || section;
  }

  /**
   * Generate a section introduction
   */
  generateSectionIntro(
    sectionType: string,
    context: CompositionContext
  ): string | null {
    const intros: Record<string, string[]> = {
      "introduction": [
        `Let's start with the fundamentals of ${context.subject}.`,
        `Before diving into details, let's establish what ${context.subject} actually means.`,
      ],
      "core-concept": [
        `At its heart, ${context.subject} is built on a few key principles.`,
        `The foundation of ${context.subject} rests on several core concepts.`,
      ],
      "how-it-works": [
        `Understanding how ${context.subject} works requires looking at its mechanism.`,
        `The operation of ${context.subject} follows a logical process.`,
      ],
      "example": [
        `Let's make this concrete with a practical example.`,
        `An example will help clarify this concept.`,
      ],
      "applications": [
        `${context.subject} has several important applications.`,
        `This principle is applied in various contexts.`,
      ],
      "benefits": [
        `Using ${context.subject} offers several advantages.`,
        `The benefits of this approach are significant.`,
      ],
      "limitations": [
        `It's important to understand the limitations of ${context.subject}.`,
        `No approach is perfect—here are the constraints to consider.`,
      ],
      "mistakes": [
        `Many people encounter common pitfalls with ${context.subject}.`,
        `Avoiding these mistakes is crucial for success.`,
      ],
      "best-practices": [
        `Following best practices helps you get the most from ${context.subject}.`,
        `Experienced practitioners recommend these guidelines.`,
      ],
      "history": [
        `The development of ${context.subject} has an interesting history.`,
        `Understanding the evolution provides valuable context.`,
      ],
      "related": [
        `${context.subject} connects to several related concepts.`,
        `Exploring these connections deepens understanding.`,
      ],
      "summary": [
        `Let's summarize the key points about ${context.subject}.`,
        `Here are the main takeaways to remember.`,
      ],
    };

    const sectionIntros = intros[sectionType];
    if (sectionIntros && sectionIntros.length > 0) {
      const index = this.hashString(`${sectionType}-${context.subject}`) % sectionIntros.length;
      return sectionIntros[Math.abs(index)];
    }

    return null;
  }

  /**
   * Generate a section conclusion
   */
  generateSectionConclusion(
    sectionType: string,
    context: CompositionContext
  ): string | null {
    const conclusions: Record<string, string[]> = {
      "introduction": [
        `With this foundation in place, we can now explore ${context.subject} in more detail.`,
        `These basics set the stage for deeper understanding.`,
      ],
      "core-concept": [
        `These principles form the foundation of ${context.subject}.`,
        `Understanding these core concepts is essential for mastery.`,
      ],
      "how-it-works": [
        `This mechanism explains how ${context.subject} operates.`,
        `The process is now clear—let's see it applied.`,
      ],
      "example": [
        `This example illustrates the key principles in action.`,
        `The concept becomes clearer when seen through this lens.`,
      ],
      "applications": [
        `These applications demonstrate the practical value of ${context.subject}.`,
        `The versatility of this approach is evident from these uses.`,
      ],
      "benefits": [
        `These advantages make ${context.subject} a compelling choice.`,
        `The benefits clearly justify the investment in learning this.`,
      ],
      "limitations": [
        `Being aware of these constraints helps use ${context.subject} effectively.`,
        `These limitations are manageable with the right approach.`,
      ],
      "mistakes": [
        `Avoiding these pitfalls significantly improves outcomes.`,
        `These common errors are preventable with awareness.`,
      ],
      "best-practices": [
        `Following these guidelines ensures success with ${context.subject}.`,
        `These practices represent distilled wisdom from experience.`,
      ],
      "history": [
        `This historical context enriches our understanding of ${context.subject}.`,
        `The evolution of this field provides valuable lessons.`,
      ],
      "related": [
        `These connections expand our understanding of ${context.subject}.`,
        `Exploring related concepts deepens mastery.`,
      ],
    };

    const sectionConclusions = conclusions[sectionType];
    if (sectionConclusions && sectionConclusions.length > 0) {
      const index = this.hashString(`${sectionType}-${context.subject}`) % sectionConclusions.length;
      return sectionConclusions[Math.abs(index)];
    }

    return null;
  }

  /**
   * Simple hash function for consistent selection
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }
}
