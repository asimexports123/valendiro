/**
 * @architecture-frozen — Phase 2: knowledge_assets storage + discovered_articles compat.
 */

import type { KnowledgeAssetDraft, ReferencedSource } from "./types";

/** Canonical ingest table (replaces discovered_articles for writes). */
export const KNOWLEDGE_ASSET_TABLE = "knowledge_assets";

/**
 * @deprecated Read-only SQL view over knowledge_assets for legacy scripts.
 * Runtime services must use KNOWLEDGE_ASSET_TABLE.
 */
export const DISCOVERED_ARTICLES_VIEW = "discovered_articles";

export type AssetKind = "text" | "document" | "repository" | "dataset" | "media" | "structured" | "intent";

export interface KnowledgeAssetRow {
  id: string;
  source_id: string;
  external_id: string | null;
  schema_version: string;
  asset_kind: AssetKind;
  payload: Record<string, unknown>;
  labels: Record<string, unknown>;
  provenance: Record<string, unknown>;
  title: string;
  content: string | null;
  summary: string | null;
  url: string;
  published_at: string | null;
  author: string | null;
  metadata: Record<string, unknown> | null;
  status: string;
  relevance_score?: number | null;
  confidence_score?: number | null;
  rejection_reason?: string | null;
  processing_started_at?: string | null;
  processing_completed_at?: string | null;
  discovered_at?: string;
  created_at?: string;
  updated_at?: string;
}

/** Logical shape consumed by articlePipeline (unchanged). */
export interface DiscoveredArticleLogical {
  id: string;
  source_id: string;
  title: string;
  content: string | null;
  summary: string | null;
  url: string;
  status: string;
  processing_started_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface KnowledgeAssetValidationResult {
  valid: boolean;
  reason: string | null;
}

function normalizeReferencedSource(entry: unknown): ReferencedSource | null {
  if (!entry || typeof entry !== "object") return null;
  const record = entry as Record<string, unknown>;
  const url =
    typeof record.url === "string"
      ? record.url.trim()
      : typeof record.uri === "string"
        ? record.uri.trim()
        : "";
  if (!url) return null;
  const name =
    typeof record.name === "string" && record.name.trim()
      ? record.name.trim()
      : url;
  return { name, url };
}

/** Read referenced sources from payload (supports snake_case and legacy keys). */
export function getReferencedSourcesFromPayload(
  payload: Record<string, unknown> | null | undefined
): ReferencedSource[] {
  if (!payload) return [];
  const raw =
    payload.referenced_sources ??
    payload.referencedSources ??
    payload["Referenced Sources"];
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeReferencedSource)
    .filter((source): source is ReferencedSource => source !== null);
}

export function buildReferencedSourcesFromDraft(draft: KnowledgeAssetDraft): ReferencedSource[] {
  const fromMetadata = getReferencedSourcesFromPayload(draft.metadata as Record<string, unknown>);
  if (fromMetadata.length > 0) return fromMetadata;

  const url = draft.url?.trim();
  if (!url) return [];

  return [{ name: draft.title?.trim() || url, url }];
}

export function getPayloadText(payload: Record<string, unknown> | null | undefined): string {
  if (!payload) return "";
  return typeof payload.text === "string" ? payload.text.trim() : "";
}

/** Validate required KnowledgeAsset fields before persistence or publication. */
export function validateKnowledgeAssetBeforeSave(
  row: Pick<KnowledgeAssetRow, "payload">
): KnowledgeAssetValidationResult {
  const text = getPayloadText(row.payload);
  if (!text) {
    return { valid: false, reason: "payload.text is empty" };
  }

  const referencedSources = getReferencedSourcesFromPayload(row.payload);
  if (referencedSources.length === 0) {
    return { valid: false, reason: "referenced_sources array is empty" };
  }

  return { valid: true, reason: null };
}

export function draftToKnowledgeAssetInsert(
  sourceId: string,
  draft: KnowledgeAssetDraft
): Omit<KnowledgeAssetRow, "id"> {
  const now = new Date().toISOString();
  const referencedSources = buildReferencedSourcesFromDraft(draft);
  return {
    source_id: sourceId,
    external_id: draft.external_id,
    schema_version: draft.schema_version,
    asset_kind: "text",
    payload: {
      text: draft.content,
      uri: draft.url,
      mime_type: "text/html",
      referenced_sources: referencedSources,
    },
    labels: {
      title: draft.title,
      description: draft.summary,
      language: "en",
    },
    provenance: draft.provenance as unknown as Record<string, unknown>,
    title: draft.title,
    content: draft.content,
    summary: draft.summary,
    url: draft.url,
    published_at: draft.published_at,
    author: draft.author,
    metadata: draft.metadata,
    status: "pending",
    discovered_at: now,
    created_at: now,
    updated_at: now,
  };
}

export function rowToDiscoveredArticleLogical(row: KnowledgeAssetRow): DiscoveredArticleLogical {
  const title =
    row.title ||
    (typeof row.labels?.title === "string" ? row.labels.title : "") ||
    "Untitled";
  const content =
    row.content ||
    (typeof row.payload?.text === "string" ? row.payload.text : null);
  const summary =
    row.summary ||
    (typeof row.labels?.description === "string" ? row.labels.description : null);
  const url =
    row.url || (typeof row.payload?.uri === "string" ? row.payload.uri : "");

  return {
    id: row.id,
    source_id: row.source_id,
    title,
    content,
    summary,
    url,
    status: row.status,
    processing_started_at: row.processing_started_at ?? null,
    metadata: row.metadata,
  };
}

export function legacyRowToKnowledgeAssetInsert(
  row: Record<string, unknown>
): Omit<KnowledgeAssetRow, "id"> & { id?: string } {
  const title = String(row.title ?? "Untitled");
  const content = row.content != null ? String(row.content) : null;
  const summary = row.summary != null ? String(row.summary) : null;
  const url = String(row.url ?? "");
  return {
    id: row.id != null ? String(row.id) : undefined,
    source_id: String(row.source_id),
    external_id: row.external_id != null ? String(row.external_id) : null,
    schema_version: "1.0",
    asset_kind: "text",
    payload: {
      text: content ?? "",
      uri: url,
      mime_type: "text/html",
      referenced_sources: url.trim()
        ? [{ name: title.trim() || url.trim(), url: url.trim() }]
        : [],
    },
    labels: {
      title,
      description: summary,
      language: "en",
    },
    provenance: {
      connector_type: "legacy",
      connector_version: "0.0.0",
      adapter_type: "legacy",
      adapter_version: "0.0.0",
      migrated_from: "discovered_articles",
    },
    title,
    content,
    summary,
    url,
    published_at: row.published_at != null ? String(row.published_at) : null,
    author: row.author != null ? String(row.author) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    status: String(row.status ?? "pending"),
    relevance_score: row.relevance_score as number | null | undefined,
    confidence_score: row.confidence_score as number | null | undefined,
    rejection_reason: row.rejection_reason != null ? String(row.rejection_reason) : null,
    processing_started_at:
      row.processing_started_at != null ? String(row.processing_started_at) : null,
    processing_completed_at:
      row.processing_completed_at != null ? String(row.processing_completed_at) : null,
    discovered_at: row.created_at != null ? String(row.created_at) : new Date().toISOString(),
    created_at: row.created_at != null ? String(row.created_at) : new Date().toISOString(),
    updated_at: row.updated_at != null ? String(row.updated_at) : new Date().toISOString(),
  };
}
