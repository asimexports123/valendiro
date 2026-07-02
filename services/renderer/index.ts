/**
 * Renderer — Public API
 */

export { render } from "./orchestrator";
export type { RenderRequest, RenderResult } from "./orchestrator";
export { evaluate } from "./rulesEngine";
export { computeCacheKey, checkCache, markStale } from "./cacheManager";
export { serializeToHTML } from "./serializers/html";
export { serializeToMarkdown } from "./serializers/markdown";
export { scoreQuality } from "./qualityScorer";
export { validateReadingFlow } from "./readingFlowValidator";
export { decorateWithCitations } from "./citationRenderer";
export { decorateWithLinks } from "./linkRenderer";
export type {
  DocumentNode,
  RendererConfig,
  RenderDecision,
  RenderQualityScore,
  ReadingFlowMetrics,
  RenderDiagnostics,
  RenderedOutputRow,
  OutputFormat,
} from "./types";
