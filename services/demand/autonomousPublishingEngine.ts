import { createAdminClient } from "@/lib/supabase/admin";
import { ENABLE_DEMAND_DISCOVERY } from "@/lib/constants";
import { captureAllExternalDemand } from "./externalDemandSources";
import { captureInternalSearchIntentDemand, captureSeasonalTrends } from "./demandSources";
import { clusterDemandSignals } from "./topicClustering";
import { approveDemandTopicQueueItems, buildDemandTopicQueue } from "./demandTopicQueue";
import { generateArticleFromTemplate } from "../templates/articleTemplateEngine";
import { humanizeContent, humanizeExcerpt, humanizeMetaDescription } from "../humanization/humanizationProcessor";
import { runAgentPipeline } from "../intelligence/agentPipeline";
import { isQuotaExhaustedError } from "../llm";
import { runKeywordResearch } from "./keywordResearchEngine";
import { runQualityGate, runPlaceholderCheck } from "../seo/qualityGate";
import { getActiveCategories } from "./categoryConfig";
import { queueArticleExpansionsForTopic, expandAllPendingTopics } from "./topicExpansionEngine";
import {
  buildHierarchicalLinksForTopic,
  buildHierarchicalLinksForArticle,
} from "../intelligence/hierarchicalLinkingEngine";
import { runPublishingChecklist, runPostPublishAudit } from "../publishing/publishingChecklist";
import { generateFullArticleSchema } from "../seo/schemaGenerator";
import { assignFeaturedImages } from "../publishing/featuredImageService";

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

function buildTopicContent(rawTitle: string, keyword: string, category: string): string {
  const title = normalizeTitleForTopic(rawTitle);
  const lc = title.toLowerCase();
  const cat = category && category !== "General" ? category : "knowledge";
  const kw = keyword || lc;

  return [
    `## What Is ${title}?`,
    ``,
    `${title} is a core area within ${cat}. It covers the principles, practices, and applications that practitioners rely on to make informed decisions and achieve consistent results.`,
    ``,
    `Understanding ${lc} means grasping not just the surface-level definition but the underlying reasoning — why it works, when to apply it, and what to watch out for.`,
    ``,
    `## Why ${title} Matters`,
    ``,
    `${title} is relevant because it addresses problems that arise repeatedly across different contexts. Professionals who invest in understanding ${lc} build a durable advantage: they solve problems faster, communicate more clearly, and avoid common pitfalls that trip up those without this foundation.`,
    ``,
    `In ${cat}, ${lc} connects directly to outcomes that matter — whether that is better performance, lower risk, or higher quality output.`,
    ``,
    `## Core Principles`,
    ``,
    `The following principles underpin ${title}:`,
    ``,
    `- **Clarity of purpose**: Every application of ${lc} should begin with a clear goal.`,
    `- **Systematic thinking**: ${title} is built on structured approaches, not guesswork.`,
    `- **Evidence-based decisions**: Good practice in ${lc} relies on verifiable information, not assumptions.`,
    `- **Continuous improvement**: The field evolves; practitioners must evolve with it.`,
    ``,
    `## How ${title} Works in Practice`,
    ``,
    `Applying ${lc} follows a repeatable process:`,
    ``,
    `1. **Define the objective** — establish what success looks like before taking action.`,
    `2. **Gather relevant information** — collect the data and context needed to make good decisions.`,
    `3. **Choose the right method** — select from proven approaches within ${lc} based on the situation.`,
    `4. **Execute with care** — implement the chosen approach deliberately, tracking progress.`,
    `5. **Review and refine** — evaluate outcomes and adjust based on what you learn.`,
    ``,
    `## Key Terms and Definitions`,
    ``,
    `Familiarity with the language of ${title} helps learners engage with resources more effectively:`,
    ``,
    `- **${title}**: The primary subject of this topic — a structured area of study and practice within ${cat}.`,
    `- **Foundation**: The baseline knowledge required before exploring advanced aspects of ${lc}.`,
    `- **Framework**: A structured model for applying ${lc} concepts consistently.`,
    `- **Outcome**: The measurable result of applying ${lc} in a given context.`,
    ``,
    `## Common Challenges`,
    ``,
    `Learners and practitioners regularly encounter these obstacles with ${lc}:`,
    ``,
    `- **Overwhelm from breadth**: ${title} is a large field. Breaking it into smaller topics helps manage complexity.`,
    `- **Ambiguity in application**: Not every situation is textbook. Developing judgment takes time and real-world practice.`,
    `- **Keeping current**: Like all fields in ${cat}, ${lc} develops over time. Staying updated requires deliberate effort.`,
    ``,
    `## Getting Started with ${title}`,
    ``,
    `The most effective way to begin is to:`,
    ``,
    `1. Read the foundational articles in this topic to build a clear mental model.`,
    `2. Apply one concept at a time in a low-stakes context before scaling up.`,
    `3. Review your results honestly and seek feedback from practitioners further along the learning path.`,
    ``,
    `The articles and guides below are organized to support exactly this progression.`,
    ``,
    `## Learning Path`,
    ``,
    `This topic is part of a structured knowledge hierarchy within ${cat}. Work through the articles in sequence for the most coherent learning experience. Each article addresses a specific question or skill within ${lc}, building on the previous.`,
    ``,
    `## Further Reading`,
    ``,
    `Explore the articles, guides, and related topics linked from this page. Each one deepens your understanding of a specific aspect of ${lc} and connects to the broader landscape of ${cat}.`,
  ].join("\n");
}

export interface PublishingEngineResult {
  demandInserted: number;
  clustersCreated: number;
  categoriesCreated: number;
  collectionsCreated: number;
  queuedTopics: number;
  topicsPublished: number;
  articleExpansionsQueued: number;
  articlesPublished: number;
  errors: string[];
}

export async function runAutonomousPublishingPipeline(): Promise<PublishingEngineResult> {
  const result: PublishingEngineResult = {
    demandInserted: 0,
    clustersCreated: 0,
    categoriesCreated: 0,
    collectionsCreated: 0,
    queuedTopics: 0,
    topicsPublished: 0,
    articleExpansionsQueued: 0,
    articlesPublished: 0,
    errors: [],
  };

  const supabase = createAdminClient();

  if (!ENABLE_DEMAND_DISCOVERY) {
    return result;
  }

  // Step 1: Demand discovery
  try {
    const internal = await captureInternalSearchIntentDemand("en");
    const seasonal = await captureSeasonalTrends("en");
    const external = await captureAllExternalDemand();
    result.demandInserted = internal.inserted + seasonal.inserted + external.inserted;
    if (internal.error) result.errors.push(internal.error);
    if (seasonal.error) result.errors.push(seasonal.error);
    if (external.error) result.errors.push(external.error);
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : "Demand discovery failed");
  }

  // Step 2: Topic clustering + automatic category and collection creation
  try {
    const clusterResult = await clusterDemandSignals("en");
    result.clustersCreated += clusterResult.clustersCreated;
    result.categoriesCreated += clusterResult.categoriesCreated;
    result.collectionsCreated += clusterResult.collectionsCreated;
    result.errors.push(...clusterResult.errors);
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : "Clustering failed");
  }

  // Step 3: Queue filtering (duplicates, near-duplicates, cannibalization)
  try {
    const queueResult = await buildDemandTopicQueue(45, 100);
    result.queuedTopics += queueResult.queued;
    result.errors.push(...queueResult.errors);
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : "Queue filtering failed");
  }

  // Step 4: Keyword Research Decision Gate + Promote to content generation queue
  try {
    const approvedItems = await approveDemandTopicQueueItems(10);
    // Load active categories once for all keywords in this run
    const activeCategories = await getActiveCategories();
    for (const item of approvedItems) {
      // ── Decision Engine: every keyword must pass research before any content is created ──
      const research = runKeywordResearch(item.keyword, activeCategories);

      // Store research result back on the demand_topic_queue item regardless of decision
      await supabase
        .from("demand_topic_queue")
        .update({
          metadata: {
            ...(item.metadata as Record<string, unknown> || {}),
            keyword_research: research,
          },
        })
        .eq("id", item.id);

      if (research.decision === "reject") {
        result.errors.push(`Rejected by Decision Engine: ${item.keyword} — ${research.decisionReason}`);
        await supabase
          .from("demand_topic_queue")
          .update({ status: "rejected", rejection_reason: research.decisionReason })
          .eq("id", item.id);
        continue;
      }

      if (research.decision === "backlog") {
        // Store in queue but don't promote to content generation yet
        await supabase
          .from("demand_topic_queue")
          .update({ status: "pending", rejection_reason: `Backlog: ${research.decisionReason}` })
          .eq("id", item.id);
        continue;
      }

      // decision === "publish" — promote to content generation queue
      const { error: queueError } = await supabase.from("content_generation_queue").insert({
        object_type: "topic",
        title: item.title,
        description: item.description,
        reason: `Decision Engine approved: ${item.keyword} (score ${research.finalDecisionScore})`,
        priority_score: research.finalDecisionScore,
        status: "pending",
        metadata: {
          demand_topic_queue_id: item.id,
          keyword: item.keyword,
          category: item.category,
          collection_id: item.collection_id,
          intent: research.searchIntent,
          detected_entity: research.detectedEntity,
          keyword_research: research,
        },
      });

      if (queueError) {
        result.errors.push(queueError.message);
      } else {
        result.queuedTopics++;
        await supabase.from("demand_topic_queue").update({ status: "approved" }).eq("id", item.id);
      }
    }
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : "Promotion to generation queue failed");
  }

  return result;
}

export async function publishApprovedTopics(limit = 10): Promise<PublishingEngineResult> {
  const result: PublishingEngineResult = {
    demandInserted: 0,
    clustersCreated: 0,
    categoriesCreated: 0,
    collectionsCreated: 0,
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
      const collectionId = metadata.collection_id as string | null;

      let categoryId: string | null = null;
      if (collectionId) {
        const { data: collection } = await supabase.from("collections").select("category_id").eq("id", collectionId).single();
        categoryId = collection?.category_id ?? null;
      }
      if (!categoryId && metadata.category) {
        const { data: cat } = await supabase
          .from("categories")
          .select("id")
          .eq("category_translations.name", metadata.category as string)
          .eq("category_translations.language_code", "en")
          .maybeSingle();
        categoryId = cat?.id ?? null;
      }

      const cleanSlugTitle = normalizeTitleForTopic(item.title);
      const slug = cleanSlugTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 100);
      const canonicalPath = `/en/topics/${slug}`;

      const { data: topic, error: topicError } = await supabase
        .from("topics")
        .insert({
          slug,
          canonical_path: canonicalPath,
          category_id: categoryId,
          collection_id: collectionId,
          status: "published",
          published_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (topicError || !topic) {
        throw new Error(topicError?.message || "Topic insert failed");
      }

      const topicKeyword = (metadata.keyword as string) || item.title;
      const topicCategory = (metadata.category as string) || "General";
      const cleanTitle = normalizeTitleForTopic(item.title);
      const topicContent = buildTopicContent(item.title, topicKeyword, topicCategory);
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
        collectionId: collectionId,
        categoryId: categoryId,
        keywordDecision: (metadata.keyword_research as { decision?: string } | undefined)?.decision as "publish" | "backlog" | "reject" | null ?? "publish",
      });
      if (!checklist.passed) {
        throw new Error(`Stage 12 checklist failed: ${checklist.blockers.join("; ")}`);
      }

      await supabase.from("topic_translations").insert({
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

      // Build knowledge-graph links: topic -> category, collection, articles, related topics
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
    collectionsCreated: 0,
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
      if (!resolvedTopicId) {
        const keyword = (metadata.keyword as string) || item.title;
        const slugGuess = keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
        const { data: matchedTopic } = await supabase
          .from("topics")
          .select("id, slug")
          .or(`slug.ilike.%${slugGuess.slice(0, 30)}%,name.ilike.%${keyword.slice(0, 40)}%`)
          .limit(1)
          .maybeSingle();
        if (matchedTopic) resolvedTopicId = matchedTopic.id;
      }

      // ── 5-Agent Gemini Pipeline ────────────────────────────────────────────
      // Agent 1: Research  → Agent 2: Outline → Agent 3: Write
      // Agent 4: Review    → Agent 5: SEO     → Save as DRAFT
      const activeCategories = await getActiveCategories();
      const kwResult = runKeywordResearch(item.title, activeCategories);
      const categoryLabel = kwResult.categoryLabel ?? "General Knowledge";

      let content: string;
      let generated: { title: string; excerpt: string; content: string; metaTitle: string; metaDescription: string };
      let qualityScore = 0;
      let seoScore = 0;
      let agentDurations: Record<string, number> = {};

      try {
        const pipeline = await runAgentPipeline(item.title, categoryLabel);

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
          ? await supabase.from("topics").select("slug, category_id, collection_id, topic_translations(title), categories(slug, category_translations(name)), collections(slug, collection_translations(name))").eq("id", item.topic_id).maybeSingle()
          : { data: null };

        const catSlug = (parentTopic?.categories as any)?.slug ?? "general";
        const catName = (parentTopic?.categories as any)?.category_translations?.[0]?.name ?? "General";
        const colSlug = (parentTopic?.collections as any)?.slug ?? null;
        const colName = (parentTopic?.collections as any)?.collection_translations?.[0]?.name ?? null;
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
          collectionName: colName,
          collectionSlug: colSlug,
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

// Article publishing is gated behind an environment variable.
// Set ARTICLE_PUBLISHING_ENABLED=true in .env.local to enable.
// Default: true — pipeline publishes articles after all quality and checklist gates pass.
const ARTICLE_PUBLISHING_ENABLED = process.env.ARTICLE_PUBLISHING_ENABLED !== "false";
const TOPIC_PUBLISH_LIMIT = 10;

export async function runFullPublishingCycle(): Promise<PublishingEngineResult> {
  const result = await runAutonomousPublishingPipeline();
  const topicResult = await publishApprovedTopics(TOPIC_PUBLISH_LIMIT);

  const articleExpansionsQueued = topicResult.articleExpansionsQueued;
  let articlesPublished = 0;
  const articleErrors: string[] = [];

  if (ARTICLE_PUBLISHING_ENABLED) {
    const internalExpansion = await expandAllPendingTopics(10);
    const articleResult = await publishApprovedArticles(10);
    articlesPublished = articleResult.articlesPublished;
    articleErrors.push(...articleResult.errors);
  }

  return {
    demandInserted: result.demandInserted,
    clustersCreated: result.clustersCreated,
    categoriesCreated: result.categoriesCreated + topicResult.categoriesCreated,
    collectionsCreated: result.collectionsCreated + topicResult.collectionsCreated,
    queuedTopics: result.queuedTopics,
    topicsPublished: topicResult.topicsPublished,
    articleExpansionsQueued,
    articlesPublished,
    errors: [...result.errors, ...topicResult.errors, ...articleErrors],
  };
}
