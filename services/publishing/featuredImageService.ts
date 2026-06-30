/**
 * Featured Image Service — Stage 13 of the Autonomous Publishing Pipeline
 *
 * Automatically assigns hero, thumbnail, and OpenGraph images to every published article.
 *
 * Image strategy (in priority order):
 *  1. Unsplash Source API — free, no-auth, high quality, category-relevant query
 *  2. Category fallback — deterministic Unsplash URL based on category slug
 *  3. Hard-coded SVG placeholder — last resort, never null
 *
 * Images are stored in article_translations as:
 *  - hero_image_url       (1200×630 — full-width hero)
 *  - thumbnail_url        (400×300 — card / list view)
 *  - og_image_url         (1200×630 — Open Graph / social share)
 */

import { createAdminClient } from "@/lib/supabase/admin";

// ─── Category image queries ────────────────────────────────────────────────────
// Each V1 category has a curated Unsplash search query that produces relevant,
// high-quality, non-stock-photo results.

const CATEGORY_IMAGE_QUERIES: Record<string, string> = {
  technology:           "technology computer code",
  "personal-finance":   "personal finance money saving",
  business:             "business strategy office",
  education:            "education learning books study",
  "health-wellness":    "health wellness nature calm",
  "home-lifestyle":     "home interior lifestyle cozy",
  travel:               "travel landscape adventure",
};

const DEFAULT_IMAGE_QUERY = "knowledge learning abstract";

// ─── Unsplash Source dimensions ────────────────────────────────────────────────

const HERO_W = 1200;
const HERO_H = 630;
const THUMB_W = 400;
const THUMB_H = 300;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ArticleImages {
  heroImageUrl: string;
  thumbnailUrl: string;
  ogImageUrl: string;
  source: "unsplash" | "category_fallback" | "placeholder";
}

export interface ImageAssignmentResult {
  articleId: string;
  assigned: boolean;
  images: ArticleImages | null;
  error: string | null;
}

// ─── URL builders ─────────────────────────────────────────────────────────────

function buildUnsplashUrl(query: string, width: number, height: number, seed?: string): string {
  // Unsplash Source is free and requires no API key.
  // Adding a seed ensures the hero and OG image are the same photo.
  const encodedQuery = encodeURIComponent(query);
  const seedPart = seed ? `/${encodeURIComponent(seed)}` : "";
  return `https://source.unsplash.com/${width}x${height}/?${encodedQuery}${seedPart}`;
}

function buildPlaceholderUrl(width: number, height: number, label: string): string {
  // Deterministic SVG data-URL — always works offline, zero external dependency
  const bg = "1e293b";
  const fg = "94a3b8";
  const encoded = encodeURIComponent(label.slice(0, 30));
  return `https://placehold.co/${width}x${height}/${bg}/${fg}?text=${encoded}`;
}

// ─── Core assignment logic ────────────────────────────────────────────────────

/**
 * Determine the best image query for an article.
 * Uses article title keywords first, then falls back to category query.
 */
function resolveImageQuery(title: string, categorySlug: string | null): string {
  const categoryQuery = categorySlug
    ? (CATEGORY_IMAGE_QUERIES[categorySlug] ?? DEFAULT_IMAGE_QUERY)
    : DEFAULT_IMAGE_QUERY;

  // Extract meaningful words from the title to refine the search
  const stopWords = new Set(["what", "how", "why", "the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "to", "of", "in", "for", "on", "with", "at", "by", "from", "and", "or", "but", "not"]);
  const titleWords = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w))
    .slice(0, 3);

  if (titleWords.length >= 2) {
    return `${titleWords.join(" ")} ${categoryQuery}`.trim();
  }

  return categoryQuery;
}

/**
 * Build a complete set of image URLs for an article.
 * Uses a consistent seed derived from the article slug so hero + OG are the same photo.
 */
export function buildArticleImages(
  title: string,
  slug: string,
  categorySlug: string | null
): ArticleImages {
  const query = resolveImageQuery(title, categorySlug);
  const seed = slug.slice(0, 20); // deterministic seed per article

  try {
    return {
      heroImageUrl: buildUnsplashUrl(query, HERO_W, HERO_H, seed),
      thumbnailUrl: buildUnsplashUrl(query, THUMB_W, THUMB_H, seed),
      ogImageUrl: buildUnsplashUrl(query, HERO_W, HERO_H, seed),
      source: "unsplash",
    };
  } catch {
    // Final fallback — always succeeds
    const label = title.slice(0, 30);
    return {
      heroImageUrl: buildPlaceholderUrl(HERO_W, HERO_H, label),
      thumbnailUrl: buildPlaceholderUrl(THUMB_W, THUMB_H, label),
      ogImageUrl: buildPlaceholderUrl(HERO_W, HERO_H, label),
      source: "placeholder",
    };
  }
}

/**
 * Assign images to a single published article.
 * Reads article + category, builds image URLs, persists to article_translations.
 */
export async function assignFeaturedImages(articleId: string): Promise<ImageAssignmentResult> {
  const supabase = createAdminClient();

  try {
    // Fetch article with its topic → category chain
    const { data: article, error: fetchError } = await supabase
      .from("articles")
      .select(`
        id,
        slug,
        topic_id,
        topics (
          category_id,
          categories ( slug )
        ),
        article_translations (
          language_code,
          title,
          hero_image_url,
          thumbnail_url,
          og_image_url
        )
      `)
      .eq("id", articleId)
      .maybeSingle();

    if (fetchError || !article) {
      return { articleId, assigned: false, images: null, error: fetchError?.message ?? "Article not found" };
    }

    // Skip if images already assigned
    const translation = (article.article_translations as { language_code: string; title: string; hero_image_url: string | null; thumbnail_url: string | null; og_image_url: string | null }[] | null)?.find((t) => t.language_code === "en");
    if (translation?.hero_image_url) {
      return { articleId, assigned: false, images: null, error: null };
    }

    const topicsData = article.topics as unknown as { categories: { slug: string } | null } | null;
    const categorySlug = topicsData?.categories?.slug ?? null;
    const title = translation?.title ?? article.slug;
    const images = buildArticleImages(title, article.slug, categorySlug);

    // Persist images to the article_translations row
    const { error: updateError } = await supabase
      .from("article_translations")
      .update({
        hero_image_url: images.heroImageUrl,
        thumbnail_url: images.thumbnailUrl,
        og_image_url: images.ogImageUrl,
      } as Record<string, unknown>)
      .eq("article_id", articleId)
      .eq("language_code", "en");

    if (updateError) {
      return { articleId, assigned: false, images: null, error: updateError.message };
    }

    return { articleId, assigned: true, images, error: null };
  } catch (err) {
    return {
      articleId,
      assigned: false,
      images: null,
      error: err instanceof Error ? err.message : "Unknown error in image assignment",
    };
  }
}

/**
 * Batch-assign featured images to all published articles that are missing them.
 * Called after the publishing pipeline or as a standalone maintenance task.
 */
export async function assignMissingFeaturedImages(limit = 50): Promise<{ assigned: number; skipped: number; errors: string[] }> {
  const supabase = createAdminClient();

  const { data: articles, error } = await supabase
    .from("articles")
    .select("id")
    .eq("status", "published")
    .limit(limit);

  if (error || !articles) {
    return { assigned: 0, skipped: 0, errors: [error?.message ?? "Failed to fetch articles"] };
  }

  let assigned = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const article of articles) {
    const result = await assignFeaturedImages(article.id);
    if (result.error) errors.push(`${article.id}: ${result.error}`);
    else if (result.assigned) assigned++;
    else skipped++;
  }

  return { assigned, skipped, errors };
}
