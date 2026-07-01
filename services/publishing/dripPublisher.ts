/**
 * Drip Publisher
 *
 * Controls the publishing velocity of auto-generated content to maintain
 * a natural, organic-looking publication cadence. Prevents bulk-publishing
 * which search engines may penalize.
 *
 * Features:
 *   - Configurable daily publishing limits per category/subcategory
 *   - Time-based scheduling (spread across UTC hours)
 *   - Priority-based queue processing (high-priority topics first)
 *   - Sitemap update notifications after each batch
 *   - Publishing velocity monitoring and auto-throttling
 *   - Category balancing (ensure diverse content mix)
 *
 * Strategy:
 *   - "Steady drip": 5-20 articles/day, evenly spread across categories
 *   - "Burst then maintain": higher initial velocity for new subcategories, then taper
 *   - "Coverage first": prioritize subcategories with 0 published articles
 */

import { createAdminClient } from "@/lib/supabase/admin";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DripConfig {
  maxArticlesPerDay: number;
  maxArticlesPerHour: number;
  maxArticlesPerCategory: number;
  prioritizeEmpty: boolean;
  balanceCategories: boolean;
  publishHoursUTC: [number, number]; // [start, end] e.g. [6, 22]
}

export interface PublishCandidate {
  id: string;
  title: string;
  topicId: string;
  subcategoryId: string | null;
  categoryId: string;
  categorySlug: string;
  priorityScore: number;
  createdAt: string;
}

export interface DripPublishResult {
  articlesPublished: number;
  articlesSkipped: number;
  articlesRemaining: number;
  categoryBreakdown: Record<string, number>;
  nextPublishAt: string | null;
  errors: string[];
  durationMs: number;
}

export interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: "daily" | "weekly" | "monthly";
  priority: number;
}

// ─── Configuration ───────────────────────────────────────────────────────────

const DEFAULT_CONFIG: DripConfig = {
  maxArticlesPerDay: 15,
  maxArticlesPerHour: 3,
  maxArticlesPerCategory: 5,
  prioritizeEmpty: true,
  balanceCategories: true,
  publishHoursUTC: [4, 22],
};

// ─── Velocity Monitoring ─────────────────────────────────────────────────────

async function getPublishingVelocity(): Promise<{
  last24h: number;
  lastHour: number;
  perCategory: Record<string, number>;
}> {
  const supabase = createAdminClient();
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

  const { count: last24h } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .gte("published_at", oneDayAgo);

  const { count: lastHour } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .gte("published_at", oneHourAgo);

  // Per category in last 24h
  const { data: categoryData } = await supabase
    .from("articles")
    .select("topics(category_id, categories(slug))")
    .eq("status", "published")
    .gte("published_at", oneDayAgo);

  const perCategory: Record<string, number> = {};
  for (const row of categoryData || []) {
    const slug = (row.topics as any)?.categories?.slug;
    if (slug) perCategory[slug] = (perCategory[slug] || 0) + 1;
  }

  return { last24h: last24h ?? 0, lastHour: lastHour ?? 0, perCategory };
}

// ─── Queue Processing ────────────────────────────────────────────────────────

/**
 * Get the next batch of articles ready to be published.
 * Articles must be in "draft" or "ready" status and have passed quality checks.
 */
async function getPublishCandidates(
  config: DripConfig,
  velocity: { perCategory: Record<string, number> }
): Promise<PublishCandidate[]> {
  const supabase = createAdminClient();

  // Get articles in "ready" status ordered by priority
  const { data: articles } = await supabase
    .from("articles")
    .select(`
      id, slug, topic_id, created_at,
      article_translations(title),
      topics(id, subcategory_id, category_id, categories(slug))
    `)
    .eq("status", "ready")
    .eq("article_translations.language_code", "en")
    .order("created_at", { ascending: true })
    .limit(100);

  if (!articles || articles.length === 0) return [];

  const candidates: PublishCandidate[] = articles
    .map((a: any) => ({
      id: a.id,
      title: a.article_translations?.[0]?.title || a.slug,
      topicId: a.topic_id,
      subcategoryId: a.topics?.subcategory_id ?? null,
      categoryId: a.topics?.category_id ?? "",
      categorySlug: a.topics?.categories?.slug ?? "unknown",
      priorityScore: 50,
      createdAt: a.created_at,
    }))
    .filter((c: PublishCandidate) => c.categoryId);

  // Boost priority for empty subcategories
  if (config.prioritizeEmpty) {
    const subcatIds = [...new Set(candidates.map(c => c.subcategoryId).filter(Boolean))];
    for (const subId of subcatIds) {
      const { count } = await supabase
        .from("articles")
        .select("id", { count: "exact", head: true })
        .eq("status", "published")
        .eq("topic_id", candidates.find(c => c.subcategoryId === subId)?.topicId ?? "");

      if ((count ?? 0) === 0) {
        candidates
          .filter(c => c.subcategoryId === subId)
          .forEach(c => { c.priorityScore += 40; });
      }
    }
  }

  // Apply category balancing
  if (config.balanceCategories) {
    for (const candidate of candidates) {
      const published = velocity.perCategory[candidate.categorySlug] ?? 0;
      if (published >= config.maxArticlesPerCategory) {
        candidate.priorityScore -= 100; // Effectively skip
      } else {
        // Boost under-represented categories
        candidate.priorityScore += Math.max(0, config.maxArticlesPerCategory - published) * 5;
      }
    }
  }

  // Sort by priority (highest first)
  return candidates
    .filter(c => c.priorityScore > 0)
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

// ─── Publishing ──────────────────────────────────────────────────────────────

/**
 * Publish a single article (change status and set published_at).
 */
async function publishArticle(articleId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("articles")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", articleId);

  return !error;
}

// ─── Sitemap Generation ──────────────────────────────────────────────────────

/**
 * Generate sitemap entries for recently published content.
 */
export async function generateSitemapEntries(
  lang: string = "en",
  limit: number = 500
): Promise<SitemapEntry[]> {
  const supabase = createAdminClient();
  const entries: SitemapEntry[] = [];

  // Categories
  const { data: categories } = await supabase
    .from("categories")
    .select("slug, updated_at")
    .order("updated_at", { ascending: false });

  for (const cat of categories || []) {
    entries.push({
      url: `/${lang}/categories/${cat.slug}`,
      lastmod: cat.updated_at || new Date().toISOString(),
      changefreq: "weekly",
      priority: 0.8,
    });
  }

  // Subcategories
  const { data: subcategories } = await supabase
    .from("subcategories")
    .select("slug, updated_at")
    .order("updated_at", { ascending: false });

  for (const sub of subcategories || []) {
    entries.push({
      url: `/${lang}/subcategories/${sub.slug}`,
      lastmod: sub.updated_at || new Date().toISOString(),
      changefreq: "weekly",
      priority: 0.7,
    });
  }

  // Topics
  const { data: topics } = await supabase
    .from("topics")
    .select("slug, updated_at")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(limit);

  for (const topic of topics || []) {
    entries.push({
      url: `/${lang}/topics/${topic.slug}`,
      lastmod: topic.updated_at || new Date().toISOString(),
      changefreq: "weekly",
      priority: 0.6,
    });
  }

  // Published articles
  const { data: articles } = await supabase
    .from("articles")
    .select("slug, published_at, updated_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  for (const article of articles || []) {
    entries.push({
      url: `/${lang}/articles/${article.slug}`,
      lastmod: article.updated_at || article.published_at || new Date().toISOString(),
      changefreq: "monthly",
      priority: 0.5,
    });
  }

  return entries;
}

/**
 * Generate sitemap XML string.
 */
export function buildSitemapXML(entries: SitemapEntry[], baseUrl: string): string {
  const urls = entries.map(e => `  <url>
    <loc>${baseUrl}${e.url}</loc>
    <lastmod>${e.lastmod.split("T")[0]}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

// ─── Main Drip Publish Function ──────────────────────────────────────────────

/**
 * Execute a drip publish cycle.
 * Publishes articles respecting velocity limits and category balancing.
 */
export async function executeDripPublish(
  config: Partial<DripConfig> = {}
): Promise<DripPublishResult> {
  const startTime = Date.now();
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const result: DripPublishResult = {
    articlesPublished: 0,
    articlesSkipped: 0,
    articlesRemaining: 0,
    categoryBreakdown: {},
    nextPublishAt: null,
    errors: [],
    durationMs: 0,
  };

  // Check current hour is within publish window
  const currentHourUTC = new Date().getUTCHours();
  if (currentHourUTC < cfg.publishHoursUTC[0] || currentHourUTC > cfg.publishHoursUTC[1]) {
    result.nextPublishAt = new Date(
      Date.now() + (cfg.publishHoursUTC[0] - currentHourUTC + 24) % 24 * 60 * 60 * 1000
    ).toISOString();
    result.durationMs = Date.now() - startTime;
    return result;
  }

  // Get current velocity
  const velocity = await getPublishingVelocity();

  // Check daily limit
  if (velocity.last24h >= cfg.maxArticlesPerDay) {
    result.nextPublishAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    result.articlesSkipped = cfg.maxArticlesPerDay;
    result.durationMs = Date.now() - startTime;
    return result;
  }

  // Check hourly limit
  if (velocity.lastHour >= cfg.maxArticlesPerHour) {
    result.nextPublishAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();
    result.durationMs = Date.now() - startTime;
    return result;
  }

  // Get candidates
  const candidates = await getPublishCandidates(cfg, velocity);
  const maxThisCycle = Math.min(
    cfg.maxArticlesPerHour - velocity.lastHour,
    cfg.maxArticlesPerDay - velocity.last24h,
    candidates.length
  );

  for (let i = 0; i < maxThisCycle; i++) {
    const candidate = candidates[i];
    try {
      const success = await publishArticle(candidate.id);
      if (success) {
        result.articlesPublished++;
        result.categoryBreakdown[candidate.categorySlug] =
          (result.categoryBreakdown[candidate.categorySlug] || 0) + 1;

        console.log(
          `[DripPublish] Published: "${candidate.title}" (${candidate.categorySlug})`
        );
      } else {
        result.articlesSkipped++;
      }
    } catch (err: any) {
      result.errors.push(`Failed to publish "${candidate.title}": ${err.message}`);
      result.articlesSkipped++;
    }
  }

  result.articlesRemaining = candidates.length - maxThisCycle;
  if (result.articlesRemaining > 0) {
    // Schedule next publish in ~20 minutes
    result.nextPublishAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();
  }

  result.durationMs = Date.now() - startTime;
  return result;
}

/**
 * Get publishing stats for admin dashboard.
 */
export async function getPublishingStats(): Promise<{
  readyCount: number;
  publishedToday: number;
  publishedThisWeek: number;
  velocity: { last24h: number; lastHour: number; perCategory: Record<string, number> };
}> {
  const supabase = createAdminClient();
  const velocity = await getPublishingVelocity();

  const { count: readyCount } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("status", "ready");

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: publishedThisWeek } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .gte("published_at", weekAgo);

  return {
    readyCount: readyCount ?? 0,
    publishedToday: velocity.last24h,
    publishedThisWeek: publishedThisWeek ?? 0,
    velocity,
  };
}
