import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCategoryPageData } from "@/services/public/publicData";
import { FaqSection } from "@/components/public/FaqSection";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { EmptyState } from "@/components/public/EmptyState";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 86400;

/* ─── Accent config ─────────────────────────────────────────────────── */
const ACCENTS: Record<string, {
  bg: string; heroBg: string; text: string; border: string;
  iconBg: string; iconText: string; emoji: string; tagline: string;
  collectionEmojis: string[];
}> = {
  technology: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    heroBg: "from-blue-50 via-white to-white dark:from-blue-950/40 dark:via-background dark:to-background",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    iconText: "text-blue-600 dark:text-blue-400",
    emoji: "💻",
    tagline: "AI, software, gadgets, programming & the future of technology.",
    collectionEmojis: ["🤖","🌐","📱","⚡","🔬","🛡️","☁️","🎮","🔧","📊"],
  },
  "personal-finance": {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    heroBg: "from-emerald-50 via-white to-white dark:from-emerald-950/40 dark:via-background dark:to-background",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
    iconText: "text-emerald-600 dark:text-emerald-400",
    emoji: "💰",
    tagline: "Investing, budgeting, debt, retirement & financial independence.",
    collectionEmojis: ["📈","🏦","💳","🏠","📊","💎","🌱","🎯","🔄","💵"],
  },
  business: {
    bg: "bg-violet-50 dark:bg-violet-950/30",
    heroBg: "from-violet-50 via-white to-white dark:from-violet-950/40 dark:via-background dark:to-background",
    text: "text-violet-700 dark:text-violet-300",
    border: "border-violet-200 dark:border-violet-800",
    iconBg: "bg-violet-100 dark:bg-violet-900/50",
    iconText: "text-violet-600 dark:text-violet-400",
    emoji: "📈",
    tagline: "Entrepreneurship, marketing, leadership, strategy & growth.",
    collectionEmojis: ["🚀","📣","🤝","🧭","⚙️","🛒","👑","💡","📋","🌍"],
  },
  education: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    heroBg: "from-amber-50 via-white to-white dark:from-amber-950/40 dark:via-background dark:to-background",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
    iconText: "text-amber-600 dark:text-amber-400",
    emoji: "🎓",
    tagline: "Learning methods, skills, courses & lifelong self-improvement.",
    collectionEmojis: ["📚","✏️","🎯","🧠","🗣️","🔭","🎨","💻","📝","🌟"],
  },
  "health-wellness": {
    bg: "bg-rose-50 dark:bg-rose-950/30",
    heroBg: "from-rose-50 via-white to-white dark:from-rose-950/40 dark:via-background dark:to-background",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
    iconBg: "bg-rose-100 dark:bg-rose-900/50",
    iconText: "text-rose-600 dark:text-rose-400",
    emoji: "🌿",
    tagline: "Fitness, nutrition, mental health, sleep & healthy habits.",
    collectionEmojis: ["🏃","🥗","🧘","😴","💊","🩺","🌞","🧬","❤️","🍎"],
  },
  "home-lifestyle": {
    bg: "bg-orange-50 dark:bg-orange-950/30",
    heroBg: "from-orange-50 via-white to-white dark:from-orange-950/40 dark:via-background dark:to-background",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
    iconBg: "bg-orange-100 dark:bg-orange-900/50",
    iconText: "text-orange-600 dark:text-orange-400",
    emoji: "🏠",
    tagline: "DIY, cooking, organisation, decor & everyday routines.",
    collectionEmojis: ["🛋️","🍳","🌱","🧹","🏡","🪴","🛠️","🎀","🕯️","🧺"],
  },
  travel: {
    bg: "bg-sky-50 dark:bg-sky-950/30",
    heroBg: "from-sky-50 via-white to-white dark:from-sky-950/40 dark:via-background dark:to-background",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-800",
    iconBg: "bg-sky-100 dark:bg-sky-900/50",
    iconText: "text-sky-600 dark:text-sky-400",
    emoji: "✈️",
    tagline: "Destinations, budgeting, packing, tips & trip planning.",
    collectionEmojis: ["🗺️","🏔️","🏖️","🎒","🛂","🌍","🚂","🏨","📸","🍜"],
  },
};

const DEFAULT_ACCENT = {
  bg: "bg-muted/30", heroBg: "from-muted/30 via-background to-background",
  text: "text-foreground", border: "border-border",
  iconBg: "bg-muted", iconText: "text-foreground",
  emoji: "📚", tagline: "Explore curated knowledge collections and guides.",
  collectionEmojis: ["📖","📄","🗂️","📑","📃","📋","📓","📔","📒","📕"],
};

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

/* ─── Metadata ───────────────────────────────────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const data = await getCategoryPageData(slug);
  if (!data) return {};
  const { category } = data;
  return buildMetadata({
    title: `${category.name} — Valendiro`,
    description: category.description || `Explore ${category.name} collections, topics and expert guides on Valendiro.`,
    canonical: `/${lang}/categories/${slug}`,
  });
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const pageData = await getCategoryPageData(slug);
  if (!pageData) notFound();

  const { category, collections, featuredTopics, latestArticles, faqs, relatedCategories, totalArticles, lastUpdated } = pageData;
  const accent = ACCENTS[slug] ?? DEFAULT_ACCENT;
  const hasContent = collections.length > 0 || featuredTopics.length > 0 || latestArticles.length > 0;

  /* Learning path — group first 5 collections into a flow */
  const pathCollections = collections.slice(0, 5);

  const breadcrumbs = [
    { name: "Home",       href: `/${lang}`,            isCurrent: false },
    { name: "Categories", href: `/${lang}/categories`, isCurrent: false },
    { name: category.name, href: `/${lang}/categories/${slug}`, isCurrent: true },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.description,
    url: `${SITE_URL}/${lang}/categories/${slug}`,
    numberOfItems: totalArticles,
  };

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className={`bg-gradient-to-b ${accent.heroBg} border-b ${accent.border}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pt-10 sm:pb-16">
          <Breadcrumbs items={breadcrumbs} />

          <div className="mt-8 flex flex-col sm:flex-row sm:items-start gap-6">
            {/* Icon */}
            <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl text-4xl shadow-sm ${accent.iconBg}`}>
              {accent.emoji}
            </div>

            {/* Title + description */}
            <div className="flex-1 min-w-0">
              <h1 className={`text-3xl sm:text-5xl font-bold tracking-tight ${accent.text} leading-tight`}>
                {category.name}
              </h1>
              <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                {category.description || accent.tagline}
              </p>

              {/* Stats bar */}
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                {collections.length > 0 && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs ${accent.iconBg} ${accent.iconText}`}>📂</span>
                    <strong className="text-foreground">{collections.length}</strong> collection{collections.length !== 1 ? "s" : ""}
                  </span>
                )}
                {featuredTopics.length > 0 && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs ${accent.iconBg} ${accent.iconText}`}>📖</span>
                    <strong className="text-foreground">{featuredTopics.length}</strong> topic{featuredTopics.length !== 1 ? "s" : ""}
                  </span>
                )}
                {totalArticles > 0 && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs ${accent.iconBg} ${accent.iconText}`}>📝</span>
                    <strong className="text-foreground">{totalArticles}</strong> article{totalArticles !== 1 ? "s" : ""}
                  </span>
                )}
                {lastUpdated && (
                  <span className="text-muted-foreground">Updated {formatDate(lastUpdated)}</span>
                )}
              </div>

              {/* CTA pills */}
              {hasContent && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {collections.length > 0 && (
                    <a href="#collections" className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${accent.iconBg} ${accent.iconText} hover:opacity-80`}>
                      Browse collections ↓
                    </a>
                  )}
                  {featuredTopics.length > 0 && (
                    <a href="#topics" className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                      Explore topics ↓
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-20">

        {/* ── COLLECTIONS (Subcategories) ─────────────────────────── */}
        <section id="collections">
          <div className="flex items-end justify-between mb-7">
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${accent.iconText}`}>Subcategories</p>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Browse by Collection</h2>
              <p className="mt-1 text-sm text-muted-foreground">Focused sub-topics within {category.name}</p>
            </div>
            {collections.length > 6 && (
              <Link href={`/${lang}/collections`} className="text-sm font-medium text-muted-foreground hover:text-primary transition shrink-0">
                View all →
              </Link>
            )}
          </div>

          {collections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map((col, i) => {
                const colEmoji = accent.collectionEmojis[i % accent.collectionEmojis.length];
                const isFeatured = i < 3;
                return (
                  <Link
                    key={col.id}
                    href={`/${lang}/collections/${col.slug}`}
                    className={`group relative flex flex-col rounded-2xl border bg-card p-6 hover:shadow-lg transition-all duration-200 ${isFeatured ? `${accent.border} hover:border-opacity-80` : "border-border/60 hover:border-primary/30"}`}
                  >
                    {isFeatured && (
                      <span className={`absolute top-3 right-3 rounded-lg px-2 py-0.5 text-xs font-semibold ${accent.iconBg} ${accent.iconText}`}>
                        Featured
                      </span>
                    )}
                    <div className="flex items-start gap-4 mb-4">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${accent.iconBg}`}>
                        {colEmoji}
                      </span>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors leading-snug pt-1">
                        {col.name}
                      </h3>
                    </div>
                    {col.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                        {col.description}
                      </p>
                    )}
                    <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
                      {col.topic_count > 0 && (
                        <span className="flex items-center gap-1">
                          <span>📖</span> {col.topic_count} topic{col.topic_count !== 1 ? "s" : ""}
                        </span>
                      )}
                      {col.article_count > 0 && (
                        <span className="flex items-center gap-1">
                          <span>📝</span> {col.article_count} article{col.article_count !== 1 ? "s" : ""}
                        </span>
                      )}
                      <span className={`ml-auto font-medium ${accent.iconText} opacity-0 group-hover:opacity-100 transition-opacity`}>
                        Explore →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              emoji={accent.emoji}
              title="Collections coming soon"
              description={`We are building curated ${category.name.toLowerCase()} collections. Meanwhile, explore popular topics below.`}
              action={{ label: "Browse Topics", href: `/${lang}/topics` }}
            />
          )}
        </section>

        {/* ── POPULAR TOPICS ──────────────────────────────────────── */}
        {featuredTopics.length > 0 && (
          <section id="topics">
            <div className="flex items-end justify-between mb-7">
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${accent.iconText}`}>Knowledge</p>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Popular Topics</h2>
                <p className="mt-1 text-sm text-muted-foreground">In-depth guides with curated articles and answers</p>
              </div>
              <Link href={`/${lang}/topics`} className="text-sm font-medium text-muted-foreground hover:text-primary transition shrink-0">
                All topics →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {featuredTopics.map((topic, i) => (
                <Link
                  key={topic.id}
                  href={`/${lang}/topics/${topic.slug}`}
                  className="group flex flex-col rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                >
                  <span className={`text-xs font-bold mb-2 ${accent.iconText} opacity-60`}>#{i + 1}</span>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm leading-snug">
                    {topic.title}
                  </h3>
                  {topic.subtitle && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-3 leading-relaxed flex-1">
                      {topic.subtitle}
                    </p>
                  )}
                  <span className={`mt-3 text-xs font-medium ${accent.iconText} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    Read guide →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── LATEST ARTICLES ─────────────────────────────────────── */}
        {latestArticles.length > 0 && (
          <section id="articles">
            <div className="mb-7">
              <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${accent.iconText}`}>Articles</p>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Latest Articles</h2>
              <p className="mt-1 text-sm text-muted-foreground">Recently published in {category.name}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {latestArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/${lang}/articles/${article.slug}`}
                  className="group flex flex-col rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                >
                  <span className={`text-xs font-semibold uppercase tracking-wide mb-2 ${accent.iconText}`}>Article</span>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm leading-snug">
                    {article.title}
                  </h3>
                  {article.description && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-3 leading-relaxed flex-1">
                      {article.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{article.reading_time} min read</span>
                    {article.updated_at && <span>{formatDate(article.updated_at)}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── LEARNING PATH ────────────────────────────────────────── */}
        {pathCollections.length >= 2 && (
          <section id="learning-path">
            <div className="mb-7">
              <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${accent.iconText}`}>Guided</p>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Learning Path</h2>
              <p className="mt-1 text-sm text-muted-foreground">A suggested route through {category.name}</p>
            </div>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 top-8 bottom-8 w-px bg-border/60 hidden sm:block" />
              <div className="space-y-3">
                {pathCollections.map((col, i) => {
                  const colEmoji = accent.collectionEmojis[i % accent.collectionEmojis.length];
                  return (
                    <Link
                      key={col.id}
                      href={`/${lang}/collections/${col.slug}`}
                      className="group relative flex items-center gap-5 rounded-2xl border border-border/60 bg-card px-5 py-4 hover:border-primary/30 hover:shadow-md transition-all duration-200 sm:ml-0"
                    >
                      {/* Step badge */}
                      <span className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl shadow-sm ${accent.iconBg}`}>
                        {colEmoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${accent.iconText}`}>Step {i + 1}</span>
                          {i === 0 && <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${accent.iconBg} ${accent.iconText}`}>Start here</span>}
                          {i === pathCollections.length - 1 && <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">Final</span>}
                        </div>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mt-0.5">
                          {col.name}
                        </h3>
                        {col.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{col.description}</p>
                        )}
                      </div>
                      <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                        {col.topic_count > 0 && <span>{col.topic_count} topics</span>}
                        <span className={`font-semibold ${accent.iconText} opacity-0 group-hover:opacity-100 transition-opacity`}>Start →</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── EMPTY STATE (no content at all) ─────────────────────── */}
        {!hasContent && (
          <EmptyState
            emoji={accent.emoji}
            title={`${category.name} content coming soon`}
            description="We are building expert content for this category. Explore other areas while you wait."
            action={{ label: "Browse all categories", href: `/${lang}/categories` }}
          />
        )}

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        {faqs.length > 0 && <FaqSection questions={faqs} />}

        {/* ── RELATED CATEGORIES ───────────────────────────────────── */}
        {relatedCategories.length > 0 && (
          <section id="related">
            <h2 className="text-lg font-semibold text-foreground mb-5">Explore related categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {relatedCategories.map((cat) => {
                const a = ACCENTS[cat.slug] ?? DEFAULT_ACCENT;
                return (
                  <Link
                    key={cat.id}
                    href={`/${lang}/categories/${cat.slug}`}
                    className={`group flex flex-col items-center gap-2 rounded-2xl border ${a.border} ${a.bg} p-4 text-center hover:shadow-md transition-all duration-200`}
                  >
                    <span className="text-2xl">{a.emoji}</span>
                    <span className={`text-xs font-semibold ${a.text} leading-tight`}>{cat.name}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </>
  );
}
