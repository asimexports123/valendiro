/**
 * @architecture-frozen — Knowledge ingest types (Phase 1).
 * Phase 2 will extend KnowledgeAssetDraft; persist layer maps to discovered_articles unchanged.
 */

export const KNOWLEDGE_ASSET_SCHEMA_VERSION = "1.0" as const;

export interface RegisteredKnowledgeSource {
  id: string;
  source_type: string;
  name: string;
  url: string | null;
  config: Record<string, unknown>;
  fetch_interval_minutes?: number;
  status: string;
}

export interface RawFetchItem {
  external_id: string;
  raw: unknown;
  fetched_at: string;
}

export interface RawFetchBatch {
  items: RawFetchItem[];
  next_cursor?: string;
}

/** Normalized ingest draft — persisted to discovered_articles (Phase 1 bridge). */
export interface KnowledgeAssetDraft {
  schema_version: typeof KNOWLEDGE_ASSET_SCHEMA_VERSION;
  external_id: string;
  title: string;
  content: string;
  summary: string;
  url: string;
  published_at: string | null;
  author: string;
  metadata: Record<string, unknown>;
  provenance: {
    connector_type: string;
    connector_version: string;
    adapter_type: string;
    adapter_version: string;
  };
}

export interface ReferencedSource {
  name: string;
  url: string;
}

export interface KnowledgeConnector {
  readonly connector_type: string;
  readonly connector_version: string;
  prepare?(source: RegisteredKnowledgeSource): Promise<void>;
  fetch(source: RegisteredKnowledgeSource): Promise<RawFetchBatch>;
}

export interface KnowledgeSourceAdapter {
  readonly adapter_type: string;
  readonly adapter_version: string;
  normalize(raw: RawFetchItem, source: RegisteredKnowledgeSource): KnowledgeAssetDraft;
}

export interface KnowledgeIngestResult {
  saved: number;
  duplicates: number;
  errors: number;
  failed: number;
}

export function toRegisteredKnowledgeSource(row: Record<string, unknown>): RegisteredKnowledgeSource {
  return {
    id: String(row.id),
    source_type: String(row.source_type ?? row.adapter_type ?? ""),
    name: String(row.name ?? ""),
    url: row.url != null ? String(row.url) : null,
    config: (row.config as Record<string, unknown>) ?? {},
    fetch_interval_minutes:
      typeof row.fetch_interval_minutes === "number" ? row.fetch_interval_minutes : undefined,
    status: String(row.status ?? "active"),
  };
}
