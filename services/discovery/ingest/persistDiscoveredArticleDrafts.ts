/**
 * @architecture-frozen — Persists ingest drafts to knowledge_assets.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";
import type { KnowledgeAssetDraft, KnowledgeIngestResult } from "./types";
import {
  draftToKnowledgeAssetInsert,
  KNOWLEDGE_ASSET_TABLE,
  validateKnowledgeAssetBeforeSave,
} from "./knowledgeAssetCompat";

export async function persistKnowledgeAssetDrafts(
  sourceId: string,
  drafts: KnowledgeAssetDraft[]
): Promise<KnowledgeIngestResult> {
  const supabase = createAdminClient();
  let saved = 0;
  let duplicates = 0;
  let errors = 0;
  let failed = 0;

  for (const draft of drafts) {
    try {
      const urlHash = crypto.createHash("sha256").update(draft.url).digest("hex");
      const { data: existing } = await supabase
        .from("article_deduplication")
        .select("id")
        .eq("url_hash", urlHash)
        .single();

      if (existing) {
        const { data: current } = await supabase
          .from("article_deduplication")
          .select("occurrence_count")
          .eq("id", existing.id)
          .single();

        await supabase
          .from("article_deduplication")
          .update({
            last_seen_at: new Date().toISOString(),
            occurrence_count: (current?.occurrence_count || 0) + 1,
          })
          .eq("id", existing.id);
        duplicates++;
        continue;
      }

      const row = draftToKnowledgeAssetInsert(sourceId, draft);
      const validation = validateKnowledgeAssetBeforeSave(row);
      if (!validation.valid) {
        row.status = "failed";
        row.rejection_reason = validation.reason;
        failed++;
      }

      const { error: insertError } = await supabase.from(KNOWLEDGE_ASSET_TABLE).insert(row);

      if (insertError) {
        if (insertError.code === "23505") {
          duplicates++;
        } else {
          console.error("Failed to save knowledge asset:", insertError);
          errors++;
        }
        continue;
      }

      if (validation.valid) {
        saved++;
      }

      if (validation.valid) {
        const titleHash = crypto.createHash("sha256").update(draft.title).digest("hex");
        const contentHash = draft.content
          ? crypto.createHash("sha256").update(draft.content).digest("hex")
          : null;

        await supabase.from("article_deduplication").insert({
          url_hash: urlHash,
          title_hash: titleHash,
          content_hash: contentHash,
          url: draft.url,
          title: draft.title,
        });
      }
    } catch (error) {
      console.error("Error processing knowledge asset:", error);
      errors++;
    }
  }

  return { saved, duplicates, errors, failed };
}

/** @deprecated Phase 1 name — delegates to persistKnowledgeAssetDrafts */
export const persistDiscoveredArticleDrafts = persistKnowledgeAssetDrafts;
