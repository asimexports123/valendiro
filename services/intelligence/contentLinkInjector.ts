/**
 * Content Link Injector
 *
 * Scans published article markdown/HTML content and automatically inserts
 * internal links to related topics and articles based on keyword matching.
 *
 * Strategies:
 *   1. Exact-match linking: Topic titles found in article body → link to topic page
 *   2. Sibling linking: Articles in the same subcategory → contextual "See also"
 *   3. Hierarchical breadcrumb: Ensure every article links up to topic + subcategory
 *
 * Guardrails:
 *   - Max links per article (avoid over-linking)
 *   - Min distance between links (don't cluster links together)
 *   - No self-linking
 *   - No duplicate link targets
 *   - First occurrence only (link each target once)
 *   - Skip headings, code blocks, existing links
 */

import { createAdminClient } from "@/lib/supabase/admin";

// ─── Configuration ───────────────────────────────────────────────────────────

const CONFIG = {
  maxLinksPerArticle: 15,
  maxLinksPerParagraph: 2,
  minWordsBetweenLinks: 50,
  minArticleLength: 200,
  minTopicTitleLength: 4,
  excludeFromLinking: ["the", "and", "for", "with", "this", "that", "from", "what", "how"],
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LinkTarget {
  id: string;
  title: string;
  slug: string;
  type: "topic" | "article";
  url: string;
}

export interface InjectedLink {
  targetId: string;
  targetType: "topic" | "article";
  anchorText: string;
  position: number;
  url: string;
}

export interface LinkInjectionResult {
  articleId: string;
  articleSlug: string;
  originalContent: string;
  linkedContent: string;
  linksInjected: InjectedLink[];
  linksSkipped: number;
  durationMs: number;
}

export interface BatchLinkResult {
  articlesProcessed: number;
  articlesModified: number;
  totalLinksInjected: number;
  errors: string[];
  durationMs: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Check if position is inside a heading, code block, or existing link.
 */
function isProtectedZone(content: string, position: number): boolean {
  // Check if inside a markdown heading (# ... \n)
  const lineStart = content.lastIndexOf("\n", position) + 1;
  const lineContent = content.slice(lineStart, position);
  if (/^#{1,6}\s/.test(lineContent)) return true;

  // Check if inside a code block (```...```)
  const before = content.slice(0, position);
  const codeBlockCount = (before.match(/```/g) || []).length;
  if (codeBlockCount % 2 !== 0) return true;

  // Check if inside inline code (`...`)
  const lineEnd = content.indexOf("\n", position);
  const fullLine = content.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
  const posInLine = position - lineStart;
  let inCode = false;
  for (let i = 0; i < posInLine; i++) {
    if (fullLine[i] === "`") inCode = !inCode;
  }
  if (inCode) return true;

  // Check if inside an existing markdown link [...](...) or HTML <a>...</a>
  const nearBefore = content.slice(Math.max(0, position - 200), position);
  const linkOpenCount = (nearBefore.match(/\[/g) || []).length;
  const linkCloseCount = (nearBefore.match(/\]/g) || []).length;
  if (linkOpenCount > linkCloseCount) return true;

  return false;
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Core Link Injection ─────────────────────────────────────────────────────

/**
 * Inject internal links into article content.
 * Returns modified content with markdown links inserted.
 */
export function injectLinks(
  content: string,
  targets: LinkTarget[],
  lang: string
): { linkedContent: string; injected: InjectedLink[] } {
  if (content.length < CONFIG.minArticleLength) {
    return { linkedContent: content, injected: [] };
  }

  const injected: InjectedLink[] = [];
  const linkedTargetIds = new Set<string>();
  let result = content;
  let linkCount = 0;
  let lastLinkPosition = -CONFIG.minWordsBetweenLinks * 6; // ~6 chars per word approx

  // Sort targets by title length descending (longer matches first to avoid partial matches)
  const sortedTargets = [...targets].sort((a, b) => b.title.length - a.title.length);

  for (const target of sortedTargets) {
    if (linkCount >= CONFIG.maxLinksPerArticle) break;
    if (linkedTargetIds.has(target.id)) continue;
    if (target.title.length < CONFIG.minTopicTitleLength) continue;

    // Skip common words
    if (CONFIG.excludeFromLinking.includes(target.title.toLowerCase())) continue;

    // Build regex for the title (whole word, case insensitive)
    const regex = new RegExp(
      `(?<![\\[\\(])\\b(${escapeRegex(target.title)})\\b(?![\\]\\)])`,
      "i"
    );

    const match = regex.exec(result);
    if (!match || match.index === undefined) continue;

    const pos = match.index;

    // Check protected zones
    if (isProtectedZone(result, pos)) continue;

    // Check distance from last link
    if (pos - lastLinkPosition < CONFIG.minWordsBetweenLinks * 6) continue;

    // Insert markdown link
    const anchor = match[1];
    const url = target.url || `/${lang}/${target.type === "topic" ? "topics" : "articles"}/${target.slug}`;
    const link = `[${anchor}](${url})`;

    result = result.slice(0, pos) + link + result.slice(pos + anchor.length);
    lastLinkPosition = pos + link.length;
    linkCount++;
    linkedTargetIds.add(target.id);

    injected.push({
      targetId: target.id,
      targetType: target.type,
      anchorText: anchor,
      position: pos,
      url,
    });
  }

  return { linkedContent: result, injected };
}

// ─── Database Operations ─────────────────────────────────────────────────────

/**
 * Get all linkable targets for a given article (topics + sibling articles).
 */
async function getLinkTargets(
  articleId: string,
  topicId: string,
  subcategoryId: string | null,
  categoryId: string,
  lang: string
): Promise<LinkTarget[]> {
  const supabase = createAdminClient();
  const targets: LinkTarget[] = [];

  // 1. All published topics in the same subcategory/category
  let topicQuery = supabase
    .from("topics")
    .select("id, slug, topic_translations(title)")
    .eq("status", "published")
    .eq("topic_translations.language_code", "en")
    .neq("id", topicId)
    .limit(50);

  if (subcategoryId) {
    topicQuery = topicQuery.eq("subcategory_id", subcategoryId);
  } else {
    topicQuery = topicQuery.eq("category_id", categoryId);
  }

  const { data: topics } = await topicQuery;
  for (const t of topics || []) {
    const title = (t.topic_translations as any)?.[0]?.title;
    if (!title) continue;
    targets.push({
      id: t.id,
      title,
      slug: t.slug,
      type: "topic",
      url: `/${lang}/topics/${t.slug}`,
    });
  }

  // 2. Sibling articles (same topic)
  const { data: siblings } = await supabase
    .from("articles")
    .select("id, slug, article_translations(title)")
    .eq("topic_id", topicId)
    .eq("status", "published")
    .eq("article_translations.language_code", "en")
    .neq("id", articleId)
    .limit(10);

  for (const a of siblings || []) {
    const title = (a.article_translations as any)?.[0]?.title;
    if (!title) continue;
    targets.push({
      id: a.id,
      title,
      slug: a.slug,
      type: "article",
      url: `/${lang}/articles/${a.slug}`,
    });
  }

  // 3. Also add the parent topic itself
  const { data: parentTopic } = await supabase
    .from("topics")
    .select("id, slug, topic_translations(title)")
    .eq("id", topicId)
    .eq("topic_translations.language_code", "en")
    .maybeSingle();

  if (parentTopic) {
    const title = (parentTopic.topic_translations as any)?.[0]?.title;
    if (title) {
      targets.push({
        id: parentTopic.id,
        title,
        slug: parentTopic.slug,
        type: "topic",
        url: `/${lang}/topics/${parentTopic.slug}`,
      });
    }
  }

  return targets;
}

// ─── Main Functions ──────────────────────────────────────────────────────────

/**
 * Process a single article: inject internal links and update content.
 */
export async function processArticleLinks(
  articleId: string,
  options: { dryRun?: boolean; lang?: string } = {}
): Promise<LinkInjectionResult> {
  const startTime = Date.now();
  const supabase = createAdminClient();
  const lang = options.lang ?? "en";
  const dryRun = options.dryRun ?? false;

  const { data: article } = await supabase
    .from("articles")
    .select("id, slug, topic_id")
    .eq("id", articleId)
    .single();

  if (!article || !article.topic_id) {
    return {
      articleId,
      articleSlug: "",
      originalContent: "",
      linkedContent: "",
      linksInjected: [],
      linksSkipped: 0,
      durationMs: Date.now() - startTime,
    };
  }

  // Get article translation content
  const { data: translation } = await supabase
    .from("article_translations")
    .select("id, body_markdown")
    .eq("article_id", articleId)
    .eq("language_code", lang)
    .maybeSingle();

  if (!translation || !translation.body_markdown) {
    return {
      articleId,
      articleSlug: article.slug,
      originalContent: "",
      linkedContent: "",
      linksInjected: [],
      linksSkipped: 0,
      durationMs: Date.now() - startTime,
    };
  }

  // Get topic context
  const { data: topic } = await supabase
    .from("topics")
    .select("id, subcategory_id, category_id")
    .eq("id", article.topic_id)
    .single();

  if (!topic) {
    return {
      articleId,
      articleSlug: article.slug,
      originalContent: translation.body_markdown,
      linkedContent: translation.body_markdown,
      linksInjected: [],
      linksSkipped: 0,
      durationMs: Date.now() - startTime,
    };
  }

  // Get link targets
  const targets = await getLinkTargets(
    articleId,
    topic.id,
    topic.subcategory_id,
    topic.category_id,
    lang
  );

  // Inject links
  const { linkedContent, injected } = injectLinks(
    translation.body_markdown,
    targets,
    lang
  );

  const result: LinkInjectionResult = {
    articleId,
    articleSlug: article.slug,
    originalContent: translation.body_markdown,
    linkedContent,
    linksInjected: injected,
    linksSkipped: targets.length - injected.length,
    durationMs: Date.now() - startTime,
  };

  // Persist if not dry run and links were actually injected
  if (!dryRun && injected.length > 0) {
    await supabase
      .from("article_translations")
      .update({ body_markdown: linkedContent })
      .eq("id", translation.id);

    // Also store link records in internal_link_suggestions for tracking
    for (const link of injected) {
      await supabase.from("internal_link_suggestions").insert({
        source_object_id: articleId,
        source_object_type: "article",
        target_object_id: link.targetId,
        target_object_type: link.targetType,
        anchor_text: link.anchorText,
        relevance_score: 80,
        cluster_strength_score: 75,
        context_snippet: `Auto-injected at position ${link.position}`,
        status: "approved",
        metadata: { auto_injected: true, position: link.position },
      });
    }
  }

  return result;
}

/**
 * Batch process all published articles that haven't been link-processed yet.
 */
export async function batchInjectLinks(options: {
  dryRun?: boolean;
  lang?: string;
  limit?: number;
  onlyUnprocessed?: boolean;
} = {}): Promise<BatchLinkResult> {
  const startTime = Date.now();
  const supabase = createAdminClient();
  const limit = options.limit ?? 50;
  const lang = options.lang ?? "en";
  const dryRun = options.dryRun ?? false;
  const onlyUnprocessed = options.onlyUnprocessed ?? true;

  const batchResult: BatchLinkResult = {
    articlesProcessed: 0,
    articlesModified: 0,
    totalLinksInjected: 0,
    errors: [],
    durationMs: 0,
  };

  // Get published articles
  let query = supabase
    .from("articles")
    .select("id, slug")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  // If only unprocessed, exclude articles that already have auto-injected links
  if (onlyUnprocessed) {
    const { data: processedIds } = await supabase
      .from("internal_link_suggestions")
      .select("source_object_id")
      .eq("source_object_type", "article")
      .contains("metadata", { auto_injected: true });

    const excludeIds = [...new Set((processedIds || []).map((r: any) => r.source_object_id))];
    if (excludeIds.length > 0) {
      query = query.not("id", "in", `(${excludeIds.join(",")})`);
    }
  }

  const { data: articles, error } = await query;
  if (error || !articles) {
    batchResult.errors.push(`Failed to fetch articles: ${error?.message}`);
    batchResult.durationMs = Date.now() - startTime;
    return batchResult;
  }

  for (const article of articles) {
    try {
      const result = await processArticleLinks(article.id, { dryRun, lang });
      batchResult.articlesProcessed++;

      if (result.linksInjected.length > 0) {
        batchResult.articlesModified++;
        batchResult.totalLinksInjected += result.linksInjected.length;
      }

      console.log(
        `[LinkInjector] ${article.slug}: injected=${result.linksInjected.length} skipped=${result.linksSkipped}`
      );
    } catch (err: any) {
      batchResult.errors.push(`Failed for article ${article.slug}: ${err.message}`);
    }
  }

  batchResult.durationMs = Date.now() - startTime;
  return batchResult;
}

/**
 * Generate a "See Also" section for an article with related links.
 */
export async function generateSeeAlso(
  articleId: string,
  lang: string = "en",
  maxLinks: number = 5
): Promise<{ markdown: string; links: LinkTarget[] }> {
  const supabase = createAdminClient();

  const { data: article } = await supabase
    .from("articles")
    .select("id, topic_id")
    .eq("id", articleId)
    .single();

  if (!article || !article.topic_id) {
    return { markdown: "", links: [] };
  }

  const { data: topic } = await supabase
    .from("topics")
    .select("id, subcategory_id, category_id")
    .eq("id", article.topic_id)
    .single();

  if (!topic) return { markdown: "", links: [] };

  const targets = await getLinkTargets(
    articleId,
    topic.id,
    topic.subcategory_id,
    topic.category_id,
    lang
  );

  // Pick top N targets (prefer topics over articles for navigational value)
  const sorted = targets
    .sort((a, b) => {
      if (a.type === "topic" && b.type !== "topic") return -1;
      if (b.type === "topic" && a.type !== "topic") return 1;
      return b.title.length - a.title.length;
    })
    .slice(0, maxLinks);

  if (sorted.length === 0) return { markdown: "", links: [] };

  const lines = sorted.map(t => `- [${t.title}](${t.url})`);
  const markdown = `\n\n## See Also\n\n${lines.join("\n")}\n`;

  return { markdown, links: sorted };
}
