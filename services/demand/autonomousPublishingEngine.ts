import { createAdminClient } from "@/lib/supabase/admin";
import { publishDemandTopic, publishDemandTopicTranslation } from "@/services/publish/service";
import { generateArticleFromTemplate } from "../templates/articleTemplateEngine";
import { humanizeContent, humanizeExcerpt, humanizeMetaDescription } from "../humanization/humanizationProcessor";
import { runAgentPipeline } from "../intelligence/agentPipeline";
import { isQuotaExhaustedError } from "../llm";
import { runQualityGate, runPlaceholderCheck } from "../seo/qualityGate";
import { queueArticleExpansionsForTopic, expandAllPendingTopics } from "./topicExpansionEngine";
import { classifyTopicDomain } from "../intelligence/topicDomainClassifier";
import { classifySearchIntent, deriveUserGoal } from "../intelligence/topicSearchIntentClassifier";
import {
  buildHierarchicalLinksForTopic,
  buildHierarchicalLinksForArticle,
} from "../intelligence/hierarchicalLinkingEngine";
import { runPublishingChecklist, runPostPublishAudit } from "../publishing/publishingChecklist";
import { generateFullArticleSchema } from "../seo/schemaGenerator";
import { assignFeaturedImages } from "../publishing/featuredImageService";
import { getAIContentGenerator } from "../ai/aiContentGenerator";

function normalizeTitleForTopic(raw: string): string {
  return raw
    .replace(/^(what is|how to|what are|how do i|guide to|introduction to)\s+/i, "")
    .replace(/\b(als)\b/g, "ALS")
    .replace(/\b(cern)\b/g, "CERN")
    .replace(/\b(ai)\b/g, "AI")
    .replace(/\b(seo)\b/g, "SEO")
    .replace(/\b(api)\b/g, "API")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

async function buildTopicContent(rawTitle: string, keyword: string, category: string): Promise<string> {
  const title = normalizeTitleForTopic(rawTitle);
  const cat = category && category !== "General" ? category : "knowledge";
  const kw = keyword || title.toLowerCase();

  // Use the improved AI content generator with world-class template
  const generator = getAIContentGenerator();
  const generated = await generator.generate({
    title,
    description: `a core area within ${cat}. It covers the principles, practices, and applications that practitioners rely on to make informed decisions and achieve consistent results.`,
    format: "explainer",
    languageCode: "en",
    keywords: [kw],
    tone: "professional",
  });

  return generated.content;
}

export interface PublishingEngineResult {
  demandInserted: number;
  clustersCreated: number;
  categoriesCreated: number;
  subcategoriesCreated: number;
  queuedTopics: number;
  topicsPublished: number;
  articleExpansionsQueued: number;
  articlesPublished: number;
  errors: string[];
}

/**
 * @deprecated Keyword-first discovery is retired.
 * Content discovery now flows from Category → Subcategory → Topic (knowledge tree).
 * This function is kept as an alias to runFullPublishingCycle for backward compatibility.
 * All callers should migrate to runFullPublishingCycle().
 */
export async function runAutonomousPublishingPipeline(): Promise<PublishingEngineResult> {
  console.warn("[runAutonomousPublishingPipeline] DEPRECATED — routing to runFullPublishingCycle (knowledge-first)");
  return runFullPublishingCycle();
}

// ─── RETIRED: Keyword-First Discovery Pipeline ────────────────────────────────
//
// The following stages have been permanently retired (Jul 2026):
//
//   OLD FLOW (keyword-first):
//     captureInternalSearchIntentDemand()
//     captureSeasonalTrends()
//     captureAllExternalDemand()
//     clusterDemandSignals()
//     buildDemandTopicQueue()
//     approveDemandTopicQueueItems() + runKeywordResearch() decision gate
//     → promote to content_generation_queue
//
//   NEW FLOW (knowledge-first):
//     expandKnowledgeTree()           — Category → Subcategory → Topic hierarchy
//     publishApprovedTopics()         — write topic pages
//     expandAllPendingTopics()        — entity-type + intent + level roadmaps
//     publishApprovedArticles()       — 5-agent Gemini pipeline per article
//
// Keywords now serve as optimization signals (GSC/GA) AFTER publish,
// not as content discovery inputs.
//
// Files that can be deleted when confirmed stable (30-day window):
//   services/demand/externalDemandSources.ts
//   services/demand/demandSources.ts
//   services/demand/topicClustering.ts
//   services/demand/demandTopicQueue.ts
//   services/demand/keywordResearchEngine.ts (keep API route for GSC integration)
//   services/demand/categoryConfig.ts

export async function publishApprovedTopics(limit = 10): Promise<PublishingEngineResult> {
  const result: PublishingEngineResult = {
    demandInserted: 0,
    clustersCreated: 0,
    categoriesCreated: 0,
    subcategoriesCreated: 0,
    queuedTopics: 0,
    topicsPublished: 0,
    articleExpansionsQueued: 0,
    articlesPublished: 0,
    errors: [],
  };

  const supabase = createAdminClient();

  const { data: queueItems, error } = await supabase
    .from("content_generation_queue")
    .select("*")
    .eq("status", "pending")
    .eq("object_type", "topic")
    .order("priority_score", { ascending: false })
    .limit(limit);

  if (error || !queueItems) {
    result.errors.push(error?.message || "No topics to publish");
    return result;
  }

  for (const item of queueItems) {
    try {
      const metadata = (item.metadata as Record<string, unknown>) || {};
      const subcategoryId = metadata.subcategory_id as string | null;

      let categoryId: string | null = null;
      if (subcategoryId) {
        const { data: Subcategory } = await supabase.from("subcategories").select("category_id").eq("id", subcategoryId).single();
        categoryId = Subcategory?.category_id ?? null;
      }
      if (!categoryId && metadata.category) {
        // Look up category by matching slug (keyword-detected category label → slug)
        const rawCat = (metadata.category as string).toLowerCase().trim();
        const catSlug = rawCat.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const { data: cat } = await supabase
          .from("categories")
          .select("id, slug")
          .or(`slug.eq.${catSlug},slug.ilike.%${catSlug.slice(0, 20)}%`)
          .maybeSingle();
        categoryId = cat?.id ?? null;
      }
      // Final fallback: if still no category, detect from keyword
      if (!categoryId) {
        const keyword = ((metadata.keyword as string) || item.title).toLowerCase();
        const fallbackSlug =
          /docker|kubernetes|linux|python|javascript|typescript|react|node|api|sql|git|css|html|code|software|algorithm|cloud|aws|devops|command|function|class|framework|programming/.test(keyword) ? "technology" :
          /invest|stock|bond|crypto|finance|money|tax|budget|loan|mortgage|interest|dividend|portfolio|bank|insurance/.test(keyword) ? "personal-finance" :
          /health|disease|symptom|treatment|medicine|doctor|diet|nutrition|vitamin|exercise|mental|anxiety|cortisol|hormone|cancer|diabetes/.test(keyword) ? "health-wellness" :
          /business|startup|marketing|entrepreneur|revenue|profit|sales|management/.test(keyword) ? "business" :
          "education";
        if (fallbackSlug) {
          const { data: fbCat } = await supabase.from("categories").select("id").eq("slug", fallbackSlug).maybeSingle();
          categoryId = fbCat?.id ?? null;
        }
      }

      const cleanSlugTitle = normalizeTitleForTopic(item.title);
      const slug = cleanSlugTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 100);
      const canonicalPath = `/en/topics/${slug}`;

      const topicId = await publishDemandTopic({
        slug,
        canonical_path: canonicalPath,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        status: "published",
        published_at: new Date().toISOString(),
      });

      const { data: topic } = await supabase.from("topics").select("id").eq("id", topicId).single();
      if (!topic) {
        throw new Error("Topic insert failed");
      }

      const topicKeyword = (metadata.keyword as string) || item.title;
      const topicCategory = (metadata.category as string) || "General";
      const cleanTitle = normalizeTitleForTopic(item.title);
      const topicContent = await buildTopicContent(item.title, topicKeyword, topicCategory);
      const topicMetaDesc = `Learn everything about ${cleanTitle} — definitions, guides, tips, and expert resources.`.slice(0, 160);

      const placeholderCheck = runPlaceholderCheck(topicContent);
      if (!placeholderCheck.passed) {
        throw new Error(`Topic content failed placeholder check: ${placeholderCheck.reason}`);
      }

      // Stage 12: Publishing checklist — all conditions must pass before inserting
      const checklist = runPublishingChecklist({
        objectType: "topic",
        objectId: null,
        title: cleanTitle,
        content: topicContent,
        metaTitle: `${cleanTitle} — Complete Guide`,
        metaDescription: topicMetaDesc,
        canonicalPath: canonicalPath,
        subcategoryId: subcategoryId,
        categoryId: categoryId,
        keywordDecision: (metadata.keyword_research as { decision?: string } | undefined)?.decision as "publish" | "backlog" | "reject" | null ?? "publish",
      });
      if (!checklist.passed) {
        throw new Error(`Stage 12 checklist failed: ${checklist.blockers.join("; ")}`);
      }

      await publishDemandTopicTranslation({
        topic_id: topic.id,
        language_code: "en",
        title: cleanTitle,
        subtitle: `Your complete guide to ${cleanTitle}.`,
        content: topicContent,
        meta_title: `${cleanTitle} — Complete Guide`,
        meta_description: topicMetaDesc,
      });

      await supabase
        .from("content_generation_queue")
        .update({ status: "completed", completed_at: new Date().toISOString(), topic_id: topic.id })
        .eq("id", item.id);

      result.topicsPublished++;

      // Build knowledge-graph links: topic -> category, Subcategory, articles, related topics
      await buildHierarchicalLinksForTopic(topic.id);

      // Stage 13: Post-publish audit — revert to draft automatically if anything is wrong
      const audit = await runPostPublishAudit("topic", topic.id);
      if (!audit.passed) {
        result.errors.push(`Topic "${cleanTitle}" failed post-publish audit: ${audit.blockers.join("; ")} — reverted to draft`);
        result.topicsPublished--;
        continue;
      }

      // Stage 5: Auto-expand the topic into a set of supporting articles
      const expansion = await queueArticleExpansionsForTopic(topic.id, item.title, "en");
      result.articleExpansionsQueued += expansion.count;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Topic publish failed";
      result.errors.push(message);
      await supabase
        .from("content_generation_queue")
        .update({ status: "failed", failed_reason: message, completed_at: new Date().toISOString() })
        .eq("id", item.id);
    }
  }

  return result;
}

export async function publishApprovedArticles(limit = 10): Promise<PublishingEngineResult> {
  const result: PublishingEngineResult = {
    demandInserted: 0,
    clustersCreated: 0,
    categoriesCreated: 0,
    subcategoriesCreated: 0,
    queuedTopics: 0,
    topicsPublished: 0,
    articleExpansionsQueued: 0,
    articlesPublished: 0,
    errors: [],
  };

  const supabase = createAdminClient();

  const { data: queueItems, error } = await supabase
    .from("content_generation_queue")
    .select("*")
    .in("status", ["pending", "pending_llm"])   // pending_llm = quota-paused, resume automatically
    .eq("object_type", "article")
    .order("priority_score", { ascending: false })
    .limit(limit);

  if (error || !queueItems) {
    result.errors.push(error?.message || "No articles to publish");
    return result;
  }

  for (const item of queueItems) {
    try {
      const metadata = (item.metadata as Record<string, unknown>) || {};
      const articleType = (metadata.article_type as "guide" | "explainer" | "reference" | "comparison" | "tutorial") || "guide";

      // If no topic_id on queue item, try to find matching topic by keyword
      let resolvedTopicId: string | null = item.topic_id ?? null;
      let resolvedCategoryId: string | null = null;
      if (!resolvedTopicId) {
        const keyword = (metadata.keyword as string) || item.title;
        const slugGuess = keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
        const { data: matchedTopic } = await supabase
          .from("topics")
          .select("id, slug, category_id")
          .or(`slug.ilike.%${slugGuess.slice(0, 30)}%`)
          .limit(1)
          .maybeSingle();
        if (matchedTopic) {
          resolvedTopicId = matchedTopic.id;
          resolvedCategoryId = matchedTopic.category_id ?? null;
        }
      }
      // Inherit category from topic if we have one
      if (resolvedTopicId && !resolvedCategoryId) {
        const { data: tp } = await supabase.from("topics").select("category_id").eq("id", resolvedTopicId).maybeSingle();
        resolvedCategoryId = tp?.category_id ?? null;
      }

      // ── 5-Agent Gemini Pipeline ────────────────────────────────────────────
      // Agent 1: Research  → Agent 2: Outline → Agent 3: Write
      // Agent 4: Review    → Agent 5: SEO     → Save as DRAFT
      // Derive category label from entity type — no keyword tool needed
      const entityType   = classifyTopicDomain(item.title);
      const searchIntent  = classifySearchIntent(item.title);
      const userGoal      = deriveUserGoal(searchIntent, item.title);
      const categoryLabel = entityType.startsWith("tech_") ? "Technology"
        : entityType.startsWith("finance_") ? "Personal Finance"
        : entityType.startsWith("health_") ? "Health & Wellness"
        : entityType === "place_travel" ? "Travel"
        : entityType === "product_review" ? "Consumer Products"
        : entityType === "historical_event" ? "Education"
        : "General Knowledge";

      let content: string;
      let generated: { title: string; excerpt: string; content: string; metaTitle: string; metaDescription: string };
      let qualityScore = 0;
      let seoScore = 0;
      let agentDurations: Record<string, number> = {};

      try {
        const pipeline = await runAgentPipeline(item.title, categoryLabel, userGoal);

        // Reviewer agent rejection threshold: score < 50 = too poor to save even as draft
        if (!pipeline.qualityReport.passed && pipeline.qualityReport.score < 50) {
          throw new Error(`Reviewer agent rejected article (score: ${pipeline.qualityReport.score}/100): ${pipeline.qualityReport.issues.slice(0, 2).join("; ")}`);
        }

        content = pipeline.finalContent;
        qualityScore = pipeline.editorialReview?.qualityReview?.score ?? pipeline.qualityReport.score;
        seoScore = pipeline.editorialReview?.seoReview?.score ?? pipeline.qualityReport.score;
        agentDurations = pipeline.agentDurationsMs;
        // Store autoPublish decision and editorial scores for later use
        (metadata as Record<string, unknown>)._autoPublish = pipeline.autoPublish;
        (metadata as Record<string, unknown>)._editorialReview = {
          overall: pipeline.editorialReview?.overallScore,
          fact: pipeline.editorialReview?.factCheck?.score,
          quality: qualityScore,
          seo: seoScore,
          retries: pipeline.retryCount,
        };

        const firstParagraph = content.replace(/^#+.+$/mg, "").split(/\n{2,}/).find(p => p.trim().length > 40) ?? "";
        const excerpt = firstParagraph.replace(/\*\*/g, "").trim().slice(0, 250);

        generated = {
          title: pipeline.finalTitle,
          excerpt,
          content,
          metaTitle: pipeline.metaTitle,
          metaDescription: pipeline.metaDescription,
        };
      } catch (agentErr) {
        // Quota exhausted: pause this item, skip remaining items — resume tomorrow
        if (isQuotaExhaustedError(agentErr)) {
          console.warn(`[Pipeline] Gemini quota exhausted. Pausing pipeline. Item "${item.title}" set to pending_llm.`);
          await supabase
            .from("content_generation_queue")
            .update({ status: "pending_llm", failed_reason: "Gemini quota exhausted — will resume automatically" })
            .eq("id", item.id);
          // Set ALL remaining pending items to pending_llm in one update
          const remaining = queueItems.slice(queueItems.indexOf(item) + 1).map(i => i.id);
          if (remaining.length > 0) {
            await supabase
              .from("content_generation_queue")
              .update({ status: "pending_llm", failed_reason: "Gemini quota exhausted — will resume automatically" })
              .in("id", remaining);
          }
          result.errors.push(`Gemini quota exhausted after "${item.title}" — ${remaining.length + 1} items paused as pending_llm`);
          break;
        }
        // Other LLM failure — fall back to template so queue item is not lost
        const errMsg = agentErr instanceof Error ? agentErr.message : String(agentErr);
        console.error(`[Pipeline] Agent pipeline failed for "${item.title}": ${errMsg} — falling back to template`);
        const template = (metadata.template as "informational" | "faq" | "comparison" | "affiliate") || "informational";
        const fallback = generateArticleFromTemplate(template, {
          title: item.title,
          description: item.description,
          languageCode: "en",
          keywords: metadata.keyword ? [metadata.keyword as string] : undefined,
        });
        content = humanizeContent(fallback.content);
        generated = {
          title: fallback.title,
          excerpt: humanizeExcerpt(fallback.excerpt),
          content,
          metaTitle: fallback.metaTitle,
          metaDescription: humanizeMetaDescription(fallback.metaDescription),
        };
      }

      const excerpt = generated.excerpt;
      const metaDescription = generated.metaDescription;

      // Build slug from the actual generated title (not raw keyword)
      // Strip common filler suffixes that pollute the URL
      const slugSource = (generated.title || item.title)
        .toLowerCase()
        .replace(/[''']/g, "")
        .replace(/\b(a complete guide|complete guide|buying guide|buyer's guide|step-by-step guide|step by step guide|explained|from basics to advanced)\b/gi, "")
        .replace(/^(best|top)\s+/i, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80);
      const slug = slugSource;
      const canonicalPath = `/en/articles/${slug}`;

      // Auto-publish if editorial review passed; draft if failed or fallback template used
      const autoPublish = !!(metadata as Record<string, unknown>)._autoPublish;
      const articleStatus = autoPublish ? "published" : "draft";
      const publishedAt = autoPublish ? new Date().toISOString() : null;

      const { data: article, error: articleError } = await supabase
        .from("articles")
        .insert({
          slug,
          canonical_path: canonicalPath,
          topic_id: resolvedTopicId,
          article_type: articleType,
          status: articleStatus,
          ...(publishedAt ? { published_at: publishedAt } : {}),
        })
        .select()
        .single();

      if (articleError || !article) {
        throw new Error(articleError?.message || "Article insert failed");
      }

      // Stage 11: Generate SEO schema JSON
      let schemaJson: Record<string, unknown> | null = null;
      try {
        const { data: parentTopic } = item.topic_id
          ? await supabase.from("topics").select("slug, category_id, subcategory_id, topic_translations(title), categories(slug, category_translations(name)), subcategories(slug, subcategory_translations(name))").eq("id", item.topic_id).maybeSingle()
          : { data: null };

        const catSlug = (parentTopic?.categories as any)?.slug ?? "general";
        const catName = (parentTopic?.categories as any)?.category_translations?.[0]?.name ?? "General";
        const colSlug = (parentTopic?.subcategories as any)?.slug ?? null;
        const colName = (parentTopic?.subcategories as any)?.subcategory_translations?.[0]?.name ?? null;
        const topicSlug = parentTopic?.slug ?? slug;
        const topicName = (parentTopic?.topic_translations as any)?.[0]?.title ?? generated.title;
        const now = new Date().toISOString();

        const schemaBundle = generateFullArticleSchema({
          title: generated.title,
          description: metaDescription,
          slug,
          publishedAt: now,
          updatedAt: now,
          categoryName: catName,
          categorySlug: catSlug,
          subcategoryName: colName,
          subcategorySlug: colSlug,
          topicName,
          topicSlug,
          languageCode: "en",
          content,
        });
        schemaJson = schemaBundle as unknown as Record<string, unknown>;
      } catch {
        // Schema generation failure is non-fatal — article still publishes
      }

      const translationInsert = await supabase.from("article_translations").insert({
        article_id: article.id,
        language_code: "en",
        title: generated.title,
        excerpt,
        content,
        meta_title: generated.metaTitle,
        meta_description: metaDescription,
        structured_data: schemaJson,
      });

      if (translationInsert.error) {
        // Clean up orphan article row and report
        await supabase.from("articles").delete().eq("id", article.id);
        throw new Error(`Translation insert failed: ${translationInsert.error.message}`);
      }

      // Log editorial scores and article id to queue metadata for dashboard
      const editorialMeta = (metadata as Record<string, unknown>)._editorialReview ?? {};
      await supabase
        .from("content_generation_queue")
        .update({
          metadata: {
            ...(item.metadata as object ?? {}),
            quality_score: qualityScore,
            seo_score: seoScore,
            agent_durations_ms: agentDurations,
            article_id: article.id,
            auto_published: autoPublish,
            editorial_review: editorialMeta,
          },
        })
        .eq("id", item.id);

      await supabase
        .from("content_generation_queue")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", item.id);

      result.articlesPublished++;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Publish failed";
      result.errors.push(message);
      await supabase
        .from("content_generation_queue")
        .update({ status: "failed", failed_reason: message, completed_at: new Date().toISOString() })
        .eq("id", item.id);
    }
  }

  return result;
}

// ─── Knowledge-First Publishing Cycle ────────────────────────────────────────
//
// Flow:
//   1. Knowledge Tree → queue new topics from Category→Subcategory→Topic hierarchy
//   2. Publish queued topics (Gemini writes topic description)
//   3. Expand published topics → queue domain-specific articles
//   4. Publish queued articles (full 6-agent Gemini pipeline per article)
//
// This replaces keyword-first demand discovery entirely.

const ARTICLE_PUBLISHING_ENABLED = process.env.ARTICLE_PUBLISHING_ENABLED !== "false";
const TOPIC_PUBLISH_LIMIT = parseInt(process.env.TOPIC_PUBLISH_LIMIT ?? "5", 10);
const ARTICLE_PUBLISH_LIMIT = parseInt(process.env.ARTICLE_PUBLISH_LIMIT ?? "3", 10);
const TOPICS_PER_Subcategory = parseInt(process.env.TOPICS_PER_Subcategory ?? "3", 10);

export async function runFullPublishingCycle(): Promise<PublishingEngineResult> {
  const combined: PublishingEngineResult = {
    demandInserted: 0,
    clustersCreated: 0,
    categoriesCreated: 0,
    subcategoriesCreated: 0,
    queuedTopics: 0,
    topicsPublished: 0,
    articleExpansionsQueued: 0,
    articlesPublished: 0,
    errors: [],
  };

  // Step 1: Knowledge Tree → queue new topics
  try {
    const { expandKnowledgeTree } = await import("@/services/demand/knowledgeTreeGenerator");
    const treeResult = await expandKnowledgeTree(TOPICS_PER_Subcategory);
    combined.queuedTopics += treeResult.totalTopicsQueued;
    combined.errors.push(...treeResult.errors);
    console.log(`[PublishingCycle] Knowledge tree: queued ${treeResult.totalTopicsQueued} new topics across ${treeResult.subcategoriesProcessed} subcategories`);
  } catch (err) {
    combined.errors.push(`Knowledge tree expansion failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Step 2: Publish queued topics
  try {
    const topicResult = await publishApprovedTopics(TOPIC_PUBLISH_LIMIT);
    combined.topicsPublished += topicResult.topicsPublished;
    combined.articleExpansionsQueued += topicResult.articleExpansionsQueued;
    combined.errors.push(...topicResult.errors);
    console.log(`[PublishingCycle] Topics published: ${topicResult.topicsPublished}`);
  } catch (err) {
    combined.errors.push(`Topic publishing failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Step 3: Expand published topics → queue domain-specific articles
  try {
    const { expandAllPendingTopics } = await import("@/services/demand/topicExpansionEngine");
    const expansionResult = await expandAllPendingTopics(10);
    combined.articleExpansionsQueued += expansionResult.total;
    console.log(`[PublishingCycle] Article expansions queued: ${expansionResult.total}`);
  } catch (err) {
    combined.errors.push(`Topic expansion failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Step 4: Publish queued articles
  try {
    const articleResult = await publishApprovedArticles(ARTICLE_PUBLISH_LIMIT);
    combined.articlesPublished += articleResult.articlesPublished;
    combined.errors.push(...articleResult.errors);
    console.log(`[PublishingCycle] Articles published: ${articleResult.articlesPublished}`);
  } catch (err) {
    combined.errors.push(`Article publishing failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  return combined;
}
