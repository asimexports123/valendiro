/**
 * Composition Policy
 *
 * Maps category → intent → prose templates.
 *
 * This is the only file that encodes the "what value does this page deliver"
 * philosophy. The renderer itself stays generic — this module tells it *how*
 * to frame the content for each knowledge domain.
 *
 * Intent detection is data-driven: inferred from the topic slug and category.
 * No hardcoded topic-level exceptions.
 */

import type { PageIntent } from "./types";

// ─── Intent Detection ─────────────────────────────────────────────────────────

/**
 * Infer the dominant page intent from category + slug signals.
 * The slug is used as a tiebreaker when the category has mixed intents.
 */
export function inferIntent(category: string, slug: string): PageIntent {
  // Explicit guide signals in slug
  const guideSignals = /\b(how-to|guide|tutorial|setup|install|deploy|configure|getting-started|step-by-step|checklist|planning|build|create|start|launch|implement|manage)\b/;
  if (guideSignals.test(slug)) return "guide";

  // Explicit decide signals in slug
  const decideSignals = /\b(vs|versus|comparison|compare|best|choose|which|alternatives|tradeoffs|review|should-i)\b/;
  if (decideSignals.test(slug)) return "decide";

  // Category defaults
  const CATEGORY_INTENT: Record<string, PageIntent> = {
    technology:       "educate",   // explain concepts, teach skills
    business:         "guide",     // help execute decisions and actions
    "personal-finance": "guide",   // practical financial guidance
    education:        "educate",   // learning methods, skills
    "health-wellness": "inform",   // reliable health information
    "home-lifestyle":  "guide",    // step-by-step domestic tasks
    travel:           "guide",     // planning, logistics, decisions
  };

  return CATEGORY_INTENT[category] ?? "educate";
}

// ─── Policy Shape ─────────────────────────────────────────────────────────────

export interface CompositionPolicy {
  intent: PageIntent;
  category: string;

  // Section configuration
  sectionOrder: string[];           // ordered list of fact types to render
  primaryHeadingLabel: string;      // label for the definition/overview section
  characteristicsLabel: string;     // label for properties section
  practicalLabel: string;           // label for procedural section
  historyLabel: string;             // label for historical section
  comparisonLabel: string;          // label for comparison section
  warningLabel: string;             // label for warnings section
  ruleLabel: string;                // label for rules section

  // Prose language
  definitionOpeners: ((subject: string) => string)[];
  propertyLeads: string[];
  factConnectors: string[];
  historyBridges: string[];
  sectionTransitions: Record<string, Record<string, string>>;
  summaryCloser: (subject: string) => string;

  // Reader outcome sentence — shown at end
  readerOutcome: string;
}

// ─── Shared prose fragments ────────────────────────────────────────────────────

const GENERIC_CONNECTORS = [
  "Specifically,", "In particular,", "Importantly,",
  "Of note,", "Worth highlighting,", "A key point is that",
];

// ─── Policy Definitions ───────────────────────────────────────────────────────

const TECHNOLOGY_POLICY: CompositionPolicy = {
  intent: "educate",
  category: "technology",
  sectionOrder: ["definition", "property", "historical", "procedural", "rule", "comparison", "warning", "measurement", "causal"],
  primaryHeadingLabel: "What Is",
  characteristicsLabel: "How It Works",
  practicalLabel: "Putting It Into Practice",
  historyLabel: "Background & Evolution",
  comparisonLabel: "How It Compares to Alternatives",
  warningLabel: "Common Mistakes",
  ruleLabel: "Best Practices",
  definitionOpeners: [
    (s) => `**${s}** is`,
    (s) => `At its core, **${s}** is`,
    (s) => `**${s}** refers to`,
    (s) => `In software development, **${s}** is`,
    (s) => `**${s}** can be understood as`,
  ],
  propertyLeads: [
    "Several characteristics define how this works in practice.",
    "Understanding the key properties helps explain why this approach is widely adopted.",
    "The following characteristics explain both what this is and how it behaves.",
    "To use this effectively, it helps to understand its defining properties.",
  ],
  factConnectors: [
    "Specifically,", "In particular,", "Under the hood,",
    "From an implementation standpoint,", "Technically,",
    "In practice,", "A key aspect is that",
  ],
  historyBridges: [
    "This led to", "As the technology matured,", "Over time,",
    "Building on this foundation,", "The community then",
  ],
  sectionTransitions: {
    definition: {
      property: "With that foundation in place, it helps to examine the specific properties that define how this works.",
      historical: "To understand why it was designed this way, some background is useful.",
      procedural: "With the concept clear, the natural next step is seeing how to apply it.",
      rule: "Understanding what it is makes the best practices easier to follow.",
    },
    property: {
      historical: "These characteristics did not emerge arbitrarily — the history behind the technology explains how they developed.",
      procedural: "Knowing these properties makes the practical steps much clearer.",
      rule: "These characteristics directly inform how to use this correctly.",
      warning: "While these properties are powerful, there are situations where care is required.",
    },
    procedural: {
      rule: "When applying these steps, several principles consistently separate good outcomes from poor ones.",
      warning: "When following this approach, a few common pitfalls are worth knowing in advance.",
    },
    rule: {
      warning: "Even when following best practices, some edge cases deserve special attention.",
    },
  },
  summaryCloser: (s) => `This page covered the essential ideas behind ${s} — from what it is and how it works through to practical application and best practices.`,
  readerOutcome: "You now understand how this technology works and how to apply it correctly.",
};

const BUSINESS_POLICY: CompositionPolicy = {
  intent: "guide",
  category: "business",
  sectionOrder: ["definition", "property", "procedural", "rule", "comparison", "historical", "warning", "measurement", "causal"],
  primaryHeadingLabel: "What Is",
  characteristicsLabel: "Key Elements",
  practicalLabel: "How to Apply This",
  historyLabel: "Context & Background",
  comparisonLabel: "Comparing Your Options",
  warningLabel: "Risks to Avoid",
  ruleLabel: "Principles That Drive Results",
  definitionOpeners: [
    (s) => `**${s}** is`,
    (s) => `In business, **${s}** refers to`,
    (s) => `**${s}** describes`,
    (s) => `At its core, **${s}** is`,
    (s) => `For any organisation, **${s}** is`,
  ],
  propertyLeads: [
    "The following elements determine how this works in a real business context.",
    "Several factors define what this looks like in practice.",
    "Executing this well requires understanding a set of interconnected components.",
    "Success here depends on getting a few key elements right.",
  ],
  factConnectors: [
    "In practice,", "From an operational standpoint,",
    "Critically,", "A common approach is that",
    "For most organisations,", "At scale,",
  ],
  historyBridges: [
    "This shaped how the field evolved.", "Over time,", "As businesses scaled,",
    "This insight led to", "The market then",
  ],
  sectionTransitions: {
    definition: {
      property: "Breaking this down into its components makes it easier to act on.",
      procedural: "Understanding what it is leads naturally to the question of how to do it.",
      rule: "Knowing the definition makes the governing principles easier to apply.",
      comparison: "Before committing to an approach, comparing the available options is worthwhile.",
    },
    property: {
      procedural: "With these elements clear, the practical steps become straightforward.",
      rule: "These components inform the principles that distinguish good execution from poor execution.",
      comparison: "These factors are also the right lens through which to compare alternatives.",
      warning: "Each of these elements also carries risk if handled incorrectly.",
    },
    procedural: {
      rule: "Alongside these steps, a set of principles consistently separates successful outcomes from failures.",
      warning: "During execution, several risks consistently derail otherwise sound plans.",
    },
  },
  summaryCloser: (s) => `This page covered the foundations of ${s} — what it is, how to implement it, and the principles that drive results.`,
  readerOutcome: "You now have a practical understanding of how to approach this and what to watch out for.",
};

const FINANCE_POLICY: CompositionPolicy = {
  intent: "guide",
  category: "personal-finance",
  sectionOrder: ["definition", "property", "procedural", "rule", "measurement", "comparison", "warning", "historical", "causal"],
  primaryHeadingLabel: "What Is",
  characteristicsLabel: "How This Works",
  practicalLabel: "How to Apply This",
  historyLabel: "Background",
  comparisonLabel: "Comparing the Options",
  warningLabel: "What to Watch Out For",
  ruleLabel: "Guiding Principles",
  definitionOpeners: [
    (s) => `**${s}** is`,
    (s) => `In personal finance, **${s}** refers to`,
    (s) => `**${s}** is a financial concept that describes`,
    (s) => `Simply put, **${s}** is`,
    (s) => `**${s}** is the practice of`,
  ],
  propertyLeads: [
    "Understanding how this works in practice requires looking at a few key mechanics.",
    "Several factors determine how this plays out in your finances.",
    "The following characteristics explain how this concept operates.",
    "Getting results here depends on understanding these core mechanics.",
  ],
  factConnectors: [
    "In practice,", "Financially speaking,", "Over time,",
    "For most people,", "The key implication is that",
    "Concretely,", "Numerically,",
  ],
  historyBridges: [
    "This evolved from", "Over decades,", "As markets developed,",
    "Financial research later showed that", "This insight led to",
  ],
  sectionTransitions: {
    definition: {
      property: "Breaking down how this actually works makes it easier to take action.",
      procedural: "With a clear definition in place, the practical steps are straightforward to follow.",
      rule: "These fundamentals lead directly to a set of principles worth keeping front of mind.",
      measurement: "These ideas also translate into concrete numbers worth understanding.",
    },
    property: {
      procedural: "Knowing the mechanics, the practical approach becomes clear.",
      rule: "These mechanics are why a specific set of financial principles consistently holds true.",
      warning: "These dynamics also create specific risks that can erode financial progress.",
    },
    procedural: {
      rule: "Alongside these steps, certain principles provide a reliable compass.",
      warning: "These steps are effective, but specific pitfalls consistently trip people up.",
    },
  },
  summaryCloser: (s) => `This page covered ${s} — what it is, how it works, and how to use it to improve your financial position.`,
  readerOutcome: "You now understand the concept and have a practical framework for applying it.",
};

const EDUCATION_POLICY: CompositionPolicy = {
  intent: "educate",
  category: "education",
  sectionOrder: ["definition", "property", "historical", "procedural", "rule", "comparison", "warning", "measurement", "causal"],
  primaryHeadingLabel: "What Is",
  characteristicsLabel: "Key Principles",
  practicalLabel: "How to Apply This",
  historyLabel: "Where This Came From",
  comparisonLabel: "Comparing Approaches",
  warningLabel: "Common Mistakes",
  ruleLabel: "Evidence-Based Guidelines",
  definitionOpeners: [
    (s) => `**${s}** is`,
    (s) => `In educational research, **${s}** refers to`,
    (s) => `**${s}** describes`,
    (s) => `**${s}** is a learning approach in which`,
    (s) => `At its core, **${s}** is`,
  ],
  propertyLeads: [
    "The research behind this highlights a set of principles worth understanding.",
    "Several evidence-based principles define how this approach works.",
    "What makes this effective comes down to a few well-studied characteristics.",
    "Understanding these principles explains why this method produces results.",
  ],
  factConnectors: [
    "Research shows that", "In practice,", "Evidence suggests that",
    "Specifically,", "Studies confirm that", "Importantly,",
  ],
  historyBridges: [
    "This built on earlier research showing that", "Over time, the evidence pointed to",
    "Subsequent studies confirmed that", "As understanding developed,",
    "The research community then", "This finding led to",
  ],
  sectionTransitions: {
    definition: {
      property: "The research behind this clarifies a set of principles that explain why it works.",
      historical: "To understand why this approach emerged, some historical context is helpful.",
      procedural: "Knowing what it is makes applying it straightforward.",
      rule: "The research also supports a clear set of evidence-based guidelines.",
    },
    property: {
      historical: "These principles were not always well understood — the history explains how the field arrived here.",
      procedural: "These principles translate directly into a practical approach.",
      rule: "These characteristics are also what underpin the evidence-based guidelines for application.",
    },
    procedural: {
      rule: "Alongside these steps, a set of evidence-backed principles makes the approach more effective.",
      warning: "A few common mistakes undermine the effectiveness of this approach if not avoided.",
    },
  },
  summaryCloser: (s) => `This page covered ${s} — the research behind it, how it works in practice, and how to apply it effectively.`,
  readerOutcome: "You now understand this concept and have a practical approach for using it.",
};

const HEALTH_POLICY: CompositionPolicy = {
  intent: "inform",
  category: "health-wellness",
  sectionOrder: ["definition", "property", "rule", "measurement", "procedural", "historical", "warning", "comparison", "causal"],
  primaryHeadingLabel: "What Is",
  characteristicsLabel: "How This Affects the Body",
  practicalLabel: "Practical Guidance",
  historyLabel: "What the Research Shows",
  comparisonLabel: "Comparing Approaches",
  warningLabel: "Important Considerations",
  ruleLabel: "Evidence-Based Recommendations",
  definitionOpeners: [
    (s) => `**${s}** is`,
    (s) => `In health and medicine, **${s}** refers to`,
    (s) => `**${s}** describes`,
    (s) => `Medically, **${s}** is defined as`,
    (s) => `**${s}** is a health concept that involves`,
  ],
  propertyLeads: [
    "Understanding how this affects the body requires examining a few key mechanisms.",
    "The following characteristics explain how this works physiologically.",
    "Several important properties define how this operates in the body.",
    "The mechanisms here are well-studied and worth understanding clearly.",
  ],
  factConnectors: [
    "Evidence shows that", "Research confirms that", "In clinical terms,",
    "Physiologically,", "Studies indicate that", "From a health standpoint,",
  ],
  historyBridges: [
    "Research later showed that", "Studies have since confirmed that",
    "The clinical evidence evolved to show", "Over decades of research,",
    "As the science developed,", "Subsequent evidence found that",
  ],
  sectionTransitions: {
    definition: {
      property: "Understanding what this is leads to the question of how it operates in the body.",
      rule: "The evidence on this topic supports a set of clear recommendations.",
      warning: "Along with understanding the basics, there are important considerations to be aware of.",
      measurement: "This also translates into measurable outcomes worth knowing.",
    },
    property: {
      rule: "These mechanisms directly inform the evidence-based recommendations on this topic.",
      warning: "These mechanisms also explain why certain situations require extra care.",
      procedural: "This understanding translates into practical guidance worth following.",
    },
    rule: {
      warning: "Even within evidence-based guidelines, there are nuances and exceptions that matter.",
      procedural: "These recommendations translate into specific practical steps.",
    },
  },
  summaryCloser: (s) => `This page provided a reliable overview of ${s} — what it is, how it works, and what the evidence recommends.`,
  readerOutcome: "You now have a clear, evidence-based understanding of this topic.",
};

const HOME_POLICY: CompositionPolicy = {
  intent: "guide",
  category: "home-lifestyle",
  sectionOrder: ["definition", "procedural", "property", "rule", "warning", "comparison", "measurement", "historical", "causal"],
  primaryHeadingLabel: "What Is",
  characteristicsLabel: "What You Need to Know",
  practicalLabel: "Step-by-Step Guide",
  historyLabel: "Background",
  comparisonLabel: "Comparing Your Options",
  warningLabel: "Common Mistakes",
  ruleLabel: "Guiding Principles",
  definitionOpeners: [
    (s) => `**${s}** is`,
    (s) => `**${s}** refers to`,
    (s) => `In the home, **${s}** means`,
    (s) => `Simply put, **${s}** is`,
    (s) => `**${s}** is the practice of`,
  ],
  propertyLeads: [
    "Before getting started, a few key concepts are worth understanding.",
    "Success here depends on a few important factors.",
    "The following points explain what makes this approach work well.",
    "A clear understanding of these elements makes the process much easier.",
  ],
  factConnectors: [
    "In practice,", "Specifically,", "When doing this,",
    "An important step is to", "A common approach is to",
    "The key is that", "Worth noting,",
  ],
  historyBridges: [
    "This approach developed because", "Over time,",
    "Experience has shown that", "This technique evolved from",
    "The reasoning behind this is", "As methods improved,",
  ],
  sectionTransitions: {
    definition: {
      procedural: "With a clear idea of what this involves, the practical steps are easy to follow.",
      property: "Before diving in, a few key concepts make the process much clearer.",
      rule: "A few simple principles make the difference between good and poor results.",
      warning: "Before starting, it is worth knowing the common mistakes to avoid.",
    },
    procedural: {
      rule: "Following these steps well also means keeping a few guiding principles in mind.",
      warning: "When working through these steps, these common mistakes are worth avoiding.",
    },
    property: {
      procedural: "With this understanding in place, the practical steps are straightforward.",
      rule: "These concepts translate directly into actionable principles.",
    },
  },
  summaryCloser: (s) => `This page covered ${s} — what it involves, how to do it, and the key principles that produce good results.`,
  readerOutcome: "You now know what this involves and how to approach it confidently.",
};

const TRAVEL_POLICY: CompositionPolicy = {
  intent: "guide",
  category: "travel",
  sectionOrder: ["definition", "procedural", "property", "rule", "comparison", "warning", "measurement", "historical", "causal"],
  primaryHeadingLabel: "What Is",
  characteristicsLabel: "What You Need to Know",
  practicalLabel: "Planning & Preparation",
  historyLabel: "Context",
  comparisonLabel: "Comparing Your Options",
  warningLabel: "What to Watch Out For",
  ruleLabel: "Practical Tips",
  definitionOpeners: [
    (s) => `**${s}** is`,
    (s) => `**${s}** refers to`,
    (s) => `In travel planning, **${s}** means`,
    (s) => `Simply put, **${s}** involves`,
    (s) => `**${s}** is the process of`,
  ],
  propertyLeads: [
    "A few key considerations shape how this works in practice.",
    "Before planning, these points are worth understanding clearly.",
    "The following details determine what this experience involves.",
    "Getting this right depends on a few well-understood factors.",
  ],
  factConnectors: [
    "In practice,", "When planning,", "On the ground,",
    "Logistically,", "For most travellers,", "Specifically,",
  ],
  historyBridges: [
    "This has evolved over time to become", "Experience has shown that",
    "Travellers have found that", "Over the years,",
    "This developed from", "Practically speaking,",
  ],
  sectionTransitions: {
    definition: {
      procedural: "With a clear picture of what this involves, the planning steps are straightforward.",
      property: "Before planning, a few key facts shape what this experience actually looks like.",
      rule: "A set of practical tips consistently makes this easier and more enjoyable.",
      warning: "There are also a few common pitfalls worth knowing before you start.",
    },
    procedural: {
      rule: "Alongside these steps, a few practical principles make a meaningful difference.",
      warning: "When working through this plan, these common issues are worth watching for.",
    },
    property: {
      procedural: "With this context in place, the planning process becomes clear.",
      rule: "These facts directly inform the practical tips that follow.",
    },
  },
  summaryCloser: (s) => `This page covered ${s} — what it involves, how to plan for it, and the practical tips that make the experience smoother.`,
  readerOutcome: "You now have everything you need to plan and approach this with confidence.",
};

// Default fallback — educate intent
const DEFAULT_POLICY: CompositionPolicy = {
  intent: "educate",
  category: "general",
  sectionOrder: ["definition", "property", "historical", "procedural", "rule", "comparison", "warning", "measurement", "causal"],
  primaryHeadingLabel: "What Is",
  characteristicsLabel: "Key Characteristics",
  practicalLabel: "How to Apply This",
  historyLabel: "Background & History",
  comparisonLabel: "How It Compares",
  warningLabel: "Common Pitfalls",
  ruleLabel: "Key Principles",
  definitionOpeners: [
    (s) => `**${s}** is`,
    (s) => `At its core, **${s}** is`,
    (s) => `**${s}** refers to`,
    (s) => `In practical terms, **${s}** is`,
    (s) => `**${s}** can be understood as`,
  ],
  propertyLeads: [
    "Several properties define how this topic behaves and why it is used the way it is.",
    "The practical behaviour of this topic comes down to a set of defining characteristics.",
    "What makes this topic distinctive is a combination of properties that work together.",
    "The following characteristics explain both what this is and why it functions this way.",
  ],
  factConnectors: GENERIC_CONNECTORS,
  historyBridges: [
    "This led to", "Over time,", "Subsequently,",
    "As the field evolved,", "Building on this,",
  ],
  sectionTransitions: {
    definition: {
      property: "With that foundation in place, the specific characteristics that define this topic are worth examining.",
      historical: "To understand why it works this way today, some historical context is valuable.",
      procedural: "With the concept clear, the next step is understanding how to apply it.",
      rule: "Understanding the definition makes the governing principles easier to follow.",
      warning: "With the fundamentals established, there are some important considerations to keep in mind.",
    },
    property: {
      historical: "These characteristics did not emerge by accident — the history explains how they developed.",
      procedural: "Knowing these properties makes the practical steps easier to follow.",
      rule: "These characteristics directly inform the principles that guide correct usage.",
      warning: "While these properties are useful, there are situations where care is required.",
    },
    procedural: {
      rule: "Alongside these steps, certain principles consistently improve outcomes.",
      warning: "When following this process, some common pitfalls are worth knowing in advance.",
    },
  },
  summaryCloser: (s) => `This page covered the essential aspects of ${s} — from its core definition and key characteristics through to practical application.`,
  readerOutcome: "You now have a solid understanding of this topic and how to work with it.",
};

// ─── Registry ─────────────────────────────────────────────────────────────────

const POLICY_REGISTRY: Record<string, CompositionPolicy> = {
  technology:         TECHNOLOGY_POLICY,
  business:           BUSINESS_POLICY,
  "personal-finance": FINANCE_POLICY,
  education:          EDUCATION_POLICY,
  "health-wellness":  HEALTH_POLICY,
  "home-lifestyle":   HOME_POLICY,
  travel:             TRAVEL_POLICY,
};

export function getCompositionPolicy(category: string): CompositionPolicy {
  return POLICY_REGISTRY[category] ?? DEFAULT_POLICY;
}
