/**
 * Cache Manager
 *
 * Computes cache keys, checks for cache hits, stores rendered outputs.
 * The only service in the renderer that interacts with the database.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  RenderedOutputRow,
  RenderQualityScore,
  RenderDiagnostics,
  DocumentNode,
  OutputFormat,
} from "./types";
import { createHash } from "crypto";

// ─── Cache Key Computation ───────────────────────────────────────────────────

export function computeCacheKey(
  knowledgeHash: string,
  rendererVersion: string,
  templateVersion: string,
  outputFormat: string
): string {
  const input = `${knowledgeHash}:${rendererVersion}:${templateVersion}:${outputFormat}`;
  return createHash("sha256").update(input).digest("hex");
}

// ─── Cache Lookup ────────────────────────────────────────────────────────────

export async function checkCache(cacheKey: string): Promise<RenderedOutputRow | null> {
  const sb = createAdminClient();
  const { data } = await sb
    .from("rendered_outputs")
    .select("*")
    .eq("cache_key", cacheKey)
    .maybeSingle();

  return data as RenderedOutputRow | null;
}

// ─── Store Rendered Output ───────────────────────────────────────────────────

export interface StoreInput {
  packageId: string;
  knowledgeHash: string;
  rendererId: string;
  rendererVersion: string;
  templateVersion: string;
  outputFormat: OutputFormat;
  style: string[];
  cacheKey: string;
  content: string;
  documentTree: DocumentNode[];
  wordCount: number;
  sectionCount: number;
  citationCount: number;
  qualityScore: RenderQualityScore;
  diagnostics: RenderDiagnostics;
  renderDurationMs: number;
}

export async function storeRenderedOutput(input: StoreInput): Promise<string | null> {
  const sb = createAdminClient();

  // Verify HTML exists and has content before persisting
  if (!input.content || input.content.length === 0) {
    console.error("Cannot store rendered output: content is empty");
    return null;
  }

  // Determine status based on quality score
  let status: "draft" | "published" | "failed" = "draft";
  if (input.qualityScore.overall >= 60) {
    status = "published";
  } else if (input.qualityScore.overall < 40) {
    status = "failed";
  }

  const { data, error } = await sb
    .from("rendered_outputs")
    .upsert(
      {
        package_id: input.packageId,
        knowledge_hash: input.knowledgeHash,
        renderer_id: input.rendererId,
        renderer_version: input.rendererVersion,
        template_version: input.templateVersion,
        output_format: input.outputFormat,
        style: input.style,
        cache_key: input.cacheKey,
        content: input.content,
        document_tree: input.documentTree,
        word_count: input.wordCount,
        section_count: input.sectionCount,
        citation_count: input.citationCount,
        quality_score: input.qualityScore,
        diagnostics: input.diagnostics,
        render_duration_ms: input.renderDurationMs,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "cache_key" }
    )
    .select("id")
    .single();

  if (error) {
    console.error("Failed to store rendered output:", error.message);
    return null;
  }

  // Verify database content length > 0 after persistence
  const { data: verifyData } = await sb
    .from("rendered_outputs")
    .select("content")
    .eq("cache_key", input.cacheKey)
    .single();

  if (!verifyData || !verifyData.content || verifyData.content.length === 0) {
    console.error("Content verification failed after persistence");
    return null;
  }

  return data?.id ?? null;
}

// ─── Invalidation ────────────────────────────────────────────────────────────

export async function markStale(packageId: string): Promise<number> {
  const sb = createAdminClient();
  const { data } = await sb
    .from("rendered_outputs")
    .update({ status: "stale", updated_at: new Date().toISOString() })
    .eq("package_id", packageId)
    .neq("status", "stale")
    .select("id");

  return data?.length ?? 0;
}
