/**
 * Transition Generator
 *
 * Creates natural, knowledge-linked bridges between teaching sections.
 * Prefers short factual bridges over generic "let's explore" filler.
 */

export interface CompositionContext {
  facts: any[];
  config: any;
  subject: string;
  intent: "inform" | "educate" | "guide" | "decide";
  complexity: "beginner" | "intermediate" | "advanced";
}

const GENERIC_TRANSITION_PATTERNS = [
  /now that we understand/i,
  /let's explore/i,
  /let's examine/i,
  /let's look at/i,
  /let's continue/i,
  /let's summarize/i,
  /let's dive/i,
  /with this foundation/i,
  /building on our understanding/i,
  /turn our attention to/i,
  /continue our exploration/i,
  /in today's rapidly evolving/i,
];

export class TransitionGenerator {
  /** Maps actual KE / long-article-v2 section types */
  private transitionMap: Record<string, Record<string, string[]>> = {
    "definition-card": {
      motivation: [
        "That definition matters in practice for a few concrete reasons.",
        "Knowing what it is sets up why it shows up in real decisions.",
      ],
      "core-concept": [
        "With the definition in place, the important properties become clearer.",
        "The next layer is how this concept actually behaves.",
      ],
      "how-it-works": [
        "Definition alone is not enough — the operating mechanism fills the gap.",
        "Here is how that idea is carried out step by step.",
      ],
      history: [
        "A short origin story explains how this definition took hold.",
      ],
    },
    motivation: {
      "core-concept": [
        "Those stakes rest on a few measurable properties.",
        "The following properties explain that relevance.",
      ],
      "how-it-works": [
        "Understanding the stakes makes the mechanism worth learning carefully.",
      ],
    },
    "core-concept": {
      "how-it-works": [
        "Those properties show up through a concrete operating sequence.",
        "Next: the mechanism that produces those behaviors.",
      ],
      history: [
        "Those properties did not appear overnight — context helps.",
      ],
      "use-cases": [
        "Knowing how it behaves clarifies when to reach for it.",
      ],
      "comparison-table": [
        "With the core properties clear, tradeoffs against alternatives make sense.",
      ],
    },
    history: {
      "how-it-works": [
        "That background leads directly into how it works today.",
      ],
      "core-concept": [
        "Against that history, the modern properties are easier to read.",
      ],
    },
    "how-it-works": {
      "use-cases": [
        "The mechanism implies specific situations where it pays off.",
        "Those steps map onto practical use cases.",
      ],
      "comparison-table": [
        "Seeing the mechanism makes side-by-side comparisons more honest.",
      ],
      "beginner-mistakes": [
        "Once the steps are clear, common failure points stand out.",
      ],
      "best-practices": [
        "The mechanism suggests practices that keep outcomes stable.",
      ],
      applications: [
        "Those steps have measurable signals — here is how teams track them.",
      ],
      summary: [
        "Pull the mechanism down to the points worth keeping.",
      ],
    },
    "use-cases": {
      "comparison-table": [
        "Use cases differ — comparing options prevents mismatched choices.",
      ],
      "beginner-mistakes": [
        "Misreading when to apply it is a frequent beginner mistake.",
      ],
      "best-practices": [
        "Good practice is mostly choosing the right case, then executing cleanly.",
      ],
    },
    "comparison-table": {
      "beginner-mistakes": [
        "Choosing the wrong option usually creates the same set of mistakes.",
      ],
      "best-practices": [
        "Tradeoffs are easier to honor when practices are explicit.",
      ],
      "when-to-avoid": [
        "Some comparisons show situations where you should not use it at all.",
      ],
    },
    "beginner-mistakes": {
      "best-practices": [
        "Avoiding those mistakes is mostly a matter of a few durable practices.",
        "The following practices counter the failures above.",
      ],
      "when-to-avoid": [
        "Sometimes the right move is not to use it — here is when.",
      ],
      summary: [
        "Mistakes clarify what to remember on first pass.",
      ],
    },
    "best-practices": {
      applications: [
        "Practices stick when you can measure whether they are working.",
      ],
      summary: [
        "Practices collapse into a short list of takeaways.",
      ],
      history: [
        "Many of these practices emerged from hard-won history.",
      ],
    },
    applications: {
      summary: [
        "Measurements only matter if the takeaways are clear.",
      ],
    },
  };

  generateTransition(
    fromSection: string,
    toSection: string,
    context: CompositionContext
  ): string | null {
    const transitions = this.transitionMap[fromSection]?.[toSection];
    if (transitions && transitions.length > 0) {
      const index =
        this.hashString(`${fromSection}-${toSection}-${context.subject}`) %
        transitions.length;
      const selected = transitions[Math.abs(index)];
      return this.isGenericTransition(selected) ? null : selected;
    }

    return this.generateDynamicTransition(fromSection, toSection, context);
  }

  private generateDynamicTransition(
    fromSection: string,
    toSection: string,
    context: CompositionContext
  ): string | null {
    const from = this.formatSectionName(fromSection);
    const to = this.formatSectionName(toSection);
    if (!from || !to || from === to) return null;

    const templates = [
      `${from.charAt(0).toUpperCase()}${from.slice(1)} leads into ${to}.`,
      `From ${from} to ${to} for ${context.subject}.`,
    ];

    const index =
      this.hashString(`${fromSection}-${toSection}-${context.subject}`) %
      templates.length;
    const selected = templates[Math.abs(index)];
    return this.isGenericTransition(selected) ? null : selected;
  }

  private formatSectionName(section: string): string {
    const names: Record<string, string> = {
      "definition-card": "the definition",
      motivation: "why it matters",
      "core-concept": "the core properties",
      "how-it-works": "the mechanism",
      "use-cases": "use cases",
      "comparison-table": "comparisons",
      "beginner-mistakes": "common mistakes",
      "best-practices": "practices",
      history: "background",
      applications: "metrics",
      summary: "the takeaways",
      "when-to-avoid": "when to avoid it",
      introduction: "the basics",
      example: "examples",
      mistakes: "mistakes",
    };

    return names[section] || section.replace(/-/g, " ");
  }

  generateSectionIntro(
    sectionType: string,
    context: CompositionContext
  ): string | null {
    // Prefer fact-driven section bodies — short intros only for beginners on critical sections
    if (context.complexity !== "beginner") return null;
    if (sectionType === "how-it-works") {
      return `Here is the operating sequence for ${context.subject}.`;
    }
    if (sectionType === "beginner-mistakes") {
      return `These are the mistakes that most often erase the gains of ${context.subject}.`;
    }
    return null;
  }

  generateSectionConclusion(
    _sectionType: string,
    _context: CompositionContext
  ): string | null {
    return null;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash;
  }

  private isGenericTransition(text: string): boolean {
    return GENERIC_TRANSITION_PATTERNS.some((pattern) => pattern.test(text));
  }
}
