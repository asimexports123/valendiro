/**
 * Rendering Layer — Type Definitions
 *
 * Document Tree block model, render configuration, diagnostics, and quality scoring.
 * Implements the frozen Rendering Architecture v1.0.
 */

// ─── Document Tree Nodes ─────────────────────────────────────────────────────

export type DocumentNode =
  | HeadingNode
  | ParagraphNode
  | ListNode
  | ListItemNode
  | CodeBlockNode
  | BlockquoteNode
  | TableNode
  | CitationRefNode
  | CitationBlockNode
  | InternalLinkNode
  | DividerNode
  | MetadataNode
  | MissingKnowledgeNode
  | ImagePlaceholderNode
  | CommercialPlaceholderNode
  | CalloutNode
  | TableOfContentsNode
  | SummaryNode
  | QuickSummaryNode
  | KeyTakeawaysNode
  | ProTipNode
  | DidYouKnowNode
  | CommonMistakeNode
  | ExpertInsightNode
  | RememberThisNode
  | ComparisonTableNode
  | ProsConsNode
  | ChecklistNode
  | TimelineNode
  | FrameworkBoxNode
  | HeroSummaryNode
  | QuickAnswerNode
  | DecisionBoxNode;

export interface HeadingNode {
  type: "heading";
  level: 1 | 2 | 3 | 4;
  text: string;
  anchor: string;
}

export interface ParagraphNode {
  type: "paragraph";
  children: InlineNode[];
}

export interface ListNode {
  type: "list";
  ordered: boolean;
  items: ListItemNode[];
}

export interface ListItemNode {
  type: "list-item";
  children: InlineNode[];
}

export interface CodeBlockNode {
  type: "code-block";
  language: string;
  code: string;
}

export interface BlockquoteNode {
  type: "blockquote";
  children: DocumentNode[];
}

export interface TableNode {
  type: "table";
  headers: string[];
  rows: string[][];
}

export interface CitationRefNode {
  type: "citation-ref";
  index: number;
  citationId: string;
}

export interface CitationBlockNode {
  type: "citation-block";
  entries: CitationEntry[];
}

export interface InternalLinkNode {
  type: "internal-link";
  targetSlug: string;
  text: string;
  relationship: string;
  strength: string;
}

export interface DividerNode {
  type: "divider";
}

export interface MetadataNode {
  type: "metadata";
  key: string;
  value: string;
}

export interface MissingKnowledgeNode {
  type: "missing-knowledge";
  expectedFactType: string;
  sectionName: string;
  severity: "critical" | "recommended" | "optional";
}

export interface ImagePlaceholderNode {
  type: "image-placeholder";
  altText: string;
  context: string;
  suggestedType: "diagram" | "screenshot" | "chart" | "illustration" | "photo";
  width: "full" | "half" | "inline";
}

export interface CommercialPlaceholderNode {
  type: "commercial-placeholder";
  placement: "top" | "mid" | "bottom" | "sidebar";
  context: string;
  category: string;
  reserved: true;
}

export interface CalloutNode {
  type: "callout";
  variant: "info" | "warning" | "tip" | "important" | "example";
  title: string | null;
  children: DocumentNode[];
}

export interface TableOfContentsNode {
  type: "table-of-contents";
  entries: { text: string; anchor: string; level: number }[];
}

export interface SummaryNode {
  type: "summary";
  keyPoints: string[];
  closingSentence: string;
}

export interface QuickSummaryNode {
  type: "quick-summary";
  content: string[];
}

export interface KeyTakeawaysNode {
  type: "key-takeaways";
  items: string[];
}

export interface ProTipNode {
  type: "pro-tip";
  content: string;
  context?: string;
}

export interface DidYouKnowNode {
  type: "did-you-know";
  fact: string;
}

export interface CommonMistakeNode {
  type: "common-mistake";
  mistake: string;
  correction: string;
}

export interface ExpertInsightNode {
  type: "expert-insight";
  insight: string;
  source?: string;
}

export interface RememberThisNode {
  type: "remember-this";
  point: string;
}

export interface ComparisonTableNode {
  type: "comparison-table";
  items: {
    name: string;
    values: string[];
  }[];
  headers: string[];
}

export interface ProsConsNode {
  type: "pros-cons";
  pros: string[];
  cons: string[];
}

export interface ChecklistNode {
  type: "checklist";
  items: {
    text: string;
    checked?: boolean;
  }[];
}

export interface TimelineNode {
  type: "timeline";
  events: {
    title: string;
    description: string;
    date?: string;
  }[];
}

export interface FrameworkBoxNode {
  type: "framework-box";
  title: string;
  components: string[];
  description?: string;
}

export interface HeroSummaryNode {
  type: "hero-summary";
  definition: string;
  whyItMatters: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  readingTime: string;
  audience: string;
  learningObjectives: string[];
  prerequisites: string[];
}

export interface QuickAnswerNode {
  type: "quick-answer";
  answer: string;
  context?: string;
}

export interface DecisionBoxNode {
  type: "decision-box";
  question: string;
  options: {
    option: string;
    whenToChoose: string;
    considerations: string[];
  }[];
}

export interface CitationEntry {
  index: number;
  sourceName: string;
  sourceUrl: string | null;
  authority: string;
  retrievedAt: string;
}

export type InlineNode =
  | string
  | CitationRefNode
  | InternalLinkNode
  | BoldNode
  | ItalicNode
  | CodeNode;

export interface BoldNode {
  type: "bold";
  text: string;
}

export interface ItalicNode {
  type: "italic";
  text: string;
}

export interface CodeNode {
  type: "code";
  text: string;
}

// ─── Render Configuration ────────────────────────────────────────────────────

export type OutputFormat = "html" | "markdown" | "json";

/**
 * The primary job of the page. Every topic is assigned one dominant intent
 * which drives section order, heading language, and prose connectors.
 *
 * inform   — reference material, definitions, specifications
 * educate  — tutorials, explanations, learning guides
 * guide    — step-by-step, planning, decision support
 * decide   — comparisons, tradeoffs, "which should I choose"
 */
export type PageIntent = "inform" | "educate" | "guide" | "decide";

export interface RendererConfig {
  rendererId: string;         // "long-article-v1", "faq-v1"
  rendererVersion: string;    // "1.0.0"
  templateVersion: string;    // "1.0.0"
  format: OutputFormat;
  style: string[];            // ["intermediate"], ["expert", "concise"]
  slug: string;
  intent: PageIntent;         // primary page job — drives composition
  category: string;           // category slug e.g. "technology", "travel"
}

// ─── Render Rules Engine ─────────────────────────────────────────────────────

export interface BlockPriority {
  sectionType: string;
  priority: number;
  required: boolean;
  minFacts: number;
  maxFacts: number | null;
}

export interface MissingKnowledgeFlag {
  factType: string;
  sectionName: string;
  severity: "critical" | "recommended" | "optional";
  suggestion: string;
}

export interface RenderingPolicy {
  id: string;
  name: string;
  categoryMatch: string[];
  requiredFactTypes: string[];
  preferredFormat: string;
  preferredStyle: string[];
  minFactCount: number;
  minCitationCount: number;
  sectionOverrides: BlockPriority[];
  commercialPlaceholders: boolean;
}

export interface RenderDecision {
  eligible: boolean;
  reason: string | null;
  policy: RenderingPolicy;
  blockOrder: BlockPriority[];
  missingKnowledge: MissingKnowledgeFlag[];
  warnings: string[];
}

// ─── Quality Score ───────────────────────────────────────────────────────────

export interface RenderQualityScore {
  overall: number;
  intent?: string;
  category?: string;
  educationalDepth?: number;
  learningProgression?: number;
  knowledgeGraph?: number;
  readerJourney?: number;
  contentDensity?: number;
  retentionFactors?: number;
  citationCoverage?: number;
  missingKnowledgeCount: number;
  missingKnowledgeSeverity: Record<string, number>;
  wordCount: number;
  sectionCount: number;
  internalLinkCount: number;
  citationCount: number;
  readingFlow: ReadingFlowMetrics;
}

export interface ReadingFlowMetrics {
  repeatedOpenings: number;
  paragraphLengthBalance: number;
  headingDensity: number;
  bulletListRatio: number;
  transitionQuality: number;
  sentenceVariety: number;
  overallFlowScore: number;
}

// ─── Render Diagnostics ──────────────────────────────────────────────────────

export interface RenderDiagnostics {
  rendererId: string;
  rendererVersion: string;
  templateVersion: string;
  packageSlug: string;
  knowledgeHash: string;
  cacheKey: string;

  // Timing
  renderDurationMs: number;
  rulesEvaluationMs: number;
  citationRenderMs: number;
  serializationMs: number;

  // Coverage
  factsTotal: number;
  factsUsed: number;
  factsSkipped: string[];
  citationsTotal: number;
  citationsReferenced: number;

  // Quality
  qualityScore: RenderQualityScore;
  missingKnowledge: MissingKnowledgeFlag[];

  // Decisions
  policyApplied: string;
  blockOrder: BlockPriority[];
  templateSelectionsUsed: number;
  variantSeed: string;

  // Warnings
  warnings: string[];
}

// ─── Rendered Output ─────────────────────────────────────────────────────────

export interface RenderedOutputRow {
  id: string;
  package_id: string;
  knowledge_hash: string;
  renderer_id: string;
  renderer_version: string;
  template_version: string;
  output_format: OutputFormat;
  style: string[];
  cache_key: string;
  content: string;
  document_tree: object;
  word_count: number;
  section_count: number;
  citation_count: number;
  quality_score: RenderQualityScore;
  diagnostics: RenderDiagnostics;
  render_duration_ms: number;
  status: "draft" | "published" | "stale" | "failed";
  created_at: string;
  updated_at: string;
}

// ─── Plugin Interface ────────────────────────────────────────────────────────

export interface RendererPlugin {
  id: string;
  name: string;
  version: string;
  sectionTypes: string[];
  render(facts: PluginFact[], config: PluginConfig): DocumentNode[];
}

export interface PluginFact {
  id: string;
  statement: string;
  factType: string;
  confidence: string;
  scope: string;
  tags: string[];
  domain: string | null;
}

export interface PluginConfig {
  style: string[];
  maxFacts: number | null;
  slug: string;
  sectionIndex: number;
}

// ─── Renderer Strategy ───────────────────────────────────────────────────────

export interface RenderStrategy {
  name: string;
  version: string;
  render(
    facts: PluginFact[],
    citations: CitationInput[],
    relationships: RelationshipInput[],
    config: RendererConfig,
    decision: RenderDecision
  ): DocumentNode[];
}

export interface CitationInput {
  id: string;
  sourceName: string;
  sourceUrl: string | null;
  adapterName: string;
  sourceAuthority: string;
  retrievedAt: string;
}

export interface RelationshipInput {
  id: string;
  sourceId: string;
  targetId: string;
  relationshipType: string;
  strength: string;
  explanation: string | null;
  bidirectional: boolean;
}

// ─── Knowledge Package ───────────────────────────────────────────────────────────

/**
 * Canonical Knowledge Package object
 *
 * Phase 30.1: Structured Knowledge Package Schema
 * The Knowledge Package is the Single Source of Truth for all content.
 * Every component must either produce, validate, consume, or render Knowledge Packages.
 *
 * The renderer and Knowledge Authoring Engine receive this object.
 * The loader is responsible for assembling it from the database.
 * The renderer must never query database tables directly.
 */

export interface StructuredDefinition {
  id: string;
  term: string;
  definition: string;
  context?: string;
  confidence: string;
  sourceId?: string;
}

export interface StructuredConcept {
  id: string;
  name: string;
  description: string;
  category?: string;
  confidence: string;
  sourceId?: string;
}

export interface StructuredProcedure {
  id: string;
  name: string;
  steps: string[];
  prerequisites?: string[];
  confidence: string;
  sourceId?: string;
}

export interface StructuredExample {
  id: string;
  title: string;
  description: string;
  code?: string;
  output?: string;
  confidence: string;
  sourceId?: string;
}

export interface StructuredComparison {
  id: string;
  items: {
    name: string;
    attributes: Record<string, string>;
  }[];
  criteria: string[];
  confidence: string;
  sourceId?: string;
}

export interface StructuredCommand {
  id: string;
  command: string;
  description: string;
  parameters?: Record<string, string>;
  confidence: string;
  sourceId?: string;
}

export interface StructuredFormula {
  id: string;
  name: string;
  formula: string;
  description: string;
  variables?: Record<string, string>;
  confidence: string;
  sourceId?: string;
}

export interface StructuredWarning {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  sourceId?: string;
}

export interface StructuredBestPractice {
  id: string;
  title: string;
  description: string;
  confidence: string;
  sourceId?: string;
}

export interface StructuredCommonMistake {
  id: string;
  mistake: string;
  correction: string;
  confidence: string;
  sourceId?: string;
}

export interface StructuredFAQ {
  id: string;
  question: string;
  answer: string;
  confidence: string;
  sourceId?: string;
}

export interface StructuredReference {
  id: string;
  title: string;
  url?: string;
  author?: string;
  year?: number;
}

export interface SourceMetadata {
  adapterName: string;
  adapterVersion: string;
  sourceType: "json" | "csv" | "rss" | "feedly" | "official-docs" | "api" | "legacy";
  retrievedAt: string;
  processedAt: string;
  validationStatus: "valid" | "invalid" | "partial";
  validationErrors?: string[];
}

export interface KnowledgePackage {
  id: string;
  slug: string;
  knowledgeHash: string;
  topicId: string | null;
  category: string;
  intent: "inform" | "educate" | "guide" | "decide";
  
  // Structured knowledge collections (Phase 30.1)
  definitions: StructuredDefinition[];
  concepts: StructuredConcept[];
  procedures: StructuredProcedure[];
  examples: StructuredExample[];
  comparisons: StructuredComparison[];
  commands: StructuredCommand[];
  formulae: StructuredFormula[];
  warnings: StructuredWarning[];
  bestPractices: StructuredBestPractice[];
  commonMistakes: StructuredCommonMistake[];
  faqs: StructuredFAQ[];
  references: StructuredReference[];
  
  // Legacy facts for backward compatibility (to be migrated)
  facts: PluginFact[];
  citations: CitationInput[];
  relationships: RelationshipInput[];
  
  // Metadata
  metadata: {
    sourceCount: number;
    factCount: number;
    relationshipCount: number;
    lastUpdated: string;
    lastVerified: string | null;
    confidence: string;
    sourceMetadata: SourceMetadata;
  };
}
