/**
 * @architecture-frozen — Canonical projection DB writers. See docs/ARCHITECTURE_FROZEN.md
 * The ONLY module allowed to INSERT/UPDATE rendered_outputs in production.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  RenderQualityScore,
  RenderDiagnostics,
  DocumentNode,
  OutputFormat,
} from "@/services/renderer/types";

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

  if (!input.content || input.content.length === 0) {
    console.error("Cannot store rendered output: content is empty");
    return null;
  }

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

  const { data: verifyData } = await sb
    .from("rendered_outputs")
    .select("content")
    .eq("cache_key", input.cacheKey)
    .single();

  if (!verifyData?.content?.length) {
    console.error("Content verification failed after persistence");
    return null;
  }

  return data?.id ?? null;
}

export async function markOutputsStaleByPackageId(packageId: string): Promise<number> {
  const sb = createAdminClient();
  const { data } = await sb
    .from("rendered_outputs")
    .update({ status: "stale", updated_at: new Date().toISOString() })
    .eq("package_id", packageId)
    .neq("status", "stale")
    .select("id");

  return data?.length ?? 0;
}

export async function markOutputStatus(
  outputId: string,
  status: "published" | "stale" | "failed" | "draft"
): Promise<void> {
  const sb = createAdminClient();
  const { error } = await sb
    .from("rendered_outputs")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", outputId);
  if (error) throw new Error(`Failed to update rendered output status: ${error.message}`);
}

export async function markOutputPublished(outputId: string): Promise<void> {
  return markOutputStatus(outputId, "published");
}

/** Admin authoring-engine legacy JSON output */
export async function persistAuthoringOutput(row: {
  package_id: string;
  content: string;
  output_format?: string;
  renderer_id?: string;
  status?: string;
  knowledge_hash?: string;
}): Promise<string | null> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("rendered_outputs")
    .insert({
      package_id: row.package_id,
      content: row.content,
      output_format: row.output_format ?? "json",
      renderer_id: row.renderer_id ?? "knowledge-authoring-v1",
      renderer_version: "1.0.0",
      template_version: "1.0.0",
      cache_key: `authoring:${row.package_id}:${Date.now()}`,
      knowledge_hash: row.knowledge_hash ?? "authoring",
      status: row.status ?? "draft",
      word_count: 0,
      section_count: 0,
      citation_count: 0,
      quality_score: { overall: 0 },
      diagnostics: {},
      render_duration_ms: 0,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to persist authoring output:", error.message);
    return null;
  }
  return data?.id ?? null;
}
