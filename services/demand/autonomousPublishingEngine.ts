import { createAdminClient } from "@/lib/supabase/admin";
import { ENABLE_DEMAND_DISCOVERY } from "@/lib/constants";
import { captureAllExternalDemand } from "./externalDemandSources";
import { captureInternalSearchIntentDemand, captureSeasonalTrends } from "./demandSources";
import { clusterDemandSignals } from "./topicClustering";
import { approveDemandTopicQueueItems, buildDemandTopicQueue } from "./demandTopicQueue";
import { generateArticleFromTemplate } from "../templates/articleTemplateEngine";
import { humanizeContent, humanizeExcerpt, humanizeMetaDescription } from "../humanization/humanizationProcessor";
import { runQualityGate, runPlaceholderCheck } from "../seo/qualityGate";
import { queueArticleExpansionsForTopic, expandAllPendingTopics } from "./topicExpansionEngine";
import {
  buildHierarchicalLinksForTopic,
  buildHierarchicalLinksForArticle,
} from "../intelligence/hierarchicalLinkingEngine";

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
  const sections = [
    `## What is ${title}?`,
    `${title} is a topic within ${cat}. Understanding ${lc} helps you build practical knowledge and make better decisions.`,
    ``,
    `## Why ${title} Matters`,
    `Whether you're a beginner or an experienced learner, ${lc} is worth exploring in depth. It connects to broader ideas in ${cat} with real-world applications across many fields.`,
    ``,
    `## Key Concepts`,
    `- The core principles of ${lc} and how they work in practice`,
    `- The most common questions people have about ${lc}`,
    `- How ${lc} connects to related topics in ${cat}`,
    `- Where to start and what resources are most useful`,
    ``,
    `## Getting Started`,
    `Start with the articles and guides listed below — they cover the most important aspects of ${lc} in a clear, approachable way.`,
    ``,
    `## Related Reading`,
    `Explore the related articles and questions on this page to deepen your understanding of ${lc}.`,
  ];
  return sections.join("\n");
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

  // Step 4: Promote approved demand topics to the content generation queue as Topics
  try {
    const approvedItems = await approveDemandTopicQueueItems(10);
    for (const item of approvedItems) {
      const { error: queueError } = await supabase.from("content_generation_queue").insert({
        object_type: "topic",
        title: item.title,
        description: item.description,
        reason: `Autonomous demand: ${item.keyword} (score ${item.opportunity_score})`,
        priority_score: Math.round(item.opportunity_score),
        status: "pending",
        metadata: {
          demand_topic_queue_id: item.id,
          keyword: item.keyword,
          category: item.category,
          collection_id: item.collection_id,
          intent: item.search_intent,
        },
      });

      if (queueError) {
        result.errors.push(queueError.message);
      } else {
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

      // Step 5: Auto-expand the topic into a set of supporting articles
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
    .eq("status", "pending")
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
      const template = (metadata.template as "informational" | "faq" | "comparison" | "affiliate") || "informational";
      const articleType = (metadata.article_type as "guide" | "explainer" | "reference" | "comparison" | "tutorial") || "guide";
      const generated = generateArticleFromTemplate(template, {
        title: item.title,
        description: item.description,
        languageCode: "en",
        keywords: metadata.keyword ? [metadata.keyword as string] : undefined,
      });

      let content = humanizeContent(generated.content);
      const excerpt = humanizeExcerpt(generated.excerpt);
      const metaDescription = humanizeMetaDescription(generated.metaDescription);

      const quality = await runQualityGate({
        objectId: null,
        objectType: "article",
        languageCode: "en",
        content,
        topicId: item.topic_id,
      });
      if (!quality.passed) {
        const failed = Object.values(quality.checks)
          .filter((c) => !c.passed)
          .map((c) => c.reason)
          .join("; ");
        throw new Error(`Quality gate failed: ${failed}`);
      }

      const slug = item.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 100);
      const canonicalPath = `/en/articles/${slug}`;

      const { data: article, error: articleError } = await supabase
        .from("articles")
        .insert({
          slug,
          canonical_path: canonicalPath,
          topic_id: item.topic_id,
          article_type: articleType,
          status: "published",
          published_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (articleError || !article) {
        throw new Error(articleError?.message || "Article insert failed");
      }

      await supabase.from("article_translations").insert({
        article_id: article.id,
        language_code: "en",
        title: generated.title,
        excerpt,
        content,
        meta_title: generated.metaTitle,
        meta_description: metaDescription,
      });

      await buildHierarchicalLinksForArticle(article.id);

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

// QUALITY GATE: Set to true only after all 10 pilot topics have been manually audited
const ARTICLE_PUBLISHING_ENABLED = false;
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
