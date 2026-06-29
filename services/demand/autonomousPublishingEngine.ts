import { createClient } from "@/lib/supabase/server";
import { ENABLE_DEMAND_DISCOVERY } from "@/lib/constants";
import { captureAllExternalDemand } from "./externalDemandSources";
import { captureInternalSearchIntentDemand, captureSeasonalTrends } from "./demandSources";
import { clusterDemandSignals } from "./topicClustering";
import { approveDemandTopicQueueItems, buildDemandTopicQueue } from "./demandTopicQueue";
import { generateArticleFromTemplate } from "../templates/articleTemplateEngine";
import { humanizeContent, humanizeExcerpt, humanizeMetaDescription } from "../humanization/humanizationProcessor";
import { checkDuplicateContentBeforePublish } from "../seo/duplicateContentDetector";

export interface PublishingEngineResult {
  demandInserted: number;
  clustersCreated: number;
  categoriesCreated: number;
  queuedTopics: number;
  articlesPublished: number;
  errors: string[];
}

export async function runAutonomousPublishingPipeline(): Promise<PublishingEngineResult> {
  const result: PublishingEngineResult = {
    demandInserted: 0,
    clustersCreated: 0,
    categoriesCreated: 0,
    queuedTopics: 0,
    articlesPublished: 0,
    errors: [],
  };

  const supabase = await createClient();

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

  // Step 2: Topic clustering + category auto-creation
  try {
    const clusterResult = await clusterDemandSignals("en");
    result.clustersCreated += clusterResult.clustersCreated;
    result.categoriesCreated += clusterResult.categoriesCreated;
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

  // Step 4: Promote approved items to content_generation_queue
  try {
    const approvedItems = await approveDemandTopicQueueItems(10);
    for (const item of approvedItems) {
      const { error: queueError } = await supabase.from("content_generation_queue").insert({
        object_type: "article",
        title: item.title,
        description: item.description,
        reason: `Autonomous demand: ${item.keyword} (score ${item.opportunity_score})`,
        priority_score: Math.round(item.opportunity_score),
        status: "pending",
        metadata: {
          demand_topic_queue_id: item.id,
          keyword: item.keyword,
          category: item.category,
          intent: item.search_intent,
          template: "informational",
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

export async function publishApprovedDemandArticles(limit = 5): Promise<PublishingEngineResult> {
  const result: PublishingEngineResult = {
    demandInserted: 0,
    clustersCreated: 0,
    categoriesCreated: 0,
    queuedTopics: 0,
    articlesPublished: 0,
    errors: [],
  };

  const supabase = await createClient();

  const { data: queueItems, error } = await supabase
    .from("content_generation_queue")
    .select("*")
    .eq("status", "pending")
    .not("metadata->demand_topic_queue_id", "is", null)
    .order("priority_score", { ascending: false })
    .limit(limit);

  if (error || !queueItems) {
    result.errors.push(error?.message || "No demand articles to publish");
    return result;
  }

  for (const item of queueItems) {
    try {
      const metadata = (item.metadata as Record<string, unknown>) || {};
      const generated = generateArticleFromTemplate("informational", {
        title: item.title,
        description: item.description,
        languageCode: "en",
      });

      let content = humanizeContent(generated.content);
      const excerpt = humanizeExcerpt(generated.excerpt);
      const metaDescription = humanizeMetaDescription(generated.metaDescription);

      const duplicateCheck = await checkDuplicateContentBeforePublish({
        objectId: null,
        objectType: "article",
        languageCode: "en",
        content,
      });
      if (duplicateCheck.isDuplicate) {
        throw new Error(`Duplicate content detected: ${duplicateCheck.reason}`);
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
          article_type: "guide",
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

      await supabase.from("content_generation_queue").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", item.id);

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
