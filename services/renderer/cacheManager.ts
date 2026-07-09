/**
 * Cache Manager
 *
 * Read-only cache lookup and key computation.
 * All rendered_outputs writes go through services/render/writers.ts.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { RenderedOutputRow } from "./types";
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

/** @deprecated Use services/render/writers.storeRenderedOutput — legacy import path */
export { storeRenderedOutput, type StoreInput } from "@/services/render/writers";

/** @deprecated Use services/render/writers.markOutputsStaleByPackageId */
export { markOutputsStaleByPackageId as markStale } from "@/services/render/writers";
