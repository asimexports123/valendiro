import { createClient } from "@/lib/supabase/server";

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
  name: string;
  description: string;
}

export function estimateReadingTime(text: string | null): number {
  if (!text) return 1;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export async function getCategories(limit = 12): Promise<{ id: string; slug: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, category_translations(name)")
    .eq("category_translations.language_code", "en")
    .order("category_translations.name", { ascending: true })
    .limit(limit);

  return (data || []).map((category: any) => ({
    id: category.id,
    slug: category.slug,
    name: category.category_translations?.[0]?.name || "Uncategorized",
  }));
}

export interface PublicQuestion {
  id: string;
  question_text: string;
  answer: string | null;
}

export async function getRecentQuestions(limit = 5): Promise<PublicQuestion[]> {
  const supabase = await createClient();
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
  const supabase = await createClient();
  const { data } = await supabase
    .from("topics")
    .select("id, slug, topic_translations(title, subtitle)")
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

export async function getCategoriesWithCounts(limit = 12): Promise<PublicCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, category_translations(name, description)")
    .eq("category_translations.language_code", "en")
    .order("category_translations.name", { ascending: true })
    .limit(limit);

  const categories = (data || []).map((category: any) => ({
    id: category.id,
    slug: category.slug,
    name: category.category_translations?.[0]?.name || "Uncategorized",
    description: category.category_translations?.[0]?.description || "",
    article_count: 0,
  }));

  for (const category of categories) {
    const { count } = await supabase
      .from("topics")
      .select("id", { count: "exact", head: true })
      .eq("category_id", category.id)
      .eq("status", "published");
    category.article_count = count ?? 0;
  }

  return categories;
}

export async function getLatestArticles(limit = 6): Promise<PublicArticle[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("id, slug, updated_at, article_translations(title, excerpt, content)")
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

export function getFeaturedCollections(): PublicCollection[] {
  return [
    { id: "ai", slug: "artificial-intelligence", name: "Artificial Intelligence", description: "Guides, explainers, and comparisons on AI tools and technology." },
    { id: "finance", slug: "personal-finance", name: "Personal Finance", description: "Practical advice for saving, investing, and managing money." },
    { id: "home", slug: "home-improvement", name: "Home Improvement", description: "Step-by-step guides for repairs, upgrades, and maintenance." },
    { id: "programming", slug: "programming", name: "Programming", description: "Tutorials, references, and best practices for developers." },
    { id: "ev", slug: "electric-vehicles", name: "Electric Vehicles", description: "Comparisons, charging guides, and buying advice for EVs." },
    { id: "security", slug: "cyber-security", name: "Cyber Security", description: "Practical security tips to protect your digital life." },
  ];
}

export async function getPopularGuides(limit = 4): Promise<PublicArticle[]> {
  return getLatestArticles(limit);
}

export async function searchPublicContent(query: string, limit = 20) {
  const supabase = await createClient();
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
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, category_translations(name, description, meta_title, meta_description)")
    .eq("slug", slug)
    .eq("category_translations.language_code", "en")
    .single();

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
  const supabase = await createClient();
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
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("id, slug, updated_at, category_id, article_translations(title, excerpt, content)")
    .eq("status", "published")
    .eq("article_translations.language_code", "en")
    .eq("category_id", categoryId)
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
}

export async function getTopicBySlug(slug: string): Promise<PublicTopicDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("topics")
    .select("id, slug, category_id, topic_translations(title, subtitle, content, meta_title, meta_description)")
    .eq("slug", slug)
    .eq("topic_translations.language_code", "en")
    .eq("status", "published")
    .single();

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
  };
}

export async function getRelatedTopics(topicId: string, categoryId: string | null, limit = 6): Promise<PublicTopic[]> {
  const supabase = await createClient();
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
  category_id: string | null;
  meta_title: string | null;
  meta_description: string | null;
}

export async function getArticleBySlug(slug: string): Promise<PublicArticleDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("id, slug, category_id, published_at, updated_at, article_translations(title, excerpt, content, meta_title, meta_description)")
    .eq("slug", slug)
    .eq("article_translations.language_code", "en")
    .eq("status", "published")
    .single();

  if (!data) return null;

  const translation = data.article_translations?.[0];
  const text = translation?.content || translation?.excerpt || "";
  return {
    id: data.id,
    slug: data.slug,
    title: translation?.title || "Untitled",
    excerpt: translation?.excerpt || null,
    content: translation?.content || null,
    reading_time: estimateReadingTime(text),
    updated_at: data.updated_at,
    published_at: data.published_at,
    category_id: data.category_id,
    meta_title: translation?.meta_title || null,
    meta_description: translation?.meta_description || null,
  };
}

export async function getRelatedArticles(articleId: string, categoryId: string | null, limit = 4): Promise<PublicArticle[]> {
  const supabase = await createClient();
  let query = supabase
    .from("articles")
    .select("id, slug, updated_at, category_id, article_translations(title, excerpt, content)")
    .neq("id", articleId)
    .eq("status", "published")
    .eq("article_translations.language_code", "en")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data } = await query;

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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
