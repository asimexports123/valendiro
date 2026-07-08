/**
 * @architecture-frozen — Ingest layer public exports.
 */

export * from "./types";
export { knowledgeSourceRegistry } from "./knowledgeSourceRegistry";
export {
  runKnowledgeIngestForSource,
  runKnowledgeIngestForSourceWithErrorHandling,
  toRegisteredKnowledgeSource,
} from "./knowledgeIngestOrchestrator";
export { persistDiscoveredArticleDrafts, persistKnowledgeAssetDrafts } from "./persistDiscoveredArticleDrafts";
export {
  KNOWLEDGE_ASSET_TABLE,
  DISCOVERED_ARTICLES_VIEW,
  draftToKnowledgeAssetInsert,
  rowToDiscoveredArticleLogical,
  legacyRowToKnowledgeAssetInsert,
  validateKnowledgeAssetBeforeSave,
  getReferencedSourcesFromPayload,
  buildReferencedSourcesFromDraft,
} from "./knowledgeAssetCompat";
export type {
  KnowledgeAssetRow,
  DiscoveredArticleLogical,
  AssetKind,
  KnowledgeAssetValidationResult,
} from "./knowledgeAssetCompat";
