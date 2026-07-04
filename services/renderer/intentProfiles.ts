// ─── Intent-Aware Knowledge Quality Engine ─────────────────────────────────────
// Phase 20.3: Intent Profiles - Category-Specific Scoring Weights

import { KnowledgeCategory, KnowledgeIntent } from "./intentClassifier";

/**
 * Quality Metric Types
 */
export type QualityMetric =
  | "conceptClarity"
  | "accuracy"
  | "examples"
  | "implementation"
  | "bestPractices"
  | "decisionSupport"
  | "frameworks"
  | "caseStudies"
  | "comparisons"
  | "strategy"
  | "actionability"
  | "riskAwareness"
  | "tradeoffs"
  | "longTermPlanning"
  | "inspiration"
  | "planning"
  | "localKnowledge"
  | "practicalTips"
  | "budgetGuidance"
  | "safety"
  | "memorableExperiences"
  | "practicalUsefulness"
  | "stepByStep"
  | "maintenance"
  | "diy"
  | "prevention"
  | "evidence"
  | "medicalDisclaimers"
  | "teachingQuality"
  | "learningProgression"
  | "universalAccuracy"
  | "trustworthiness"
  | "readability"
  | "knowledgeGraph"
  | "structure"
  | "noRepetition"
  | "navigation";

/**
 * Intent Profile - defines how to score based on intent
 */
export interface IntentProfile {
  intent: KnowledgeIntent;
  category: KnowledgeCategory;
  metrics: Record<QualityMetric, number>;
  description: string;
}

/**
 * Universal Metrics (apply to all categories)
 */
const UNIVERSAL_METRICS: Record<QualityMetric, number> = {
  universalAccuracy: 15,
  trustworthiness: 10,
  readability: 10,
  knowledgeGraph: 8,
  structure: 7,
  noRepetition: 5,
  navigation: 5,
  // Category-specific metrics (set to 0 here, overridden in profiles)
  conceptClarity: 0,
  accuracy: 0,
  examples: 0,
  implementation: 0,
  bestPractices: 0,
  decisionSupport: 0,
  frameworks: 0,
  caseStudies: 0,
  comparisons: 0,
  strategy: 0,
  actionability: 0,
  riskAwareness: 0,
  tradeoffs: 0,
  longTermPlanning: 0,
  inspiration: 0,
  planning: 0,
  localKnowledge: 0,
  practicalTips: 0,
  budgetGuidance: 0,
  safety: 0,
  memorableExperiences: 0,
  practicalUsefulness: 0,
  stepByStep: 0,
  maintenance: 0,
  diy: 0,
  prevention: 0,
  evidence: 0,
  medicalDisclaimers: 0,
  teachingQuality: 0,
  learningProgression: 0,
};

/**
 * Technology Profiles
 */
const TECHNOLOGY_PROFILES: IntentProfile[] = [
  {
    intent: "understand",
    category: "technology",
    description: "Concept clarity, technical accuracy, practical examples",
    metrics: {
      ...UNIVERSAL_METRICS,
      conceptClarity: 20,
      accuracy: 15,
      examples: 10,
      implementation: 10,
    },
  },
  {
    intent: "compare",
    category: "technology",
    description: "Side-by-side comparisons, trade-offs, decision support",
    metrics: {
      ...UNIVERSAL_METRICS,
      comparisons: 20,
      tradeoffs: 15,
      accuracy: 10,
      examples: 10,
    },
  },
  {
    intent: "execute",
    category: "technology",
    description: "Step-by-step implementation, practical guidance",
    metrics: {
      ...UNIVERSAL_METRICS,
      stepByStep: 20,
      implementation: 15,
      examples: 10,
      bestPractices: 10,
    },
  },
  {
    intent: "troubleshoot",
    category: "technology",
    description: "Problem-solving, error diagnosis, practical solutions",
    metrics: {
      ...UNIVERSAL_METRICS,
      actionability: 20,
      examples: 15,
      stepByStep: 10,
      accuracy: 10,
    },
  },
  {
    intent: "reference",
    category: "technology",
    description: "Quick lookup, accurate technical information",
    metrics: {
      ...UNIVERSAL_METRICS,
      accuracy: 25,
      structure: 15,
      navigation: 10,
      readability: 10,
    },
  },
];

/**
 * Business Profiles
 */
const BUSINESS_PROFILES: IntentProfile[] = [
  {
    intent: "decide",
    category: "business",
    description: "Decision support, frameworks, strategic thinking",
    metrics: {
      ...UNIVERSAL_METRICS,
      decisionSupport: 25,
      frameworks: 20,
      caseStudies: 10,
      comparisons: 10,
    },
  },
  {
    intent: "understand",
    category: "business",
    description: "Concept clarity, business principles, real-world application",
    metrics: {
      ...UNIVERSAL_METRICS,
      conceptClarity: 20,
      caseStudies: 15,
      frameworks: 10,
      examples: 10,
    },
  },
  {
    intent: "plan",
    category: "business",
    description: "Strategic planning, long-term thinking, actionable steps",
    metrics: {
      ...UNIVERSAL_METRICS,
      strategy: 20,
      longTermPlanning: 15,
      frameworks: 10,
      actionability: 10,
    },
  },
  {
    intent: "compare",
    category: "business",
    description: "Business model comparison, trade-offs analysis",
    metrics: {
      ...UNIVERSAL_METRICS,
      comparisons: 25,
      tradeoffs: 20,
      caseStudies: 10,
      frameworks: 10,
    },
  },
];

/**
 * Finance Profiles
 */
const FINANCE_PROFILES: IntentProfile[] = [
  {
    intent: "decide",
    category: "finance",
    description: "Financial decision support, risk awareness, trade-offs",
    metrics: {
      ...UNIVERSAL_METRICS,
      decisionSupport: 25,
      riskAwareness: 20,
      tradeoffs: 15,
      actionability: 10,
    },
  },
  {
    intent: "plan",
    category: "finance",
    description: "Financial planning, long-term strategy, budget guidance",
    metrics: {
      ...UNIVERSAL_METRICS,
      longTermPlanning: 25,
      budgetGuidance: 20,
      actionability: 10,
      strategy: 10,
    },
  },
  {
    intent: "understand",
    category: "finance",
    description: "Financial concepts, practical examples, risk education",
    metrics: {
      ...UNIVERSAL_METRICS,
      conceptClarity: 20,
      riskAwareness: 15,
      examples: 15,
      actionability: 10,
    },
  },
];

/**
 * Travel Profiles
 */
const TRAVEL_PROFILES: IntentProfile[] = [
  {
    intent: "travel",
    category: "travel",
    description: "Inspiration, planning, local insights, practical tips",
    metrics: {
      ...UNIVERSAL_METRICS,
      inspiration: 20,
      planning: 15,
      localKnowledge: 15,
      practicalTips: 10,
      memorableExperiences: 10,
    },
  },
  {
    intent: "discover",
    category: "travel",
    description: "Exploration, inspiration, cultural understanding",
    metrics: {
      ...UNIVERSAL_METRICS,
      inspiration: 25,
      localKnowledge: 20,
      memorableExperiences: 15,
      practicalTips: 10,
    },
  },
  {
    intent: "plan",
    category: "travel",
    description: "Trip planning, budget guidance, logistics",
    metrics: {
      ...UNIVERSAL_METRICS,
      planning: 25,
      budgetGuidance: 20,
      practicalTips: 15,
      localKnowledge: 10,
    },
  },
];

/**
 * Home Profiles
 */
const HOME_PROFILES: IntentProfile[] = [
  {
    intent: "solve",
    category: "home",
    description: "Practical problem-solving, step-by-step guidance",
    metrics: {
      ...UNIVERSAL_METRICS,
      practicalUsefulness: 25,
      stepByStep: 20,
      diy: 15,
      safety: 10,
    },
  },
  {
    intent: "buy",
    category: "home",
    description: "Purchase guidance, comparisons, practical advice",
    metrics: {
      ...UNIVERSAL_METRICS,
      decisionSupport: 25,
      comparisons: 20,
      practicalUsefulness: 15,
      actionability: 10,
    },
  },
  {
    intent: "execute",
    category: "home",
    description: "DIY guidance, maintenance tips, practical instructions",
    metrics: {
      ...UNIVERSAL_METRICS,
      stepByStep: 25,
      diy: 20,
      practicalUsefulness: 15,
      safety: 10,
    },
  },
];

/**
 * Health Profiles
 */
const HEALTH_PROFILES: IntentProfile[] = [
  {
    intent: "understand",
    category: "health",
    description: "Accurate health information, clarity, prevention",
    metrics: {
      ...UNIVERSAL_METRICS,
      accuracy: 25,
      conceptClarity: 20,
      prevention: 15,
      evidence: 10,
    },
  },
  {
    intent: "reference",
    category: "health",
    description: "Quick health reference, trustworthy information",
    metrics: {
      ...UNIVERSAL_METRICS,
      accuracy: 30,
      trustworthiness: 20,
      structure: 10,
      navigation: 10,
    },
  },
];

/**
 * Education Profiles
 * Only Education should maximize traditional teaching quality
 */
const EDUCATION_PROFILES: IntentProfile[] = [
  {
    intent: "learn",
    category: "education",
    description: "Teaching quality, learning progression, educational depth",
    metrics: {
      ...UNIVERSAL_METRICS,
      teachingQuality: 30,
      learningProgression: 20,
      conceptClarity: 15,
      examples: 10,
    },
  },
];

/**
 * All Intent Profiles
 */
const ALL_PROFILES: IntentProfile[] = [
  ...TECHNOLOGY_PROFILES,
  ...BUSINESS_PROFILES,
  ...FINANCE_PROFILES,
  ...TRAVEL_PROFILES,
  ...HOME_PROFILES,
  ...HEALTH_PROFILES,
  ...EDUCATION_PROFILES,
];

/**
 * Get intent profile for a given intent and category
 */
export function getIntentProfile(intent: KnowledgeIntent, category: KnowledgeCategory): IntentProfile {
  const profile = ALL_PROFILES.find(p => p.intent === intent && p.category === category);
  
  if (!profile) {
    // Fall back to category's default profile
    const defaultIntent = getDefaultIntentForCategory(category);
    const defaultProfile = ALL_PROFILES.find(p => p.intent === defaultIntent && p.category === category);
    
    if (defaultProfile) {
      return defaultProfile;
    }
    
    // Ultimate fallback to education profile
    return EDUCATION_PROFILES[0];
  }
  
  return profile;
}

/**
 * Get default intent for a category
 */
function getDefaultIntentForCategory(category: KnowledgeCategory): KnowledgeIntent {
  const defaults: Record<KnowledgeCategory, KnowledgeIntent> = {
    technology: "understand",
    business: "decide",
    finance: "decide",
    travel: "travel",
    home: "solve",
    health: "understand",
    education: "learn",
  };
  
  return defaults[category];
}
