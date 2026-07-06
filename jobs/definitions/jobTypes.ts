export const JOB_TYPES = {
  CONTENT_GENERATION: "content_generation",
  TRANSLATION: "translation",
  CONTENT_UPDATE: "content_update",
  SEO_OPTIMIZATION: "seo_optimization",
  INTERNAL_LINKING: "internal_linking",
  AFFILIATE_OPTIMIZATION: "affiliate_optimization",
  FACT_CHECK: "fact_check",
  PERFORMANCE_AGGREGATION: "performance_aggregation",
  KNOWLEDGE_ACQUISITION: "knowledge_acquisition",
} as const;

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];

export const JOB_PRIORITIES = {
  CRITICAL: 100,
  HIGH: 75,
  MEDIUM: 50,
  LOW: 25,
  BACKGROUND: 10,
} as const;

export interface JobDefinition {
  type: JobType;
  description: string;
  priority: number;
  maxRetries: number;
  timeoutSeconds: number;
}

export const JOB_DEFINITIONS: Record<JobType, JobDefinition> = {
  [JOB_TYPES.CONTENT_GENERATION]: {
    type: JOB_TYPES.CONTENT_GENERATION,
    description: "Generate new content drafts from outlines or AI prompts",
    priority: JOB_PRIORITIES.MEDIUM,
    maxRetries: 3,
    timeoutSeconds: 300,
  },
  [JOB_TYPES.TRANSLATION]: {
    type: JOB_TYPES.TRANSLATION,
    description: "Translate content objects into target languages",
    priority: JOB_PRIORITIES.MEDIUM,
    maxRetries: 3,
    timeoutSeconds: 300,
  },
  [JOB_TYPES.CONTENT_UPDATE]: {
    type: JOB_TYPES.CONTENT_UPDATE,
    description: "Refresh existing content with new facts or revisions",
    priority: JOB_PRIORITIES.HIGH,
    maxRetries: 3,
    timeoutSeconds: 300,
  },
  [JOB_TYPES.SEO_OPTIMIZATION]: {
    type: JOB_TYPES.SEO_OPTIMIZATION,
    description: "Optimize titles, descriptions, and structured data",
    priority: JOB_PRIORITIES.MEDIUM,
    maxRetries: 2,
    timeoutSeconds: 180,
  },
  [JOB_TYPES.INTERNAL_LINKING]: {
    type: JOB_TYPES.INTERNAL_LINKING,
    description: "Suggest and insert internal links between knowledge objects",
    priority: JOB_PRIORITIES.LOW,
    maxRetries: 2,
    timeoutSeconds: 600,
  },
  [JOB_TYPES.AFFILIATE_OPTIMIZATION]: {
    type: JOB_TYPES.AFFILIATE_OPTIMIZATION,
    description: "Match affiliate products to relevant content",
    priority: JOB_PRIORITIES.LOW,
    maxRetries: 2,
    timeoutSeconds: 180,
  },
  [JOB_TYPES.FACT_CHECK]: {
    type: JOB_TYPES.FACT_CHECK,
    description: "Verify factual claims against trusted sources",
    priority: JOB_PRIORITIES.HIGH,
    maxRetries: 2,
    timeoutSeconds: 300,
  },
  [JOB_TYPES.PERFORMANCE_AGGREGATION]: {
    type: JOB_TYPES.PERFORMANCE_AGGREGATION,
    description: "Aggregate daily performance metrics",
    priority: JOB_PRIORITIES.BACKGROUND,
    maxRetries: 1,
    timeoutSeconds: 600,
  },
  [JOB_TYPES.KNOWLEDGE_ACQUISITION]: {
    type: JOB_TYPES.KNOWLEDGE_ACQUISITION,
    description: "Populate knowledge package with facts, citations, and relationships",
    priority: JOB_PRIORITIES.HIGH,
    maxRetries: 3,
    timeoutSeconds: 600,
  },
};
