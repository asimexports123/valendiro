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
  characteristicsLabel: "How does it work?",
  practicalLabel: "How do you implement it?",
  historyLabel: "How did it evolve?",
  comparisonLabel: "How does it compare to alternatives?",
  warningLabel: "What mistakes should you avoid?",
  ruleLabel: "What are the best practices?",
  definitionOpeners: [
    (s) => `**${s}** is`,
    (s) => `At its core, **${s}** is`,
    (s) => `**${s}** refers to`,
    (s) => `In software development, **${s}** is`,
    (s) => `**${s}** can be understood as`,
  ],
  propertyLeads: [],
  factConnectors: [
    "Specifically,", "In particular,", "Under the hood,",
    "From an implementation standpoint,", "Technically,",
    "In practice,", "A key aspect is that",
  ],
  historyBridges: [
    "This led to", "As the technology matured,", "Over time,",
    "Building on this foundation,", "The community then",
  ],
  sectionTransitions: {},
  summaryCloser: (s) => "",
  readerOutcome: "",
};

const BUSINESS_POLICY: CompositionPolicy = {
  intent: "guide",
  category: "business",
  sectionOrder: ["definition", "property", "procedural", "rule", "comparison", "historical", "warning", "measurement", "causal"],
  primaryHeadingLabel: "What Is",
  characteristicsLabel: "What are the key components?",
  practicalLabel: "How do you implement this?",
  historyLabel: "What's the business context?",
  comparisonLabel: "How do you compare options?",
  warningLabel: "What risks should you avoid?",
  ruleLabel: "What principles drive results?",
  definitionOpeners: [
    (s) => `**${s}** is`,
    (s) => `In business, **${s}** refers to`,
    (s) => `**${s}** describes`,
    (s) => `At its core, **${s}** is`,
    (s) => `For any organisation, **${s}** is`,
  ],
  propertyLeads: [],
  factConnectors: [
    "In practice,", "From an operational standpoint,",
    "Critically,", "A common approach is that",
    "For most organisations,", "At scale,",
  ],
  historyBridges: [
    "This shaped how the field evolved.", "Over time,", "As businesses scaled,",
    "This insight led to", "The market then",
  ],
  sectionTransitions: {},
  summaryCloser: (s) => "",
  readerOutcome: "",
};

const FINANCE_POLICY: CompositionPolicy = {
  intent: "guide",
  category: "personal-finance",
  sectionOrder: ["definition", "property", "procedural", "rule", "measurement", "comparison", "warning", "historical", "causal"],
  primaryHeadingLabel: "What Is",
  characteristicsLabel: "How does this work?",
  practicalLabel: "How do you apply this?",
  historyLabel: "What's the background?",
  comparisonLabel: "How do you compare options?",
  warningLabel: "What mistakes should you avoid?",
  ruleLabel: "What are the guiding principles?",
  definitionOpeners: [
    (s) => `**${s}** is`,
    (s) => `In personal finance, **${s}** refers to`,
    (s) => `**${s}** is a financial concept that describes`,
    (s) => `Simply put, **${s}** is`,
    (s) => `**${s}** is the practice of`,
  ],
  propertyLeads: [],
  factConnectors: [
    "In practice,", "Financially speaking,", "Over time,",
    "For most people,", "The key implication is that",
    "Concretely,", "Numerically,",
  ],
  historyBridges: [
    "This evolved from", "Over decades,", "As markets developed,",
    "Financial research later showed that", "This insight led to",
  ],
  sectionTransitions: {},
  summaryCloser: (s) => "",
  readerOutcome: "",
};

const EDUCATION_POLICY: CompositionPolicy = {
  intent: "educate",
  category: "education",
  sectionOrder: ["definition", "property", "historical", "procedural", "rule", "comparison", "warning", "measurement", "causal"],
  primaryHeadingLabel: "What Is",
  characteristicsLabel: "What are the key principles?",
  practicalLabel: "How do you apply this?",
  historyLabel: "Where did this come from?",
  comparisonLabel: "How do approaches compare?",
  warningLabel: "What mistakes should you avoid?",
  ruleLabel: "What are the evidence-based guidelines?",
  definitionOpeners: [
    (s) => `**${s}** is`,
    (s) => `In educational research, **${s}** refers to`,
    (s) => `**${s}** describes`,
    (s) => `**${s}** is a learning approach in which`,
    (s) => `At its core, **${s}** is`,
  ],
  propertyLeads: [],
  factConnectors: [
    "Research shows that", "In practice,", "Evidence suggests that",
    "Specifically,", "Studies confirm that", "Importantly,",
  ],
  historyBridges: [
    "This built on earlier research showing that", "Over time, the evidence pointed to",
    "Subsequent studies confirmed that", "As understanding developed,",
    "The research community then", "This finding led to",
  ],
  sectionTransitions: {},
  summaryCloser: (s) => "",
  readerOutcome: "",
};

const HEALTH_POLICY: CompositionPolicy = {
  intent: "inform",
  category: "health-wellness",
  sectionOrder: ["definition", "property", "rule", "measurement", "procedural", "historical", "warning", "comparison", "causal"],
  primaryHeadingLabel: "What Is",
  characteristicsLabel: "How does this affect the body?",
  practicalLabel: "What's the practical guidance?",
  historyLabel: "What does the research show?",
  comparisonLabel: "How do approaches compare?",
  warningLabel: "What considerations are important?",
  ruleLabel: "What are the evidence-based recommendations?",
  definitionOpeners: [
    (s) => `**${s}** is`,
    (s) => `In health and medicine, **${s}** refers to`,
    (s) => `**${s}** describes`,
    (s) => `Medically, **${s}** is defined as`,
    (s) => `**${s}** is a health concept that involves`,
  ],
  propertyLeads: [],
  factConnectors: [
    "Evidence shows that", "Research confirms that", "In clinical terms,",
    "Physiologically,", "Studies indicate that", "From a health standpoint,",
  ],
  historyBridges: [
    "Research later showed that", "Studies have since confirmed that",
    "The clinical evidence evolved to show", "Over decades of research,",
    "As the science developed,", "Subsequent evidence found that",
  ],
  sectionTransitions: {},
  summaryCloser: (s) => "",
  readerOutcome: "",
};

const HOME_POLICY: CompositionPolicy = {
  intent: "guide",
  category: "home-lifestyle",
  sectionOrder: ["definition", "procedural", "property", "rule", "warning", "comparison", "measurement", "historical", "causal"],
  primaryHeadingLabel: "What Is",
  characteristicsLabel: "What do you need to know?",
  practicalLabel: "What are the steps?",
  historyLabel: "What's the background?",
  comparisonLabel: "How do options compare?",
  warningLabel: "What mistakes should you avoid?",
  ruleLabel: "What are the guiding principles?",
  definitionOpeners: [
    (s) => `**${s}** is`,
    (s) => `**${s}** refers to`,
    (s) => `In the home, **${s}** means`,
    (s) => `Simply put, **${s}** is`,
    (s) => `**${s}** is the practice of`,
  ],
  propertyLeads: [],
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
  sectionTransitions: {},
  summaryCloser: (s) => "",
  readerOutcome: "",
};

const TRAVEL_POLICY: CompositionPolicy = {
  intent: "guide",
  category: "travel",
  sectionOrder: ["definition", "procedural", "property", "rule", "comparison", "warning", "measurement", "historical", "causal"],
  primaryHeadingLabel: "What Is",
  characteristicsLabel: "What do you need to know?",
  practicalLabel: "How do you plan and prepare?",
  historyLabel: "What's the context?",
  comparisonLabel: "How do options compare?",
  warningLabel: "What should you watch out for?",
  ruleLabel: "What are the practical tips?",
  definitionOpeners: [
    (s) => `**${s}** is`,
    (s) => `**${s}** refers to`,
    (s) => `In travel planning, **${s}** means`,
    (s) => `Simply put, **${s}** involves`,
    (s) => `**${s}** is the process of`,
  ],
  propertyLeads: [],
  factConnectors: [
    "In practice,", "When planning,", "On the ground,",
    "Logistically,", "For most travellers,", "Specifically,",
  ],
  historyBridges: [
    "This has evolved over time to become", "Experience has shown that",
    "Travellers have found that", "Over the years,",
    "This developed from", "Practically speaking,",
  ],
  sectionTransitions: {},
  summaryCloser: (s) => "",
  readerOutcome: "",
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
