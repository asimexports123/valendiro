import { createClient } from "@/lib/supabase/server";
import { DEFAULT_LANGUAGE } from "@/lib/constants";
import { logExecution } from "@/services/execution/executionLogger";
import {
  generateArticleFromTemplate,
  ArticleTemplateType,
} from "@/services/templates/articleTemplateEngine";
import { ContentUpdateQueueItem } from "@/lib/types";

export interface UpdateResult {
  queueItemId: string;
  objectId: string;
  status: "success" | "failed";
  message: string;
}

export async function processContentUpdateItem(item: ContentUpdateQueueItem): Promise<UpdateResult> {
  const start = Date.now();
  const supabase = await createClient();

  await logExecution({
    queueType: "update",
    queueItemId: item.id,
    objectId: item.object_id,
    objectType: item.object_type,
    action: "update_content",
    status: "started",
  });

  try {
    await supabase
      .from("content_update_queue")
      .update({ status: "in_progress", processing_started_at: new Date().toISOString() })
      .eq("id", item.id);

    if (item.object_type !== "article") {
      throw new Error(`Update worker currently supports only articles, received: ${item.object_type}`);
    }

    // Fetch existing article translation
    const { data: translation, error: translationError } = await supabase
      .from("article_translations")
      .select("id, title, excerpt, content, meta_title, meta_description")
      .eq("article_id", item.object_id)
      .eq("language_code", DEFAULT_LANGUAGE)
      .single();

    if (translationError || !translation) {
      throw new Error(translationError?.message || "Article translation not found");
    }

    // Deterministic template-based refresh (zero-cost path)
    const templateType = ((item.metadata as Record<string, unknown> | undefined)?.template as ArticleTemplateType) || "informational";
    const improved = generateArticleFromTemplate(templateType, {
      title: translation.title,
      description: item.reason,
      languageCode: "en",
      keywords: ((item.metadata as Record<string, unknown> | undefined)?.keywords as string[]) || [],
    });

    const updatedContent = `> **Updated**: ${item.reason}\n\n${improved.content}`;

    const { error: updateError } = await supabase
      .from("article_translations")
      .update({
        content: updatedContent,
        excerpt: improved.excerpt,
        meta_title: improved.metaTitle,
        meta_description: improved.metaDescription,
        updated_at: new Date().toISOString(),
      })
      .eq("id", translation.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await supabase
      .from("content_update_queue")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", item.id);

    await logExecution({
      queueType: "update",
      queueItemId: item.id,
      objectId: item.object_id,
      objectType: item.object_type,
      action: "update_content",
      status: "success",
      message: `Article content refreshed: ${translation.title}`,
      durationMs: Date.now() - start,
    });

    return { queueItemId: item.id, objectId: item.object_id, status: "success", message: "Content refreshed" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabase
      .from("content_update_queue")
      .update({
        status: "pending",
        retry_count: item.retry_count + 1,
        failed_reason: message,
      })
      .eq("id", item.id);

    await logExecution({
      queueType: "update",
      queueItemId: item.id,
      objectId: item.object_id,
      objectType: item.object_type,
      action: "update_content",
      status: "failed",
      message,
      durationMs: Date.now() - start,
    });

    return { queueItemId: item.id, objectId: item.object_id, status: "failed", message };
  }
}

export async function runContentUpdateWorker(limit = 10) {
  const supabase = await createClient();
  const { data: items, error } = await supabase
    .from("content_update_queue")
    .select("id")
    .eq("status", "pending")
    .lt("retry_count", 3)
    .order("priority_score", { ascending: false })
    .limit(limit);

  if (error || !items) {
    return { processed: 0, error: error?.message ?? null };
  }

  const results: UpdateResult[] = [];
  for (const row of items) {
    const { data: claimed, error: claimError } = await supabase
      .rpc("claim_queue_item", { queue_type: "update", item_id: row.id })
      .maybeSingle();

    if (claimError || !claimed) {
      continue;
    }

    const result = await processContentUpdateItem(claimed as ContentUpdateQueueItem);
    results.push(result);
  }

  return { processed: results.length, results, error: null };
}
