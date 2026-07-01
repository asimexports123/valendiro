import { createAdminClient } from "@/lib/supabase/admin";
import { createLinkSuggestion } from "./internalLinkingEngine";
import { KnowledgeObjectType } from "@/lib/types";

export async function buildHierarchicalLinksForTopic(topicId: string) {
  const supabase = createAdminClient();
  const created: { source: string; target: string }[] = [];

  const { data: topic } = await supabase
    .from("topics")
    .select("id, category_id, subcategory_id")
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

  // Topic -> Subcategory
  if (topic.subcategory_id) {
    await createLinkSuggestion({
      sourceObjectId: topicId,
      sourceObjectType: "topic",
      targetObjectId: topic.subcategory_id,
      targetObjectType: "subcategory",
      anchorText: "subcategory",
      relevanceScore: 90,
      clusterStrengthScore: 95,
      contextSnippet: "Topic belongs to Subcategory",
    });
    created.push({ source: "topic", target: "subcategory" });
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

  // Topic -> Related topics in same Subcategory or category
  let relatedQuery = supabase
    .from("topics")
    .select("id")
    .neq("id", topicId)
    .eq("status", "published");
  if (topic.subcategory_id) {
    relatedQuery = relatedQuery.eq("subcategory_id", topic.subcategory_id);
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
  const supabase = createAdminClient();
  const created: { source: string; target: string }[] = [];

  const { data: article } = await supabase
    .from("articles")
    .select("id, topic_id")
    .eq("id", articleId)
    .single();
  if (!article || !article.topic_id) return { created, count: 0 };

  const { data: topic } = await supabase
    .from("topics")
    .select("id, category_id, subcategory_id")
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

  // Article -> Subcategory
  if (topic.subcategory_id) {
    await createLinkSuggestion({
      sourceObjectId: articleId,
      sourceObjectType: "article",
      targetObjectId: topic.subcategory_id,
      targetObjectType: "topic",
      anchorText: "subcategory",
      relevanceScore: 85,
      clusterStrengthScore: 90,
      contextSnippet: "Article belongs to Subcategory via topic",
    });
    created.push({ source: "article", target: "subcategory" });
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

export async function buildHierarchicalLinksForSubcategory(subcategoryId: string) {
  const supabase = createAdminClient();
  const created: { source: string; target: string }[] = [];

  const { data: Subcategory } = await supabase
    .from("subcategories")
    .select("id, category_id")
    .eq("id", subcategoryId)
    .single();
  if (!Subcategory) return { created, count: 0 };

  // Subcategory -> Category
  if (Subcategory.category_id) {
    await createLinkSuggestion({
      sourceObjectId: subcategoryId,
      sourceObjectType: "subcategory",
      targetObjectId: Subcategory.category_id,
      targetObjectType: "category",
      anchorText: "Category",
      relevanceScore: 90,
      clusterStrengthScore: 95,
      contextSnippet: "Subcategory belongs to category",
    });
    created.push({ source: "subcategory", target: "category" });
  }

  // Subcategory -> Topics
  const { data: topics } = await supabase
    .from("topics")
    .select("id")
    .eq("subcategory_id", subcategoryId)
    .eq("status", "published");
  for (const topic of topics || []) {
    await createLinkSuggestion({
      sourceObjectId: subcategoryId,
      sourceObjectType: "subcategory",
      targetObjectId: topic.id,
      targetObjectType: "topic",
      relevanceScore: 85,
      clusterStrengthScore: 90,
      contextSnippet: "Topic belongs to Subcategory",
    });
    created.push({ source: "subcategory", target: "topic" });
  }

  return { created, count: created.length };
}

export async function buildHierarchicalLinksForCategory(categoryId: string) {
  const supabase = createAdminClient();
  const created: { source: string; target: string }[] = [];

  // Category -> Subcategories
  const { data: subcategories } = await supabase
    .from("subcategories")
    .select("id")
    .eq("category_id", categoryId);
  for (const Subcategory of subcategories || []) {
    await createLinkSuggestion({
      sourceObjectId: categoryId,
      sourceObjectType: "category",
      targetObjectId: Subcategory.id,
      targetObjectType: "subcategory",
      relevanceScore: 85,
      clusterStrengthScore: 90,
      contextSnippet: "Subcategory belongs to category",
    });
    created.push({ source: "category", target: "subcategory" });
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
