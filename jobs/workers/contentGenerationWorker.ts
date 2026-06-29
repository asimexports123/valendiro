import { createClient } from "@/lib/supabase/server";
import { DEFAULT_LANGUAGE } from "@/lib/constants";
import { SupportedLanguage } from "@/lib/types";
import { logExecution } from "@/services/execution/executionLogger";
import {
  generateArticleFromTemplate,
  generateSlug,
  ArticleTemplateType,
} from "@/services/templates/articleTemplateEngine";
import { humanizeContent, humanizeExcerpt, humanizeMetaDescription } from "@/services/humanization/humanizationProcessor";
import { checkDuplicateContentBeforePublish } from "@/services/seo/duplicateContentDetector";
import { findRelevantProducts } from "@/services/affiliate/productFinder";
import { runPublishQualityGate, generateBasicInternalLinks } from "@/services/quality/publishQualityGate";
import { ContentGenerationQueueItem } from "@/lib/types";

export interface GenerationResult {
  queueItemId: string;
  articleId: string | null;
  status: "success" | "failed";
  message: string;
}

export async function processContentGenerationItem(item: ContentGenerationQueueItem): Promise<GenerationResult> {
  const start = Date.now();
  const supabase = await createClient();

  await logExecution({
    queueType: "generation",
    queueItemId: item.id,
    action: "generate_article_draft",
    status: "started",
  });

  try {
    await supabase
      .from("content_generation_queue")
      .update({ status: "in_progress", processing_started_at: new Date().toISOString() })
      .eq("id", item.id);

    // AI is optional: only use it for top 1% priority items if available
    const useAI = item.priority_score >= 98 && (item.metadata as Record<string, unknown> | undefined)?.enable_ai === true;

    let title = item.title;
    let excerpt = item.description ?? "";
    let content = "";
    let metaTitle = item.title;
    let metaDescription = item.description ?? "";

    if (useAI) {
      const { getAIContentGenerator } = await import("@/services/ai/aiContentGenerator");
      const generator = getAIContentGenerator();
      const generated = await generator.generate({
        title: item.title,
        description: item.description,
        format: "seo_article",
        languageCode: "en",
        metadata: item.metadata ?? {},
      });
      title = generated.title;
      excerpt = generated.excerpt;
      content = generated.content;
      metaTitle = generated.metaTitle;
      metaDescription = generated.metaDescription;
    } else {
      // Deterministic template-based generation (zero-cost path)
      const templateType = ((item.metadata as Record<string, unknown> | undefined)?.template as ArticleTemplateType) || "informational";
      const relevantProducts = await findRelevantProducts(item.title, 3);
      const generated = generateArticleFromTemplate(templateType, {
        title: item.title,
        description: item.description,
        languageCode: "en",
        keywords: ((item.metadata as Record<string, unknown> | undefined)?.keywords as string[]) || [],
        products: relevantProducts.map((p) => ({
          name: p.name,
          description: p.description,
          affiliate_url: p.affiliate_url,
          price: p.price,
          image_url: p.image_url,
          call_to_action: p.call_to_action,
        })),
      });
      title = generated.title;
      excerpt = generated.excerpt;
      content = generated.content;
      metaTitle = generated.metaTitle;
      metaDescription = generated.metaDescription;
    }

    // Human touch layer: humanize all generated content before publishing
    content = humanizeContent(content);
    excerpt = humanizeExcerpt(excerpt);
    metaDescription = humanizeMetaDescription(metaDescription);

    // Duplicate content protection before publishing
    const duplicateCheck = await checkDuplicateContentBeforePublish({
      objectId: null,
      objectType: "article",
      languageCode: DEFAULT_LANGUAGE as SupportedLanguage,
      content,
    });
    if (duplicateCheck.isDuplicate) {
      throw new Error(`Duplicate content detected: ${duplicateCheck.reason}`);
    }

    // Pre-insert quality gate (humanization, SEO completeness, metadata)
    const preGate = await runPublishQualityGate({
      title,
      content,
      excerpt,
      metaTitle,
      metaDescription,
    });
    if (!preGate.passed) {
      throw new Error(`Quality gate failed: ${preGate.reasons.join("; ")}`);
    }

    const slug = generateSlug(title);
    const canonicalPath = `/${DEFAULT_LANGUAGE}/articles/${slug}`;

    const { data: article, error: articleError } = await supabase
      .from("articles")
      .insert({
        slug,
        canonical_path: canonicalPath,
        article_type: "guide",
        status: "draft",
        lifecycle_status: "draft",
      })
      .select()
      .single();

    if (articleError || !article) {
      throw new Error(articleError?.message || "Failed to create article");
    }

    const { error: translationError } = await supabase.from("article_translations").insert({
      article_id: article.id,
      language_code: DEFAULT_LANGUAGE,
      title,
      excerpt,
      content,
      meta_title: metaTitle,
      meta_description: metaDescription,
    });

    if (translationError) {
      throw new Error(translationError.message);
    }

    // Generate internal links before final quality gate
    await generateBasicInternalLinks(article.id, title, DEFAULT_LANGUAGE as SupportedLanguage);

    // Final quality gate with objectId
    const finalGate = await runPublishQualityGate({
      title,
      content,
      excerpt,
      metaTitle,
      metaDescription,
      objectId: article.id,
    });
    if (!finalGate.passed) {
      throw new Error(`Final quality gate failed: ${finalGate.reasons.join("; ")}`);
    }

    // Publish article
    await supabase
      .from("articles")
      .update({ status: "published", lifecycle_status: "published", published_at: new Date().toISOString() })
      .eq("id", article.id);

    await supabase
      .from("content_generation_queue")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", item.id);

    await logExecution({
      queueType: "generation",
      queueItemId: item.id,
      objectId: article.id,
      objectType: "article",
      action: "generate_article_draft",
      status: "success",
      message: `Draft article created: ${title}${useAI ? " (AI-assisted)" : " (template-based)"}`,
      durationMs: Date.now() - start,
    });

    return { queueItemId: item.id, articleId: article.id, status: "success", message: "Draft created" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabase
      .from("content_generation_queue")
      .update({
        status: "pending",
        retry_count: item.retry_count + 1,
        failed_reason: message,
      })
      .eq("id", item.id);

    await logExecution({
      queueType: "generation",
      queueItemId: item.id,
      action: "generate_article_draft",
      status: "failed",
      message,
      durationMs: Date.now() - start,
    });

    return { queueItemId: item.id, articleId: null, status: "failed", message };
  }
}

export async function runContentGenerationWorker(limit = 10) {
  const supabase = await createClient();
  const { data: items, error } = await supabase
    .from("content_generation_queue")
    .select("id")
    .eq("status", "pending")
    .lt("retry_count", 3)
    .order("priority_score", { ascending: false })
    .limit(limit);

  if (error || !items) {
    return { processed: 0, error: error?.message ?? null };
  }

  const results: GenerationResult[] = [];
  for (const row of items) {
    // Atomic claim to prevent duplicate processing across concurrent cron runs
    const { data: claimed, error: claimError } = await supabase
      .rpc("claim_queue_item", { queue_type: "generation", item_id: row.id })
      .maybeSingle();

    if (claimError || !claimed) {
      continue;
    }

    const result = await processContentGenerationItem(claimed as ContentGenerationQueueItem);
    results.push(result);
  }

  return { processed: results.length, results, error: null };
}
