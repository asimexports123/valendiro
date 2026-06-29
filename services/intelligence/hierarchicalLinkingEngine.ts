import { createClient } from "@/lib/supabase/server";
import { createLinkSuggestion } from "./internalLinkingEngine";
import { KnowledgeObjectType } from "@/lib/types";

export async function buildHierarchicalLinksForTopic(topicId: string) {
  const supabase = await createClient();
  const created: { source: string; target: string }[] = [];

  const { data: topic } = await supabase
    .from("topics")
    .select("id, category_id, collection_id")
    .eq("id", topicId)
    .single();
  if (!topic) return { created, count: 0 };

  // Topic -> Category
  if (topic.category_id) {
    await createLinkSuggestion({
      sourceObjectId: topicId,
      sourceObjectType: "topic",
      targetObjectId: topic.category_id,
      targetObjectType: "category",
      anchorText: "Category",
      relevanceScore: 90,
      clusterStrengthScore: 95,
      contextSnippet: "Topic belongs to category",
    });
    created.push({ source: "topic", target: "category" });
  }

  // Topic -> Collection
  if (topic.collection_id) {
    await createLinkSuggestion({
      sourceObjectId: topicId,
      sourceObjectType: "topic",
      targetObjectId: topic.collection_id,
      targetObjectType: "collection",
      anchorText: "Collection",
      relevanceScore: 90,
      clusterStrengthScore: 95,
      contextSnippet: "Topic belongs to collection",
    });
    created.push({ source: "topic", target: "collection" });
  }

  // Topic -> Articles in this topic
  const { data: articles } = await supabase
    .from("articles")
    .select("id")
    .eq("topic_id", topicId)
    .eq("status", "published");
  for (const article of articles || []) {
    await createLinkSuggestion({
      sourceObjectId: topicId,
      sourceObjectType: "topic",
      targetObjectId: article.id,
      targetObjectType: "article",
      relevanceScore: 95,
      clusterStrengthScore: 95,
      contextSnippet: "Article belongs to topic",
    });
    created.push({ source: "topic", target: "article" });
  }

  // Topic -> Related topics in same collection or category
  let relatedQuery = supabase
    .from("topics")
    .select("id")
    .neq("id", topicId)
    .eq("status", "published");
  if (topic.collection_id) {
    relatedQuery = relatedQuery.eq("collection_id", topic.collection_id);
  } else if (topic.category_id) {
    relatedQuery = relatedQuery.eq("category_id", topic.category_id);
  } else {
    relatedQuery = relatedQuery.limit(0);
  }
  relatedQuery = relatedQuery.limit(6);
  const { data: relatedTopics } = await relatedQuery;
  for (const related of relatedTopics || []) {
    await createLinkSuggestion({
      sourceObjectId: topicId,
      sourceObjectType: "topic",
      targetObjectId: related.id,
      targetObjectType: "topic",
      relevanceScore: 75,
      clusterStrengthScore: 80,
      contextSnippet: "Related topic in same cluster",
    });
    created.push({ source: "topic", target: "topic" });
  }

  return { created, count: created.length };
}

export async function buildHierarchicalLinksForArticle(articleId: string) {
  const supabase = await createClient();
  const created: { source: string; target: string }[] = [];

  const { data: article } = await supabase
    .from("articles")
    .select("id, topic_id")
    .eq("id", articleId)
    .single();
  if (!article || !article.topic_id) return { created, count: 0 };

  const { data: topic } = await supabase
    .from("topics")
    .select("id, category_id, collection_id")
    .eq("id", article.topic_id)
    .single();
  if (!topic) return { created, count: 0 };

  // Article -> Topic
  await createLinkSuggestion({
    sourceObjectId: articleId,
    sourceObjectType: "article",
    targetObjectId: topic.id,
    targetObjectType: "topic",
    anchorText: "Topic",
    relevanceScore: 95,
    clusterStrengthScore: 95,
    contextSnippet: "Article belongs to topic",
  });
  created.push({ source: "article", target: "topic" });

  // Article -> Collection
  if (topic.collection_id) {
    await createLinkSuggestion({
      sourceObjectId: articleId,
      sourceObjectType: "article",
      targetObjectId: topic.collection_id,
      targetObjectType: "topic",
      anchorText: "Collection",
      relevanceScore: 85,
      clusterStrengthScore: 90,
      contextSnippet: "Article belongs to collection via topic",
    });
    created.push({ source: "article", target: "collection" });
  }

  // Article -> Category
  if (topic.category_id) {
    await createLinkSuggestion({
      sourceObjectId: articleId,
      sourceObjectType: "article",
      targetObjectId: topic.category_id,
      targetObjectType: "topic",
      anchorText: "Category",
      relevanceScore: 80,
      clusterStrengthScore: 85,
      contextSnippet: "Article belongs to category via topic",
    });
    created.push({ source: "article", target: "category" });
  }

  return { created, count: created.length };
}

export async function buildHierarchicalLinksForCollection(collectionId: string) {
  const supabase = await createClient();
  const created: { source: string; target: string }[] = [];

  const { data: collection } = await supabase
    .from("collections")
    .select("id, category_id")
    .eq("id", collectionId)
    .single();
  if (!collection) return { created, count: 0 };

  // Collection -> Category
  if (collection.category_id) {
    await createLinkSuggestion({
      sourceObjectId: collectionId,
      sourceObjectType: "collection",
      targetObjectId: collection.category_id,
      targetObjectType: "category",
      anchorText: "Category",
      relevanceScore: 90,
      clusterStrengthScore: 95,
      contextSnippet: "Collection belongs to category",
    });
    created.push({ source: "collection", target: "category" });
  }

  // Collection -> Topics
  const { data: topics } = await supabase
    .from("topics")
    .select("id")
    .eq("collection_id", collectionId)
    .eq("status", "published");
  for (const topic of topics || []) {
    await createLinkSuggestion({
      sourceObjectId: collectionId,
      sourceObjectType: "collection",
      targetObjectId: topic.id,
      targetObjectType: "topic",
      relevanceScore: 85,
      clusterStrengthScore: 90,
      contextSnippet: "Topic belongs to collection",
    });
    created.push({ source: "collection", target: "topic" });
  }

  return { created, count: created.length };
}

export async function buildHierarchicalLinksForCategory(categoryId: string) {
  const supabase = await createClient();
  const created: { source: string; target: string }[] = [];

  // Category -> Collections
  const { data: collections } = await supabase
    .from("collections")
    .select("id")
    .eq("category_id", categoryId);
  for (const collection of collections || []) {
    await createLinkSuggestion({
      sourceObjectId: categoryId,
      sourceObjectType: "category",
      targetObjectId: collection.id,
      targetObjectType: "collection",
      relevanceScore: 85,
      clusterStrengthScore: 90,
      contextSnippet: "Collection belongs to category",
    });
    created.push({ source: "category", target: "collection" });
  }

  // Category -> Topics
  const { data: topics } = await supabase
    .from("topics")
    .select("id")
    .eq("category_id", categoryId)
    .eq("status", "published");
  for (const topic of topics || []) {
    await createLinkSuggestion({
      sourceObjectId: categoryId,
      sourceObjectType: "category",
      targetObjectId: topic.id,
      targetObjectType: "topic",
      relevanceScore: 80,
      clusterStrengthScore: 85,
      contextSnippet: "Topic belongs to category",
    });
    created.push({ source: "category", target: "topic" });
  }

  return { created, count: created.length };
}
