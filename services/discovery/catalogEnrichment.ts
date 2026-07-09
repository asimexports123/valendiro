/**
 * Catalog enrichment — fuel accumulation only.
 * Original publish goes through catalogOriginalPublish (rewrite, not copy).
 */

export {
  publishOriginalCatalogBatch as enrichThinCatalog,
  type OriginalPublishResult as EnrichmentResult,
} from "./catalogOriginalPublish";
