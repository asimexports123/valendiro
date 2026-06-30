/**
 * SEO Schema Generation — Stage 11 of the V1 Publishing Pipeline
 *
 * Generates structured data (JSON-LD) for:
 * - Article schema
 * - BreadcrumbList schema
 * - FAQPage schema (when FAQ sections are present)
 *
 * Output is stored in article_translations.schema_json (JSONB column)
 * and rendered server-side into <script type="application/ld+json"> tags.
 */

const SITE_NAME = "Valendiro";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ArticleSchemaInput {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  updatedAt: string;
  categoryName: string;
  categorySlug: string;
  collectionName?: string | null;
  collectionSlug?: string | null;
  topicName: string;
  topicSlug: string;
  languageCode?: string;
  content?: string;
}

export interface TopicSchemaInput {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  updatedAt: string;
  categoryName: string;
  categorySlug: string;
  collectionName?: string | null;
  collectionSlug?: string | null;
  languageCode?: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface GeneratedSchema {
  article?: Record<string, unknown>;
  breadcrumb: Record<string, unknown>;
  faq?: Record<string, unknown>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

function extractFAQPairs(content: string): { question: string; answer: string }[] {
  const pairs: { question: string; answer: string }[] = [];
  // Match H3 headings inside FAQ sections followed by a paragraph
  const faqSectionMatch = content.match(
    /##\s+(?:frequently asked questions|faq|common questions)[^\n]*([\s\S]*?)(?=\n##|\n#[^#]|$)/i
  );
  if (!faqSectionMatch) return pairs;

  const faqBody = faqSectionMatch[1];
  const qBlocks = faqBody.split(/\n###\s+/).filter(Boolean);
  for (const block of qBlocks) {
    const lines = block.trim().split("\n").filter(Boolean);
    if (lines.length < 2) continue;
    const question = lines[0].replace(/^#+\s*/, "").trim();
    const answer = lines.slice(1).join(" ").replace(/[*_`]/g, "").trim();
    if (question.length > 10 && answer.length > 20) {
      pairs.push({ question, answer: answer.slice(0, 500) });
    }
  }
  return pairs.slice(0, 10);
}

// ── Article Schema ────────────────────────────────────────────────────────────

export function generateArticleSchema(input: ArticleSchemaInput): Record<string, unknown> {
  const lang = input.languageCode || "en";
  const articleUrl = buildUrl(`/${lang}/articles/${input.slug}`);
  const topicUrl = buildUrl(`/${lang}/topics/${input.topicSlug}`);
  const categoryUrl = buildUrl(`/${lang}/categories/${input.categorySlug}`);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": input.title,
    "description": input.description.slice(0, 300),
    "url": articleUrl,
    "datePublished": input.publishedAt,
    "dateModified": input.updatedAt,
    "inLanguage": lang,
    "isPartOf": {
      "@type": "WebSite",
      "name": SITE_NAME,
      "url": SITE_URL,
    },
    "publisher": {
      "@type": "Organization",
      "name": SITE_NAME,
      "url": SITE_URL,
    },
    "author": {
      "@type": "Organization",
      "name": SITE_NAME,
    },
    "about": {
      "@type": "Thing",
      "name": input.topicName,
      "url": topicUrl,
    },
    "articleSection": input.categoryName,
    "breadcrumb": generateBreadcrumbSchema(buildArticleBreadcrumbs(input)).breadcrumb,
  };
}

// ── Topic Schema ──────────────────────────────────────────────────────────────

export function generateTopicSchema(input: TopicSchemaInput): Record<string, unknown> {
  const lang = input.languageCode || "en";
  const topicUrl = buildUrl(`/${lang}/topics/${input.slug}`);
  const categoryUrl = buildUrl(`/${lang}/categories/${input.categorySlug}`);

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": input.title,
    "description": input.description.slice(0, 300),
    "url": topicUrl,
    "datePublished": input.publishedAt,
    "dateModified": input.updatedAt,
    "inLanguage": lang,
    "isPartOf": {
      "@type": "WebSite",
      "name": SITE_NAME,
      "url": SITE_URL,
    },
    "publisher": {
      "@type": "Organization",
      "name": SITE_NAME,
      "url": SITE_URL,
    },
    "about": {
      "@type": "Thing",
      "name": input.categoryName,
      "url": categoryUrl,
    },
  };
}

// ── Breadcrumb Schema ─────────────────────────────────────────────────────────

export function generateBreadcrumbSchema(items: BreadcrumbItem[]): GeneratedSchema {
  return {
    breadcrumb: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": item.url,
      })),
    },
  };
}

export function buildArticleBreadcrumbs(input: ArticleSchemaInput): BreadcrumbItem[] {
  const lang = input.languageCode || "en";
  const crumbs: BreadcrumbItem[] = [
    { name: "Home", url: buildUrl(`/${lang}`) },
    { name: input.categoryName, url: buildUrl(`/${lang}/categories/${input.categorySlug}`) },
  ];
  if (input.collectionName && input.collectionSlug) {
    crumbs.push({ name: input.collectionName, url: buildUrl(`/${lang}/collections/${input.collectionSlug}`) });
  }
  crumbs.push({ name: input.topicName, url: buildUrl(`/${lang}/topics/${input.topicSlug}`) });
  crumbs.push({ name: input.title, url: buildUrl(`/${lang}/articles/${input.slug}`) });
  return crumbs;
}

export function buildTopicBreadcrumbs(input: TopicSchemaInput): BreadcrumbItem[] {
  const lang = input.languageCode || "en";
  const crumbs: BreadcrumbItem[] = [
    { name: "Home", url: buildUrl(`/${lang}`) },
    { name: input.categoryName, url: buildUrl(`/${lang}/categories/${input.categorySlug}`) },
  ];
  if (input.collectionName && input.collectionSlug) {
    crumbs.push({ name: input.collectionName, url: buildUrl(`/${lang}/collections/${input.collectionSlug}`) });
  }
  crumbs.push({ name: input.title, url: buildUrl(`/${lang}/topics/${input.slug}`) });
  return crumbs;
}

// ── FAQ Schema ────────────────────────────────────────────────────────────────

export function generateFAQSchema(content: string): Record<string, unknown> | null {
  const pairs = extractFAQPairs(content);
  if (pairs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": pairs.map(({ question, answer }) => ({
      "@type": "Question",
      "name": question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": answer,
      },
    })),
  };
}

// ── Combined Schema Bundle ────────────────────────────────────────────────────

export function generateFullArticleSchema(input: ArticleSchemaInput): GeneratedSchema {
  const article = generateArticleSchema(input);
  const breadcrumbItems = buildArticleBreadcrumbs(input);
  const { breadcrumb } = generateBreadcrumbSchema(breadcrumbItems);
  const faq = input.content ? generateFAQSchema(input.content) : null;

  return {
    article,
    breadcrumb,
    ...(faq ? { faq } : {}),
  };
}

export function generateFullTopicSchema(input: TopicSchemaInput): GeneratedSchema {
  const breadcrumbItems = buildTopicBreadcrumbs(input);
  const { breadcrumb } = generateBreadcrumbSchema(breadcrumbItems);
  const topicSchema = generateTopicSchema(input);

  return {
    article: topicSchema,
    breadcrumb,
  };
}

// ── Render to HTML string ─────────────────────────────────────────────────────

export function renderSchemaTag(schema: Record<string, unknown>): string {
  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}
