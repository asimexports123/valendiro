/**
 * Renderer — Public API
 */

export { render } from "./orchestrator";
export type { RenderRequest, RenderResult } from "./orchestrator";
export { evaluate } from "./rulesEngine";
export { computeCacheKey, checkCache } from "./cacheManager";
export { markOutputsStaleByPackageId as markStale } from "@/services/render/writers";
export { serializeToHTML } from "./serializers/html";
export { serializeToMarkdown } from "./serializers/markdown";
export {
  CANONICAL_OUTPUT_FORMAT,
  serializeCanonicalProjection,
  validateCanonicalContent,
} from "./serializers/canonical";
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
