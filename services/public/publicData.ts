import { createAdminClient } from "@/lib/supabase/admin";
import { V1_DEFAULT_CONFIG } from "@/services/demand/categoryConfig";

export interface PublicArticle {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  reading_time: number;
  updated_at: string | null;
}

export interface PublicTopic {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
}

export interface PublicCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  article_count: number;
}

export interface PublicCollection {
  id: string;
  slug: string;
  category_id: string;
  name: string;
  description: string;
}

const V1_CATEGORY_SLUGS = [
  "technology",
  "personal-finance",
  "business",
  "education",
  "health-wellness",
  "home-lifestyle",
  "travel",
];

async function getV1CategoryIds(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select("id")
    .in("slug", V1_CATEGORY_SLUGS);
  return (data || []).map((c: any) => c.id);
}

export function estimateReadingTime(text: string | null): number {
  if (!text) return 1;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export async function getCategories(limit = 12): Promise<{ id: string; slug: string; name: string }[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, sort_order, category_translations(name)")
    .eq("category_translations.language_code", "en")
    .order("sort_order", { ascending: true })
    .limit(limit);

  const categories = (data || []).map((category: any) => ({
    id: category.id,
    slug: category.slug,
    name: category.category_translations?.[0]?.name || "Uncategorized",
  }));

  return categories.sort((a, b) => a.name.localeCompare(b.name));
}

export interface PublicQuestion {
  id: string;
  question_text: string;
  answer: string | null;
}

export async function getRecentQuestions(limit = 5): Promise<PublicQuestion[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("questions")
    .select("id, question_translations(question_text, answer)")
    .eq("status", "published")
    .eq("question_translations.language_code", "en")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []).map((question: any) => ({
    id: question.id,
    question_text: question.question_translations?.[0]?.question_text || "",
    answer: question.question_translations?.[0]?.answer || null,
  }));
}

export async function getTrendingTopics(limit = 10): Promise<PublicTopic[]> {
  const supabase = createAdminClient();
  const categoryIds = await getV1CategoryIds();
  if (categoryIds.length === 0) return [];

  const { data } = await supabase
    .from("topics")
    .select("id, slug, topic_translations(title, subtitle)")
    .eq("status", "published")
    .in("category_id", categoryIds)
    .eq("topic_translations.language_code", "en")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []).map((topic: any) => ({
    id: topic.id,
    slug: topic.slug,
    title: topic.topic_translations?.[0]?.title || "Untitled",
    subtitle: topic.topic_translations?.[0]?.subtitle || "",
  }));
}

export async function getCategoriesWithCounts(limit = 12): Promise<PublicCategory[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, sort_order, category_translations(name, description)")
    .eq("category_translations.language_code", "en")
    .order("sort_order", { ascending: true })
    .limit(limit);

  const dbCategories = (data || []).map((category: any) => ({
    id: category.id,
    slug: category.slug,
    name: category.category_translations?.[0]?.name || "Uncategorized",
    description: category.category_translations?.[0]?.description || "",
    article_count: 0,
  }));

  // Count topics per DB category
  for (const category of dbCategories) {
    const { count } = await supabase
      .from("topics")
      .select("id", { count: "exact", head: true })
      .eq("category_id", category.id)
      .eq("status", "published");
    category.article_count = count ?? 0;
  }

  // Merge with V1 config — always show all 7 V1 categories even if not yet in DB
  const dbSlugs = new Set(dbCategories.map((c) => c.slug));
  const v1Extras: PublicCategory[] = V1_DEFAULT_CONFIG.categories
    .filter((v) => v.enabled && !dbSlugs.has(v.slug))
    .map((v) => ({
      id: v.slug,
      slug: v.slug,
      name: v.label,
      description: `Explore ${v.label} guides, tutorials and resources.`,
      article_count: 0,
    }));

  const merged = [...dbCategories, ...v1Extras];

  // Sort by V1 priority order
  const v1Order = V1_DEFAULT_CONFIG.categories.map((c) => c.slug);
  return merged
    .sort((a, b) => {
      const ai = v1Order.indexOf(a.slug);
      const bi = v1Order.indexOf(b.slug);
      if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    })
    .slice(0, limit);
}

export async function getLatestArticles(limit = 6): Promise<PublicArticle[]> {
  const supabase = createAdminClient();
  const categoryIds = await getV1CategoryIds();

  const { data: v1Topics } = categoryIds.length > 0
    ? await supabase.from("topics").select("id").in("category_id", categoryIds).eq("status", "published")
    : { data: [] };
  const v1TopicIds = (v1Topics || []).map((t: any) => t.id);
  if (v1TopicIds.length === 0) return [];

  const { data } = await supabase
    .from("articles")
    .select("id, slug, updated_at, article_translations(title, excerpt, content)")
    .eq("status", "published")
    .in("topic_id", v1TopicIds)
    .eq("article_translations.language_code", "en")
    .order("updated_at", { ascending: false })
    .limit(limit);

  return (data || []).map((article: any) => {
    const translation = article.article_translations?.[0];
    const text = translation?.content || translation?.excerpt || "";
    return {
      id: article.id,
      slug: article.slug,
      title: translation?.title || "Untitled",
      description: translation?.excerpt || null,
      reading_time: estimateReadingTime(text),
      updated_at: article.updated_at,
    };
  });
}

export async function getFeaturedCollections(limit = 6): Promise<PublicCollection[]> {
  const supabase = createAdminClient();
  const categoryIds = await getV1CategoryIds();
  if (categoryIds.length === 0) return [];

  const { data } = await supabase
    .from("collections")
    .select("id, slug, category_id, collection_translations(name, description)")
    .in("category_id", categoryIds)
    .eq("collection_translations.language_code", "en")
    .order("sort_order", { ascending: true })
    .limit(limit);

  return (data || []).map((collection: any) => ({
    id: collection.id,
    slug: collection.slug,
    category_id: collection.category_id,
    name: collection.collection_translations?.[0]?.name || collection.slug,
    description: collection.collection_translations?.[0]?.description || "",
  }));
}

export async function getCollectionsByCategory(categoryId: string, limit = 12): Promise<PublicCollection[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("collections")
    .select("id, slug, category_id, collection_translations(name, description)")
    .eq("category_id", categoryId)
    .eq("collection_translations.language_code", "en")
    .order("sort_order", { ascending: true })
    .limit(limit);

  return (data || []).map((collection: any) => ({
    id: collection.id,
    slug: collection.slug,
    category_id: collection.category_id,
    name: collection.collection_translations?.[0]?.name || collection.slug,
    description: collection.collection_translations?.[0]?.description || "",
  }));
}

export async function getCollectionBySlug(slug: string): Promise<PublicCollection | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("collections")
    .select("id, slug, category_id, collection_translations(name, description)")
    .eq("slug", slug)
    .eq("collection_translations.language_code", "en")
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    slug: data.slug,
    category_id: data.category_id,
    name: data.collection_translations?.[0]?.name || data.slug,
    description: data.collection_translations?.[0]?.description || "",
  };
}

export async function getTopicsByCollection(collectionId: string, limit = 12): Promise<PublicTopic[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("topics")
    .select("id, slug, topic_translations(title, subtitle)")
    .eq("collection_id", collectionId)
    .eq("status", "published")
    .eq("topic_translations.language_code", "en")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []).map((topic: any) => ({
    id: topic.id,
    slug: topic.slug,
    title: topic.topic_translations?.[0]?.title || "Untitled",
    subtitle: topic.topic_translations?.[0]?.subtitle || "",
  }));
}

export async function getArticlesByTopic(topicId: string, limit = 12): Promise<PublicArticle[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("articles")
    .select("id, slug, updated_at, article_translations(title, excerpt, content)")
    .eq("topic_id", topicId)
    .eq("status", "published")
    .eq("article_translations.language_code", "en")
    .order("updated_at", { ascending: false })
    .limit(limit);

  return (data || []).map((article: any) => {
    const translation = article.article_translations?.[0];
    const text = translation?.content || translation?.excerpt || "";
    return {
      id: article.id,
      slug: article.slug,
      title: translation?.title || "Untitled",
      description: translation?.excerpt || null,
      reading_time: estimateReadingTime(text),
      updated_at: article.updated_at,
    };
  });
}

export async function getArticlesByCollection(collectionId: string, limit = 12): Promise<PublicArticle[]> {
  const supabase = createAdminClient();
  const { data: topicIds } = await supabase
    .from("topics")
    .select("id")
    .eq("collection_id", collectionId)
    .eq("status", "published");
  const ids = (topicIds || []).map((t: any) => t.id);
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from("articles")
    .select("id, slug, updated_at, topic_id, article_translations(title, excerpt, content)")
    .eq("status", "published")
    .eq("article_translations.language_code", "en")
    .in("topic_id", ids)
    .order("updated_at", { ascending: false })
    .limit(limit);

  return (data || []).map((article: any) => {
    const translation = article.article_translations?.[0];
    const text = translation?.content || translation?.excerpt || "";
    return {
      id: article.id,
      slug: article.slug,
      title: translation?.title || "Untitled",
      description: translation?.excerpt || null,
      reading_time: estimateReadingTime(text),
      updated_at: article.updated_at,
    };
  });
}

export async function getPopularGuides(limit = 4): Promise<PublicArticle[]> {
  return getLatestArticles(limit);
}

export async function searchPublicContent(query: string, limit = 20) {
  const supabase = createAdminClient();
  const [articles, topics] = await Promise.all([
    supabase
      .from("articles")
      .select("id, slug, article_translations(title, excerpt)")
      .eq("status", "published")
      .eq("article_translations.language_code", "en")
      .ilike("article_translations.title", `%${query}%`)
      .limit(limit),
    supabase
      .from("topics")
      .select("id, slug, topic_translations(title, subtitle)")
      .eq("status", "published")
      .eq("topic_translations.language_code", "en")
      .ilike("topic_translations.title", `%${query}%`)
      .limit(limit),
  ]);

  return {
    articles: (articles.data || []).map((article: any) => ({
      id: article.id,
      slug: article.slug,
      title: article.article_translations?.[0]?.title || "Untitled",
      excerpt: article.article_translations?.[0]?.excerpt || "",
    })),
    topics: (topics.data || []).map((topic: any) => ({
      id: topic.id,
      slug: topic.slug,
      title: topic.topic_translations?.[0]?.title || "Untitled",
      subtitle: topic.topic_translations?.[0]?.subtitle || "",
    })),
  };
}

export interface PublicCategoryDetail extends PublicCategory {}

export async function getCategoryBySlug(slug: string): Promise<PublicCategoryDetail | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, category_translations(name, description, meta_title, meta_description)")
    .eq("slug", slug)
    .eq("category_translations.language_code", "en")
    .maybeSingle();

  if (!data) return null;

  const translation = data.category_translations?.[0];
  const { count } = await supabase
    .from("topics")
    .select("id", { count: "exact", head: true })
    .eq("category_id", data.id)
    .eq("status", "published");

  return {
    id: data.id,
    slug: data.slug,
    name: translation?.name || "Uncategorized",
    description: translation?.description || null,
    article_count: count ?? 0,
  };
}

export async function getTopicsByCategory(categoryId: string, limit = 12): Promise<PublicTopic[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("topics")
    .select("id, slug, topic_translations(title, subtitle)")
    .eq("category_id", categoryId)
    .eq("status", "published")
    .eq("topic_translations.language_code", "en")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []).map((topic: any) => ({
    id: topic.id,
    slug: topic.slug,
    title: topic.topic_translations?.[0]?.title || "Untitled",
    subtitle: topic.topic_translations?.[0]?.subtitle || "",
  }));
}

export async function getArticlesByCategory(categoryId: string, limit = 12): Promise<PublicArticle[]> {
  const supabase = createAdminClient();
  const { data: topics } = await supabase
    .from("topics")
    .select("id")
    .eq("category_id", categoryId)
    .eq("status", "published");

  const topicIds = (topics || []).map((t: any) => t.id);
  if (topicIds.length === 0) return [];

  const { data } = await supabase
    .from("articles")
    .select("id, slug, updated_at, topic_id, article_translations(title, excerpt, content)")
    .eq("status", "published")
    .eq("article_translations.language_code", "en")
    .in("topic_id", topicIds)
    .order("updated_at", { ascending: false })
    .limit(limit);

  return (data || []).map((article: any) => {
    const translation = article.article_translations?.[0];
    const text = translation?.content || translation?.excerpt || "";
    return {
      id: article.id,
      slug: article.slug,
      title: translation?.title || "Untitled",
      description: translation?.excerpt || null,
      reading_time: estimateReadingTime(text),
      updated_at: article.updated_at,
    };
  });
}

export async function getRelatedCategories(categoryId: string, limit = 5): Promise<PublicCategory[]> {
  return getCategoriesWithCounts(limit);
}

export interface PublicTopicDetail extends PublicTopic {
  content: string | null;
  meta_title: string | null;
  meta_description: string | null;
  category_id: string | null;
  collection_id: string | null;
  updated_at: string | null;
}

export async function getTopicBySlug(slug: string): Promise<PublicTopicDetail | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("topics")
    .select("id, slug, category_id, collection_id, updated_at, topic_translations(title, subtitle, content, meta_title, meta_description)")
    .eq("slug", slug)
    .eq("topic_translations.language_code", "en")
    .eq("status", "published")
    .maybeSingle();

  if (!data) return null;

  const translation = data.topic_translations?.[0];
  return {
    id: data.id,
    slug: data.slug,
    title: translation?.title || "Untitled",
    subtitle: translation?.subtitle || null,
    content: translation?.content || null,
    meta_title: translation?.meta_title || null,
    meta_description: translation?.meta_description || null,
    category_id: data.category_id,
    collection_id: data.collection_id,
    updated_at: data.updated_at ?? null,
  };
}

export async function getRelatedTopics(topicId: string, categoryId: string | null, limit = 6): Promise<PublicTopic[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("topics")
    .select("id, slug, topic_translations(title, subtitle)")
    .neq("id", topicId)
    .eq("status", "published")
    .eq("topic_translations.language_code", "en")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data } = await query;

  return (data || []).map((topic: any) => ({
    id: topic.id,
    slug: topic.slug,
    title: topic.topic_translations?.[0]?.title || "Untitled",
    subtitle: topic.topic_translations?.[0]?.subtitle || "",
  }));
}

export interface PublicArticleDetail {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  reading_time: number;
  updated_at: string | null;
  published_at: string | null;
  topic_id: string | null;
  category_id: string | null;
  collection_id: string | null;
  meta_title: string | null;
  meta_description: string | null;
}

export async function getArticleBySlug(slug: string): Promise<PublicArticleDetail | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("articles")
    .select("id, slug, topic_id, published_at, updated_at, article_translations(title, excerpt, content, meta_title, meta_description)")
    .eq("slug", slug)
    .eq("article_translations.language_code", "en")
    .eq("status", "published")
    .maybeSingle();

  if (!data) return null;

  const translation = data.article_translations?.[0];
  const text = translation?.content || translation?.excerpt || "";

  let category_id: string | null = null;
  let collection_id: string | null = null;
  if (data.topic_id) {
    const { data: topic } = await supabase
      .from("topics")
      .select("category_id, collection_id")
      .eq("id", data.topic_id)
      .maybeSingle();
    category_id = topic?.category_id ?? null;
    collection_id = topic?.collection_id ?? null;
  }

  return {
    id: data.id,
    slug: data.slug,
    title: translation?.title || "Untitled",
    excerpt: translation?.excerpt || null,
    content: translation?.content || null,
    reading_time: estimateReadingTime(text),
    updated_at: data.updated_at,
    published_at: data.published_at,
    topic_id: data.topic_id,
    category_id,
    collection_id,
    meta_title: translation?.meta_title || null,
    meta_description: translation?.meta_description || null,
  };
}

export async function getRelatedArticles(articleId: string, topicId: string | null, categoryId: string | null, limit = 4): Promise<PublicArticle[]> {
  const supabase = createAdminClient();

  let topicIds: string[] = [];
  if (topicId) {
    topicIds = [topicId];
  } else if (categoryId) {
    const { data } = await supabase.from("topics").select("id").eq("category_id", categoryId).eq("status", "published");
    topicIds = (data || []).map((t: any) => t.id);
  }
  if (topicIds.length === 0) return [];

  const { data } = await supabase
    .from("articles")
    .select("id, slug, updated_at, topic_id, article_translations(title, excerpt, content)")
    .neq("id", articleId)
    .eq("status", "published")
    .eq("article_translations.language_code", "en")
    .in("topic_id", topicIds)
    .order("updated_at", { ascending: false })
    .limit(limit);

  return (data || []).map((article: any) => {
    const translation = article.article_translations?.[0];
    const text = translation?.content || translation?.excerpt || "";
    return {
      id: article.id,
      slug: article.slug,
      title: translation?.title || "Untitled",
      description: translation?.excerpt || null,
      reading_time: estimateReadingTime(text),
      updated_at: article.updated_at,
    };
  });
}

export async function getQuestionsByTopic(topicId: string, limit = 5): Promise<PublicQuestion[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("questions")
    .select("id, question_translations(question_text, answer)")
    .eq("topic_id", topicId)
    .eq("status", "published")
    .eq("question_translations.language_code", "en")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []).map((question: any) => ({
    id: question.id,
    question_text: question.question_translations?.[0]?.question_text || "",
    answer: question.question_translations?.[0]?.answer || null,
  }));
}

export async function getQuestionsByCategory(categoryId: string, limit = 5): Promise<PublicQuestion[]> {
  const supabase = createAdminClient();
  const { data: topics } = await supabase
    .from("topics")
    .select("id")
    .eq("category_id", categoryId)
    .eq("status", "published")
    .limit(20);

  const topicIds = (topics || []).map((t: any) => t.id);
  if (topicIds.length === 0) return [];

  const { data } = await supabase
    .from("questions")
    .select("id, question_translations(question_text, answer)")
    .in("topic_id", topicIds)
    .eq("status", "published")
    .eq("question_translations.language_code", "en")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []).map((question: any) => ({
    id: question.id,
    question_text: question.question_translations?.[0]?.question_text || "",
    answer: question.question_translations?.[0]?.answer || null,
  }));
}

export interface PublicCollectionWithCounts extends PublicCollection {
  topic_count: number;
  article_count: number;
}

export interface CategoryPageData {
  category: PublicCategoryDetail;
  collections: PublicCollectionWithCounts[];
  featuredTopics: PublicTopic[];
  latestArticles: PublicArticle[];
  faqs: PublicQuestion[];
  relatedCategories: PublicCategory[];
  totalArticles: number;
  lastUpdated: string | null;
}

export async function getCategoryPageData(slug: string): Promise<CategoryPageData | null> {
  const category = await getCategoryBySlug(slug);
  if (!category) return null;

  const [rawCollections, topics, faqs, relatedCategories, articles] = await Promise.all([
    getCollectionsByCategory(category.id, 16),
    getTopicsByCategory(category.id, 24),
    getQuestionsByCategory(category.id, 8),
    getCategoriesWithCounts(8),
    getArticlesByCategory(category.id, 12),
  ]);

  const supabase = createAdminClient();

  const collectionsWithCounts: PublicCollectionWithCounts[] = await Promise.all(
    rawCollections.map(async (col) => {
      const [{ count: tc }, { count: ac }] = await Promise.all([
        supabase
          .from("topics")
          .select("id", { count: "exact", head: true })
          .eq("collection_id", col.id)
          .eq("status", "published"),
        (async () => {
          const { data: tids } = await supabase
            .from("topics")
            .select("id")
            .eq("collection_id", col.id)
            .eq("status", "published");
          const ids = (tids || []).map((t: any) => t.id);
          if (ids.length === 0) return { count: 0 };
          const { count } = await supabase
            .from("articles")
            .select("id", { count: "exact", head: true })
            .eq("status", "published")
            .in("topic_id", ids);
          return { count };
        })(),
      ]);
      return { ...col, topic_count: tc ?? 0, article_count: ac ?? 0 };
    })
  );

  const lastUpdated = articles[0]?.updated_at ?? null;
  const totalArticles = articles.length > 0
    ? collectionsWithCounts.reduce((s, c) => s + c.article_count, 0)
    : 0;

  return {
    category,
    collections: collectionsWithCounts,
    featuredTopics: topics,
    latestArticles: articles,
    faqs,
    relatedCategories: relatedCategories.filter((c) => c.slug !== slug),
    totalArticles,
    lastUpdated,
  };
}

export function extractHeadings(content: string | null): { id: string; text: string; level: number }[] {
  if (!content) return [];
  const headings: { id: string; text: string; level: number }[] = [];
  const regex = /^(#{2,3})\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    headings.push({ id, text, level });
  }
  return headings;
}
