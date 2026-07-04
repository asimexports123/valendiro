import { createAdminClient } from "@/lib/supabase/admin";
import { V1_DEFAULT_CONFIG } from "@/services/demand/categoryConfig";

export interface PublicArticle {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  reading_time: number;
  updated_at: string | null;
  category_slug: string | null;
}

export interface PublicTopic {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  category_slug: string | null;
}

export interface PublicCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  subcategory_count: number;
  topic_count: number;
  article_count: number;
}

export interface HomepageStats {
  subcategories: number;
  topics: number;
  articles: number;
}

export type SubcategoryDifficulty = "Beginner" | "Intermediate" | "Advanced";

export interface PublicSubcategory {
  id: string;
  slug: string;
  category_id: string;
  category_slug: string | null;
  name: string;
  description: string;
  topic_count: number;
  article_count: number;
  difficulty: SubcategoryDifficulty;
  estimated_hours: number;
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

/** Canonical public-facing display names — overrides whatever ended up in the DB */
const V1_DISPLAY_NAMES: Record<string, string> = {
  technology: "Technology",
  "personal-finance": "Personal Finance",
  business: "Business",
  education: "Education & Learning",
  "health-wellness": "Health & Wellness",
  "home-lifestyle": "Home & Lifestyle",
  travel: "Travel & Transportation",
};

/** Canonical short descriptions shown on category cards */
const V1_DESCRIPTIONS: Record<string, string> = {
  technology: "AI, programming, software, gadgets & the future of tech.",
  "personal-finance": "Investing, budgeting, credit, retirement & financial freedom.",
  business: "Startups, marketing, entrepreneurship & business growth.",
  education: "Learning strategies, courses, skills & self-improvement.",
  "health-wellness": "Fitness, nutrition, mental health & healthy habits.",
  "home-lifestyle": "DIY, cooking, organization, decor & daily routines.",
  travel: "Destinations, budget travel, packing tips & trip planning.",
};

/**
 * Normalizes AI-generated subcategory names to premium, human-quality titles.
 * Strips filler prefixes and cleans up redundant words.
 */
export function normalizeSubcategoryName(raw: string): string {
  const prefixes = [
    /^(learn|learning|understand|understanding|introduction to|intro to|guide to|how to|complete guide to|beginners guide to|beginner guide to|about|all about|exploring|explore|overview of|master|mastering)/i,
  ];
  let name = raw.trim();
  for (const re of prefixes) name = name.replace(re, "").trim();
  // Capitalize first letter
  name = name.charAt(0).toUpperCase() + name.slice(1);
  // Replace " And " with " & "
  name = name.replace(/\band\b/gi, "&");
  // Remove trailing punctuation
  name = name.replace(/[.,:;]+$/, "").trim();
  return name || raw.trim();
}

/**
 * Auto-seeds any missing V1 category rows into the DB (categories +
 * category_translations). Safe to call on every homepage render — it
 * only writes rows that don't yet exist.
 */
export async function ensureV1Categories(): Promise<void> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("categories")
    .select("id, slug")
    .in("slug", V1_CATEGORY_SLUGS);

  const existingSlugs = new Set((existing || []).map((c: any) => c.slug));
  const missingSlugs = V1_CATEGORY_SLUGS.filter((s) => !existingSlugs.has(s));
  if (missingSlugs.length === 0) return;

  for (let i = 0; i < missingSlugs.length; i++) {
    const slug = missingSlugs[i];
    // Insert category row
    const { data: inserted, error } = await supabase
      .from("categories")
      .insert({ slug, sort_order: V1_CATEGORY_SLUGS.indexOf(slug) + 1 })
      .select("id")
      .maybeSingle();
    if (error || !inserted) continue;

    // Insert English translation
    await supabase.from("category_translations").insert({
      category_id: inserted.id,
      language_code: "en",
      name: V1_DISPLAY_NAMES[slug] ?? slug,
      description: V1_DESCRIPTIONS[slug] ?? null,
    });
  }
}

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

export async function getTrendingTopics(limit = 16): Promise<PublicTopic[]> {
  const supabase = createAdminClient();
  const categoryIds = await getV1CategoryIds();
  if (categoryIds.length === 0) return [];

  const { data } = await supabase
    .from("topics")
    .select("id, slug, category_id, topic_translations(title, subtitle), categories(slug)")
    .eq("status", "published")
    .in("category_id", categoryIds)
    .eq("topic_translations.language_code", "en")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []).map((topic: any) => ({
    id: topic.id,
    slug: topic.slug,
    title: topic.topic_translations?.[0]?.title || "Untitled",
    subtitle: topic.topic_translations?.[0]?.subtitle || null,
    category_slug: (topic.categories as any)?.slug ?? null,
  }));
}

export async function getCategoriesWithCounts(limit = 12): Promise<PublicCategory[]> {
  // Ensure all V1 categories exist in DB before querying
  await ensureV1Categories();

  const supabase = createAdminClient();

  const { data } = await supabase
    .from("categories")
    .select("id, slug, sort_order, category_translations(name, description)")
    .in("slug", V1_CATEGORY_SLUGS)
    .eq("category_translations.language_code", "en")
    .order("sort_order", { ascending: true })
    .limit(limit);

  const dbCategories: PublicCategory[] = (data || []).map((category: any) => ({
    id: category.id,
    slug: category.slug,
    name: V1_DISPLAY_NAMES[category.slug] ?? category.category_translations?.[0]?.name ?? "Uncategorized",
    description: V1_DESCRIPTIONS[category.slug] ?? category.category_translations?.[0]?.description ?? null,
    subcategory_count: 0,
    topic_count: 0,
    article_count: 0,
  }));

  // Fetch all counts in parallel per category
  await Promise.all(dbCategories.map(async (cat) => {
    const [colRes, topicRes] = await Promise.all([
      supabase.from("subcategories").select("id", { count: "exact", head: true }).eq("category_id", cat.id),
      supabase.from("topics").select("id", { count: "exact", head: true }).eq("category_id", cat.id).eq("status", "published"),
    ]);
    cat.subcategory_count = colRes.count ?? 0;
    cat.topic_count = topicRes.count ?? 0;
    // Article count: topics under this category
    const { data: topicIds } = await supabase
      .from("topics").select("id").eq("category_id", cat.id).eq("status", "published");
    const ids = (topicIds || []).map((t: any) => t.id);
    if (ids.length > 0) {
      const { count } = await supabase
        .from("articles").select("id", { count: "exact", head: true })
        .eq("status", "published").in("topic_id", ids);
      cat.article_count = count ?? 0;
    }
  }));

  // Sort by canonical V1 order
  return dbCategories
    .sort((a, b) => {
      const ai = V1_CATEGORY_SLUGS.indexOf(a.slug);
      const bi = V1_CATEGORY_SLUGS.indexOf(b.slug);
      if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    })
    .slice(0, limit);
}

export async function getHomepageStats(): Promise<HomepageStats> {
  const supabase = createAdminClient();
  const categoryIds = await getV1CategoryIds();

  const [colRes, topicRes] = await Promise.all([
    categoryIds.length > 0
      ? supabase.from("subcategories").select("id", { count: "exact", head: true }).in("category_id", categoryIds)
      : Promise.resolve({ count: 0 }),
    categoryIds.length > 0
      ? supabase.from("topics").select("id", { count: "exact", head: true }).in("category_id", categoryIds).eq("status", "published")
      : Promise.resolve({ count: 0 }),
  ]);

  const subcategoriesCount = (colRes as any).count ?? 0;
  const topics = (topicRes as any).count ?? 0;
  let articles = 0;
  if (categoryIds.length > 0) {
    const { data: topicIds } = await supabase
      .from("topics").select("id").in("category_id", categoryIds).eq("status", "published");
    const ids = (topicIds || []).map((t: any) => t.id);
    if (ids.length > 0) {
      const { count } = await supabase
        .from("articles").select("id", { count: "exact", head: true })
        .eq("status", "published").in("topic_id", ids);
      articles = count ?? 0;
    }
  }

  return { subcategories: subcategoriesCount, topics, articles };
}

export async function getLatestArticles(limit = 6): Promise<PublicArticle[]> {
  const supabase = createAdminClient();
  const categoryIds = await getV1CategoryIds();

  const { data: v1Topics } = categoryIds.length > 0
    ? await supabase.from("topics").select("id, category_id").in("category_id", categoryIds).eq("status", "published")
    : { data: [] };
  const v1TopicIds = (v1Topics || []).map((t: any) => t.id);
  if (v1TopicIds.length === 0) return [];

  // Build topic→categoryId map
  const topicCategoryMap: Record<string, string> = {};
  for (const t of v1Topics || []) topicCategoryMap[t.id] = t.category_id;

  const { data } = await supabase
    .from("articles")
    .select("id, slug, topic_id, updated_at, article_translations(title, excerpt, content)")
    .eq("status", "published")
    .in("topic_id", v1TopicIds)
    .eq("article_translations.language_code", "en")
    .order("updated_at", { ascending: false })
    .limit(limit);

  // Fetch category slugs for the category ids we have
  const catIds = [...new Set(Object.values(topicCategoryMap))];
  const { data: catRows } = catIds.length > 0
    ? await supabase.from("categories").select("id, slug").in("id", catIds)
    : { data: [] };
  const catSlugMap: Record<string, string> = {};
  for (const c of catRows || []) catSlugMap[c.id] = c.slug;

  return (data || []).map((article: any) => {
    const translation = article.article_translations?.[0];
    const text = translation?.content || translation?.excerpt || "";
    const catId = topicCategoryMap[article.topic_id] ?? null;
    return {
      id: article.id,
      slug: article.slug,
      title: translation?.title || "Untitled",
      description: translation?.excerpt || null,
      reading_time: estimateReadingTime(text),
      updated_at: article.updated_at,
      category_slug: catId ? (catSlugMap[catId] ?? null) : null,
    };
  });
}

/** Infer difficulty from topic count; infer reading hours from article count */
function inferDifficulty(topicCount: number): SubcategoryDifficulty {
  if (topicCount >= 20) return "Advanced";
  if (topicCount >= 8) return "Intermediate";
  return "Beginner";
}

function inferEstimatedHours(articleCount: number): number {
  return Math.max(1, Math.round((articleCount * 8) / 60));
}

export async function getFeaturedSubcategories(limit = 6): Promise<PublicSubcategory[]> {
  const supabase = createAdminClient();
  const categoryIds = await getV1CategoryIds();
  if (categoryIds.length === 0) return [];

  // Over-fetch so the topic_count filter below can still return `limit` results
  const { data } = await supabase
    .from("subcategories")
    .select("id, slug, category_id, subcategory_translations(name, description), categories(slug)")
    .in("category_id", categoryIds)
    .eq("subcategory_translations.language_code", "en")
    .order("sort_order", { ascending: true })
    .limit(limit * 6);

  const subcategories = data || [];

  const all = await Promise.all(subcategories.map(async (sub: any) => {
    const { count: topicCount } = await supabase
      .from("topics")
      .select("id", { count: "exact", head: true })
      .eq("subcategory_id", sub.id)
      .eq("status", "published");

    const { data: topicIds } = await supabase
      .from("topics")
      .select("id")
      .eq("subcategory_id", sub.id)
      .eq("status", "published");

    let articleCount = 0;
    const ids = (topicIds || []).map((t: any) => t.id);
    if (ids.length > 0) {
      const { count } = await supabase
        .from("articles")
        .select("id", { count: "exact", head: true })
        .eq("status", "published")
        .in("topic_id", ids);
      articleCount = count ?? 0;
    }

    const rawName = sub.subcategory_translations?.[0]?.name || sub.slug;
    const tc = topicCount ?? 0;
    return {
      id: sub.id,
      slug: sub.slug,
      category_id: sub.category_id,
      category_slug: (sub.categories as any)?.slug ?? null,
      name: normalizeSubcategoryName(rawName),
      description: sub.subcategory_translations?.[0]?.description || "",
      topic_count: tc,
      article_count: articleCount,
      difficulty: inferDifficulty(tc),
      estimated_hours: inferEstimatedHours(articleCount),
    };
  }));

  // Only surface subcategories that have at least one published topic.
  // A subcategory with no topics must never appear in navigation.
  return all.filter((s) => s.topic_count > 0).slice(0, limit);
}

export async function getSubcategoriesByCategory(categoryId: string, limit = 12): Promise<PublicSubcategory[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("subcategories")
    .select("id, slug, category_id, subcategory_translations(name, description), categories(slug)")
    .eq("category_id", categoryId)
    .eq("subcategory_translations.language_code", "en")
    .order("sort_order", { ascending: true })
    .limit(limit);

  if (!data || data.length === 0) return [];

  const all = await Promise.all(data.map(async (subcatRow: any) => {
    const collId = subcatRow.id as string;

    // Real topic count
    const { count: topicCount } = await supabase
      .from("topics")
      .select("id", { count: "exact", head: true })
      .eq("subcategory_id", collId)
      .eq("status", "published");

    // Real article count via topics in this subcategory
    const { data: topicRows } = await supabase
      .from("topics")
      .select("id")
      .eq("subcategory_id", collId)
      .eq("status", "published");
    const topicIds = (topicRows || []).map((t: any) => t.id as string);
    let articleCount = 0;
    if (topicIds.length > 0) {
      const { count } = await supabase
        .from("articles")
        .select("id", { count: "exact", head: true })
        .eq("status", "published")
        .in("topic_id", topicIds);
      articleCount = count ?? 0;
    }

    const tc = topicCount ?? 0;
    return {
      id: collId,
      slug: subcatRow.slug,
      category_id: subcatRow.category_id,
      category_slug: (subcatRow.categories as any)?.slug ?? null,
      name: normalizeSubcategoryName(subcatRow.subcategory_translations?.[0]?.name || subcatRow.slug),
      description: subcatRow.subcategory_translations?.[0]?.description || "",
      topic_count: tc,
      article_count: articleCount,
      difficulty: inferDifficulty(tc),
      estimated_hours: inferEstimatedHours(articleCount),
    };
  }));

  // Only return subcategories that have at least one published topic
  return all.filter((s) => s.topic_count > 0);
}

export async function getSubcategoryBySlug(slug: string): Promise<PublicSubcategory | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("subcategories")
    .select("id, slug, category_id, subcategory_translations(name, description), categories(slug)")
    .eq("slug", slug)
    .eq("subcategory_translations.language_code", "en")
    .maybeSingle();

  if (!data) return null;

  const collId = data.id as string;
  const { count: topicCount } = await supabase
    .from("topics")
    .select("id", { count: "exact", head: true })
    .eq("subcategory_id", collId)
    .eq("status", "published");

  const { data: topicRows } = await supabase
    .from("topics")
    .select("id")
    .eq("subcategory_id", collId)
    .eq("status", "published");
  const topicIds = (topicRows || []).map((t: any) => t.id as string);
  let articleCount = 0;
  if (topicIds.length > 0) {
    const { count } = await supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .in("topic_id", topicIds);
    articleCount = count ?? 0;
  }

  const tc = topicCount ?? 0;
  return {
    id: collId,
    slug: data.slug,
    category_id: data.category_id,
    category_slug: (data.categories as any)?.slug ?? null,
    name: normalizeSubcategoryName(data.subcategory_translations?.[0]?.name || data.slug),
    description: data.subcategory_translations?.[0]?.description || "",
    topic_count: tc,
    article_count: articleCount,
    difficulty: inferDifficulty(tc),
    estimated_hours: inferEstimatedHours(articleCount),
  };
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
      category_slug: null,
    };
  });
}

export async function getTopicsBySubcategorySimple(subcategoryId: string, limit = 6): Promise<PublicTopic[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("topics")
    .select("id, slug, topic_translations(title, subtitle)")
    .eq("subcategory_id", subcategoryId)
    .eq("status", "published")
    .eq("topic_translations.language_code", "en")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []).map((topic: any) => ({
    id: topic.id,
    slug: topic.slug,
    title: topic.topic_translations?.[0]?.title || "Untitled",
    subtitle: topic.topic_translations?.[0]?.subtitle || null,
    category_slug: null,
  }));
}

export async function getSequentialNavigation(currentTopicId: string, categoryId: string): Promise<{
  previous: PublicTopic | null;
  next: PublicTopic | null;
} | null> {
  const supabase = createAdminClient();
  const { data: allTopics } = await supabase
    .from("topics")
    .select("id, slug, topic_translations(title, subtitle)")
    .eq("category_id", categoryId)
    .eq("status", "published")
    .eq("topic_translations.language_code", "en")
    .order("created_at", { ascending: true });

  if (!allTopics || allTopics.length === 0) return null;

  const currentIndex = allTopics.findIndex((t: any) => t.id === currentTopicId);
  if (currentIndex === -1) return null;

  const previous = currentIndex > 0 ? {
    id: allTopics[currentIndex - 1].id,
    slug: allTopics[currentIndex - 1].slug,
    title: allTopics[currentIndex - 1].topic_translations?.[0]?.title || "Untitled",
    subtitle: allTopics[currentIndex - 1].topic_translations?.[0]?.subtitle || null,
    category_slug: null,
  } : null;

  const next = currentIndex < allTopics.length - 1 ? {
    id: allTopics[currentIndex + 1].id,
    slug: allTopics[currentIndex + 1].slug,
    title: allTopics[currentIndex + 1].topic_translations?.[0]?.title || "Untitled",
    subtitle: allTopics[currentIndex + 1].topic_translations?.[0]?.subtitle || null,
    category_slug: null,
  } : null;

  return { previous, next };
}

export async function getArticlesBySubcategory(subcategoryId: string, limit = 12): Promise<PublicArticle[]> {
  const supabase = createAdminClient();
  const { data: topicIds } = await supabase
    .from("topics")
    .select("id")
    .eq("subcategory_id", subcategoryId)
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
      category_slug: null,
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

  const slugToTitle = (slug: string): string => {
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return {
    articles: (articles.data || []).map((article: any) => ({
      id: article.id,
      slug: article.slug,
      title: article.article_translations?.[0]?.title || slugToTitle(article.slug),
      excerpt: article.article_translations?.[0]?.excerpt || "",
    })),
    topics: (topics.data || []).map((topic: any) => ({
      id: topic.id,
      slug: topic.slug,
      title: topic.topic_translations?.[0]?.title || slugToTitle(topic.slug),
      subtitle: topic.topic_translations?.[0]?.subtitle || "",
    })),
  };
}

export interface PublicCategoryDetail extends PublicCategory {}

export async function getCategoryBySlug(slug: string): Promise<PublicCategoryDetail | null> {
  // Only serve V1 category slugs — any other slug is not a valid public page
  if (!V1_CATEGORY_SLUGS.includes(slug)) return null;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, category_translations(name, description, meta_title, meta_description)")
    .eq("slug", slug)
    .eq("category_translations.language_code", "en")
    .maybeSingle();

  // Category row doesn't exist in DB yet — return null so page 404s cleanly
  if (!data) return null;

  const translation = data.category_translations?.[0];
  const { count } = await supabase
    .from("topics")
    .select("id", { count: "exact", head: true })
    .eq("category_id", data.id)
    .eq("status", "published");

  const { count: colCount } = await supabase
    .from("subcategories")
    .select("id", { count: "exact", head: true })
    .eq("category_id", data.id);

  const { count: topicCount } = await supabase
    .from("topics")
    .select("id", { count: "exact", head: true })
    .eq("category_id", data.id)
    .eq("status", "published");

  return {
    id: data.id,
    slug: data.slug,
    name: V1_DISPLAY_NAMES[data.slug] ?? translation?.name ?? data.slug,
    description: V1_DESCRIPTIONS[data.slug] ?? translation?.description ?? null,
    subcategory_count: colCount ?? 0,
    topic_count: topicCount ?? 0,
    article_count: count ?? 0,
  };
}

export async function getTopicsByCategory(categoryId: string, limit = 12): Promise<PublicTopic[]> {
  const supabase = createAdminClient();

  // Primary: topics directly linked to category
  const { data: direct } = await supabase
    .from("topics")
    .select("id, slug, topic_translations(title, subtitle)")
    .eq("category_id", categoryId)
    .eq("status", "published")
    .eq("topic_translations.language_code", "en")
    .order("created_at", { ascending: false })
    .limit(limit);

  // Fallback: topics linked via subcategory (seeded topics have category_id=null)
  const { data: subcatIds } = await supabase
    .from("subcategories")
    .select("id")
    .eq("category_id", categoryId);

  const ids = (subcatIds || []).map((s: any) => s.id);
  const { data: indirect } = ids.length > 0
    ? await supabase
        .from("topics")
        .select("id, slug, topic_translations(title, subtitle)")
        .in("subcategory_id", ids)
        .eq("status", "published")
        .eq("topic_translations.language_code", "en")
        .order("created_at", { ascending: false })
        .limit(limit)
    : { data: [] };

  // Merge, deduplicate
  const seen = new Set<string>();
  const merged = [...(direct || []), ...(indirect || [])].filter((t: any) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  }).slice(0, limit);

  return merged.map((topic: any) => ({
    id: topic.id,
    slug: topic.slug,
    title: topic.topic_translations?.[0]?.title || "Untitled",
    subtitle: topic.topic_translations?.[0]?.subtitle || null,
    category_slug: null,
  }));
}

export async function getArticlesByCategory(categoryId: string, limit = 12): Promise<PublicArticle[]> {
  const supabase = createAdminClient();

  // Direct category_id link
  const { data: directTopics } = await supabase
    .from("topics").select("id").eq("category_id", categoryId).eq("status", "published");

  // Via subcategory
  const { data: subcatIds } = await supabase
    .from("subcategories").select("id").eq("category_id", categoryId);
  const subIds = (subcatIds || []).map((s: any) => s.id);
  const { data: indirectTopics } = subIds.length > 0
    ? await supabase.from("topics").select("id").in("subcategory_id", subIds).eq("status", "published")
    : { data: [] };

  const seen = new Set<string>();
  const topicIds = [...(directTopics || []), ...(indirectTopics || [])]
    .map((t: any) => t.id)
    .filter((id) => { if (seen.has(id)) return false; seen.add(id); return true; });

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
      category_slug: null,
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
  subcategory_id: string | null;
  updated_at: string | null;
}

export async function getTopicBySlug(slug: string): Promise<PublicTopicDetail | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("topics")
    .select("id, slug, category_id, subcategory_id, updated_at, topic_translations(title, subtitle, content, meta_title, meta_description)")
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
    category_slug: null,
    content: translation?.content || null,
    meta_title: translation?.meta_title || null,
    meta_description: translation?.meta_description || null,
    category_id: data.category_id,
    subcategory_id: data.subcategory_id,
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
    subtitle: topic.topic_translations?.[0]?.subtitle || null,
    category_slug: null,
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
  subcategory_id: string | null;
  meta_title: string | null;
  meta_description: string | null;
  difficulty: string | null;
  quality_score: number | null;
}

export async function getArticleBySlug(slug: string): Promise<PublicArticleDetail | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("articles")
    .select("id, slug, topic_id, published_at, updated_at, difficulty, quality_score, article_translations(title, excerpt, content, meta_title, meta_description)")
    .eq("slug", slug)
    .eq("article_translations.language_code", "en")
    .eq("status", "published")
    .maybeSingle();

  if (!data) return null;

  const translation = data.article_translations?.[0];
  const text = translation?.content || translation?.excerpt || "";

  let category_id: string | null = null;
  let subcategory_id: string | null = null;
  if (data.topic_id) {
    const { data: topic } = await supabase
      .from("topics")
      .select("category_id, subcategory_id")
      .eq("id", data.topic_id)
      .maybeSingle();
    category_id = topic?.category_id ?? null;
    subcategory_id = topic?.subcategory_id ?? null;
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
    subcategory_id,
    meta_title: translation?.meta_title || null,
    meta_description: translation?.meta_description || null,
    difficulty: data.difficulty || null,
    quality_score: data.quality_score || null,
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
      category_slug: null,
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

export interface PublicSubcategoryWithCounts extends PublicSubcategory {
  topic_count: number;
  article_count: number;
}

export interface CategoryPageData {
  category: PublicCategoryDetail;
  subcategories: PublicSubcategoryWithCounts[];
  featuredTopics: PublicTopic[];
  latestArticles: PublicArticle[];
  faqs: PublicQuestion[];
  relatedCategories: PublicCategory[];
  totalArticles: number;
  lastUpdated: string | null;
  beginnerTopics: PublicTopic[];
  intermediateTopics: PublicTopic[];
  advancedTopics: PublicTopic[];
  learningPath: PublicSubcategory[];
}

export async function getCategoryPageData(slug: string): Promise<CategoryPageData | null> {
  const category = await getCategoryBySlug(slug);
  if (!category) return null;

  const [rawSubcategories, topics, faqs, relatedCategories, articles] = await Promise.all([
    getSubcategoriesByCategory(category.id, 16),
    getTopicsByCategory(category.id, 24),
    getQuestionsByCategory(category.id, 8),
    getCategoriesWithCounts(8),
    getArticlesByCategory(category.id, 12),
  ]);

  const supabase = createAdminClient();

  const subcategoriesWithCounts: PublicSubcategoryWithCounts[] = await Promise.all(
    rawSubcategories.map(async (sub) => {
      const [{ count: tc }, { count: ac }] = await Promise.all([
        supabase
          .from("topics")
          .select("id", { count: "exact", head: true })
          .eq("subcategory_id", sub.id)
          .eq("status", "published"),
        (async () => {
          const { data: tids } = await supabase
            .from("topics")
            .select("id")
            .eq("subcategory_id", sub.id)
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
      return { ...sub, topic_count: tc ?? 0, article_count: ac ?? 0 };
    })
  );

  const lastUpdated = articles[0]?.updated_at ?? null;
  const totalArticles = articles.length > 0
    ? subcategoriesWithCounts.reduce((s, c) => s + c.article_count, 0)
    : 0;

  // Only show subcategories that have at least one published topic
  const populated = subcategoriesWithCounts.filter((s) => s.topic_count > 0);

  // Group subcategories by difficulty for learning path
  const beginner = populated.filter(s => s.difficulty === "Beginner").slice(0, 4);
  const intermediate = populated.filter(s => s.difficulty === "Intermediate").slice(0, 4);
  const advanced = populated.filter(s => s.difficulty === "Advanced").slice(0, 4);

  // Get topics by subcategory difficulty
  const beginnerSubIds = beginner.map(s => s.id);
  const intermediateSubIds = intermediate.map(s => s.id);
  const advancedSubIds = advanced.map(s => s.id);

  const [beginnerTopics, intermediateTopics, advancedTopics] = await Promise.all([
    beginnerSubIds.length > 0 ? getTopicsBySubcategories(beginnerSubIds, 6) : [],
    intermediateSubIds.length > 0 ? getTopicsBySubcategories(intermediateSubIds, 6) : [],
    advancedSubIds.length > 0 ? getTopicsBySubcategories(advancedSubIds, 6) : [],
  ]);

  return {
    category,
    subcategories: populated,
    featuredTopics: topics,
    latestArticles: articles,
    faqs,
    relatedCategories: relatedCategories.filter((c) => c.slug !== slug),
    totalArticles,
    lastUpdated,
    beginnerTopics,
    intermediateTopics,
    advancedTopics,
    learningPath: [...beginner, ...intermediate, ...advanced].slice(0, 6),
  };
}

export async function getTopicsBySubcategories(subcategoryIds: string[], limit = 6): Promise<PublicTopic[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("topics")
    .select("id, slug, topic_translations(title, subtitle)")
    .in("subcategory_id", subcategoryIds)
    .eq("status", "published")
    .eq("topic_translations.language_code", "en")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []).map((topic: any) => ({
    id: topic.id,
    slug: topic.slug,
    title: topic.topic_translations?.[0]?.title || "Untitled",
    subtitle: topic.topic_translations?.[0]?.subtitle || null,
    category_slug: null,
  }));
}

export interface NavSubcategory {
  name: string;
  slug: string;
}

export interface NavCategory {
  label: string;
  slug: string;
  subcategories: NavSubcategory[];
}

export async function getNavData(): Promise<NavCategory[]> {
  const supabase = createAdminClient();
  const { data: cats } = await supabase
    .from("categories")
    .select("id, slug, category_translations(name)")
    .in("slug", V1_CATEGORY_SLUGS)
    .eq("category_translations.language_code", "en")
    .order("sort_order", { ascending: true });

  if (!cats || cats.length === 0) return [];

  const results: NavCategory[] = await Promise.all(
    (cats as any[]).map(async (cat) => {
      const { data: subs } = await supabase
        .from("subcategories")
        .select("id, slug, subcategory_translations(name)")
        .eq("category_id", cat.id)
        .eq("subcategory_translations.language_code", "en")
        .order("sort_order", { ascending: true })
        .limit(30);

      // Filter to only subcategories that have at least one published topic
      const subsWithTopics = await Promise.all(
        (subs || []).map(async (s: any) => {
          const { count } = await supabase
            .from("topics")
            .select("id", { count: "exact", head: true })
            .eq("subcategory_id", s.id)
            .eq("status", "published");
          return count && count > 0 ? s : null;
        })
      );

      return {
        label: V1_DISPLAY_NAMES[cat.slug] ?? cat.category_translations?.[0]?.name ?? cat.slug,
        slug: cat.slug,
        subcategories: subsWithTopics
          .filter(Boolean)
          .slice(0, 10)
          .map((s: any) => ({
            name: normalizeSubcategoryName(s.subcategory_translations?.[0]?.name || s.slug),
            slug: s.slug,
          })),
      };
    })
  );

  return results.sort((a, b) => {
    const ai = V1_CATEGORY_SLUGS.indexOf(a.slug);
    const bi = V1_CATEGORY_SLUGS.indexOf(b.slug);
    return ai - bi;
  });
}

export interface FeaturedTopicWithMeta {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  category_name: string | null;
  category_slug: string | null;
  subcategory_name: string | null;
  subcategory_slug: string | null;
  article_count: number;
}

export async function getFeaturedTopicsWithMeta(limit = 8): Promise<FeaturedTopicWithMeta[]> {
  const supabase = createAdminClient();
  const categoryIds = await getV1CategoryIds();
  if (categoryIds.length === 0) return [];

  const { data } = await supabase
    .from("topics")
    .select("id, slug, category_id, subcategory_id, topic_translations(title, subtitle)")
    .eq("status", "published")
    .in("category_id", categoryIds)
    .eq("topic_translations.language_code", "en")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data || data.length === 0) return [];

  // Fetch category names separately
  const catIds = [...new Set((data as any[]).map((t) => t.category_id).filter(Boolean))];
  const { data: catRows } = catIds.length > 0
    ? await supabase.from("categories").select("id, slug, category_translations(name)").in("id", catIds).eq("category_translations.language_code", "en")
    : { data: [] };
  const catMap: Record<string, { slug: string; name: string }> = {};
  for (const c of (catRows || []) as any[]) {
    catMap[c.id] = { slug: c.slug, name: c.category_translations?.[0]?.name || c.slug };
  }

  // Fetch subcategory names separately
  const subIds = [...new Set((data as any[]).map((t) => t.subcategory_id).filter(Boolean))];
  const { data: subRows } = subIds.length > 0
    ? await supabase.from("subcategories").select("id, slug, subcategory_translations(name)").in("id", subIds).eq("subcategory_translations.language_code", "en")
    : { data: [] };
  const subMap: Record<string, { slug: string; name: string }> = {};
  for (const s of (subRows || []) as any[]) {
    subMap[s.id] = { slug: s.slug, name: s.subcategory_translations?.[0]?.name || s.slug };
  }

  return Promise.all((data as any[]).map(async (topic) => {
    const { count } = await supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("topic_id", topic.id)
      .eq("status", "published");

    const cat = catMap[topic.category_id] || null;
    const sub = subMap[topic.subcategory_id] || null;

    return {
      id: topic.id,
      slug: topic.slug,
      title: topic.topic_translations?.[0]?.title || "Untitled",
      subtitle: topic.topic_translations?.[0]?.subtitle || null,
      category_name: cat?.name || null,
      category_slug: cat?.slug || null,
      subcategory_name: sub?.name || null,
      subcategory_slug: sub?.slug || null,
      article_count: count ?? 0,
    };
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
