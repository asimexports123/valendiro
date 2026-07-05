/**
 * Phase 32B: Knowledge Connectors
 * 
 * Separation of Concerns:
 * - Connector: Only retrieves source data
 * - Extractor: Understands source formats
 * - Normalizer: Produces canonical Knowledge Packages
 */

/**
 * Connector Interface
 * Connectors only retrieve source data from external sources
 */
export interface ConnectorConfig {
  sourceType: "local-json" | "wikipedia" | "official-docs" | "rss" | "html";
  sourceUrl?: string;
  apiKey?: string;
  timeout?: number;
}

export interface ConnectorResult {
  success: boolean;
  data: string | object | null;
  contentType: "json" | "html" | "xml" | "text";
  sourceUrl: string;
  error: string | null;
  metadata: {
    retrievedAt: string;
    contentType: string;
    size: number;
  };
}

export interface IConnector {
  readonly sourceType: string;
  connect(config: ConnectorConfig): Promise<ConnectorResult>;
  validateSource(config: ConnectorConfig): boolean;
}

/**
 * Extractor Interface
 * Extractors understand source formats and extract structured knowledge
 */
export interface ExtractorConfig {
  sourceType: string;
  contentType: "json" | "html" | "xml" | "text";
  extractRules?: Record<string, any>;
}

export interface ExtractedKnowledge {
  definitions: Array<{ term: string; definition: string; context?: string }>;
  concepts: Array<{ name: string; description: string; category?: string }>;
  procedures: Array<{ name: string; steps: string[]; prerequisites?: string[] }>;
  examples: Array<{ title: string; description: string; code?: string; output?: string }>;
  comparisons: Array<{ items: string[]; criteria: string[] }>;
  commands: Array<{ command: string; description: string; parameters?: string[] }>;
  formulae: Array<{ name: string; formula: string; description: string; variables?: string[] }>;
  warnings: Array<{ title: string; description: string; severity: "low" | "medium" | "high" }>;
  bestPractices: Array<{ title: string; description: string }>;
  commonMistakes: Array<{ mistake: string; correction: string }>;
  faqs: Array<{ question: string; answer: string }>;
  references: Array<{ url: string; title: string; author?: string }>;
  metadata: {
    sourceUrl: string;
    extractedAt: string;
    confidence: number;
  };
}

export interface ExtractorResult {
  success: boolean;
  knowledge: ExtractedKnowledge | null;
  error: string | null;
  warnings: string[];
}

export interface IExtractor {
  readonly sourceType: string;
  readonly contentType: string;
  extract(data: string | object, config: ExtractorConfig): Promise<ExtractorResult>;
  validateData(data: string | object): boolean;
}

/**
 * Normalizer Interface
 * Normalizers produce canonical Knowledge Packages from extracted knowledge
 */
export interface NormalizerConfig {
  topicSlug: string;
  category: string;
  intent: "inform" | "educate" | "guide" | "decide";
  minConfidence?: number;
}

export interface NormalizerResult {
  success: boolean;
  knowledgePackage: any | null;
  error: string | null;
  warnings: string[];
}

export interface INormalizer {
  normalize(knowledge: ExtractedKnowledge, config: NormalizerConfig): Promise<NormalizerResult>;
  validateKnowledge(knowledge: ExtractedKnowledge): boolean;
}
