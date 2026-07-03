import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCategoryPageData } from "@/services/public/publicData";
import { FaqSection } from "@/components/public/FaqSection";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { EmptyState } from "@/components/public/EmptyState";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 3600;
export const dynamicParams = true;

/* ─── Accent config ─────────────────────────────────────────────────── */
const ACCENTS: Record<string, {
  bg: string; heroBg: string; text: string; border: string;
  iconBg: string; iconText: string; emoji: string; tagline: string;
  subcategoryEmojis: string[];
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
    subcategoryEmojis: ["🤖","🌐","📱","⚡","🔬","🛡️","☁️","🎮","🔧","📊"],
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
    subcategoryEmojis: ["📈","🏦","💳","🏠","📊","💎","🌱","🎯","🔄","💵"],
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
    subcategoryEmojis: ["🚀","📣","🤝","🧭","⚙️","🛒","👑","💡","📋","🌍"],
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
    subcategoryEmojis: ["📚","✏️","🎯","🧠","🗣️","🔭","🎨","💻","📝","🌟"],
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
    subcategoryEmojis: ["🏃","🥗","🧘","😴","💊","🩺","🌞","🧬","❤️","🍎"],
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
    subcategoryEmojis: ["🛋️","🍳","🌱","🧹","🏡","🪴","🛠️","🎀","🕯️","🧺"],
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
    subcategoryEmojis: ["🗺️","🏔️","🏖️","🎒","🛂","🌍","🚂","🏨","📸","🍜"],
  },
};

const DEFAULT_ACCENT = {
  bg: "bg-muted/30", heroBg: "from-muted/30 via-background to-background",
  text: "text-foreground", border: "border-border",
  iconBg: "bg-muted", iconText: "text-foreground",
  emoji: "📚", tagline: "Explore curated knowledge subcategories and guides.",
  subcategoryEmojis: ["📖","📄","🗂️","📑","📃","📋","📓","📔","📒","📕"],
};

/* ─── Rich hero descriptions per category ────────────────────────── */
const HERO_INTROS: Record<string, { headline: string; body: string; pillars: string[] }> = {
  technology: {
    headline: "The definitive knowledge hub for modern technology",
    body: "From foundational computer science to cutting-edge AI, this hub covers every layer of the technology stack. Whether you are learning to code, evaluating software tools, or tracking the future of hardware and infrastructure, every subcategory here is built around lasting, evergreen knowledge.",
    pillars: ["Artificial Intelligence", "Software Development", "Cybersecurity", "Cloud & Infrastructure", "Hardware & Electronics", "Web & Mobile"],
  },
  "personal-finance": {
    headline: "Build real financial knowledge, not just tips",
    body: "Personal finance is not about tricks — it is about building systems. This hub covers the full financial life cycle: earning more, spending less, investing wisely, protecting wealth, and retiring on your terms. Subcategories are structured for beginners and advanced readers alike.",
    pillars: ["Investing & Markets", "Budgeting & Saving", "Debt & Credit", "Retirement Planning", "Tax Strategies", "Real Estate"],
  },
  business: {
    headline: "Strategy, growth, and leadership knowledge in one place",
    body: "Building and scaling a business requires knowledge across many disciplines. This hub brings together the core frameworks of entrepreneurship, marketing, operations, and leadership — structured as deep subcategories rather than surface-level listicles.",
    pillars: ["Entrepreneurship", "Marketing & Growth", "Leadership & Management", "Operations", "Sales", "Strategy"],
  },
  education: {
    headline: "Learn how to learn — and keep learning",
    body: "Education is more than certificates. This hub covers learning science, skill acquisition, academic disciplines, and self-directed study. Whether you are a student, professional, or lifelong learner, the subcategories here support structured progress.",
    pillars: ["Learning Methods", "Academic Skills", "STEM Subjects", "Languages", "Critical Thinking", "Career & Skills"],
  },
  "health-wellness": {
    headline: "Evidence-based health knowledge for every stage of life",
    body: "Health decisions require reliable information. This hub covers fitness, nutrition, mental health, sleep, preventive care, and chronic condition management — all grounded in research, not trends. Subcategories are designed for practical, long-term wellbeing.",
    pillars: ["Fitness & Exercise", "Nutrition & Diet", "Mental Health", "Sleep & Recovery", "Preventive Health", "Chronic Conditions"],
  },
  "home-lifestyle": {
    headline: "Make your home and daily life work better",
    body: "A well-run home is a foundation for everything else. This hub covers home organisation, cooking, DIY, decor, sustainability, and the routines that make daily life more intentional. Practical knowledge, not aspirational content.",
    pillars: ["Home Organisation", "Cooking & Food", "DIY & Repairs", "Interior & Decor", "Sustainability", "Daily Routines"],
  },
  travel: {
    headline: "Travel smarter with structured, practical knowledge",
    body: "Travel is a skill. This hub covers trip planning, budgeting, packing, visa logistics, destination guides, and the mindset shifts that make travel more rewarding. Subcategories are built for independent travellers who prefer knowledge over generic itineraries.",
    pillars: ["Destination Guides", "Budget Travel", "Trip Planning", "Packing & Gear", "Visas & Logistics", "Solo & Group Travel"],
  },
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
    description: category.description || `Explore ${category.name} subcategories, topics and expert guides on Valendiro.`,
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

  const { category, subcategories, featuredTopics, latestArticles, faqs, relatedCategories, totalArticles, lastUpdated, beginnerTopics, intermediateTopics, advancedTopics, learningPath } = pageData;

  // Hide category pages with no published content — never show an empty shell
  const hasContent = subcategories.length > 0 || featuredTopics.length > 0 || latestArticles.length > 0;
  if (!hasContent) notFound();

  const accent = ACCENTS[slug] ?? DEFAULT_ACCENT;

  /* Learning path — group first 6 subcategories into a flow */
  const pathSubcategories = subcategories.slice(0, 6);
  const heroIntro = HERO_INTROS[slug] ?? null;

  /* Difficulty labels for learning path steps */
  const STEP_DIFFICULTY = ["Beginner", "Beginner", "Intermediate", "Intermediate", "Advanced", "Expert"] as const;
  const STEP_DIFFICULTY_STYLE = [
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  ] as const;

  const breadcrumbs = [
    { name: "Home",       href: `/${lang}`,            isCurrent: false },
    { name: "Categories", href: `/${lang}/categories`, isCurrent: false },
    { name: category.name, href: `/${lang}/categories/${slug}`, isCurrent: true },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "SubcategoryPage",
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
              {heroIntro ? (
                <>
                  <p className="mt-3 text-base sm:text-lg font-medium text-foreground/80 max-w-2xl leading-relaxed">
                    {heroIntro.headline}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground max-w-2xl leading-relaxed">
                    {heroIntro.body}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {heroIntro.pillars.map((p) => (
                      <span key={p} className={`rounded-lg px-2.5 py-1 text-xs font-medium ${accent.iconBg} ${accent.iconText}`}>{p}</span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                  {category.description || accent.tagline}
                </p>
              )}

              {/* Stats bar */}
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                {subcategories.length > 0 && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs ${accent.iconBg} ${accent.iconText}`}>📂</span>
                    <strong className="text-foreground">{subcategories.length}</strong> subcategory{subcategories.length !== 1 ? "s" : ""}
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
                  {subcategories.length > 0 && (
                    <a href="#subcategories" className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${accent.iconBg} ${accent.iconText} hover:opacity-80`}>
                      Browse subcategories ↓
                    </a>
                  )}
                  {featuredTopics.length > 0 && (
                    <a href="#topics" className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                      Explore topics ↓
                    </a>
                  )}
                  {latestArticles.length > 0 && (
                    <a href="#articles" className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                      Featured articles ↓
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
        <section id="subcategories">
          <div className="flex items-end justify-between mb-7">
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${accent.iconText}`}>Subcategories</p>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Browse by Subcategory</h2>
              <p className="mt-1 text-sm text-muted-foreground">Focused sub-topics within {category.name}</p>
            </div>
            {subcategories.length > 6 && (
              <Link href={`/${lang}/subcategories`} className="text-sm font-medium text-muted-foreground hover:text-primary transition shrink-0">
                View all →
              </Link>
            )}
          </div>

          {subcategories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subcategories.map((col, i) => {
                const colEmoji = accent.subcategoryEmojis[i % accent.subcategoryEmojis.length];
                const isFeatured = i < 3;
                return (
                  <Link
                    key={col.id}
                    href={`/${lang}/subcategories/${col.slug}`}
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
              title="Subcategories coming soon"
              description={`We are building curated ${category.name.toLowerCase()} subcategories. Meanwhile, explore popular topics below.`}
              action={{ label: "Browse Topics", href: `/${lang}/topics` }}
            />
          )}
        </section>

        {/* ── LEARNING PATH ─────────────────────────────────────────── */}
        {learningPath.length > 0 && (
          <section id="learning-path">
            <div className="flex items-end justify-between mb-7">
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${accent.iconText}`}>Learning Path</p>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Recommended Learning Journey</h2>
                <p className="mt-1 text-sm text-muted-foreground">Start from basics and progress to advanced topics</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🌱</span>
                  <h3 className="font-bold text-emerald-700 dark:text-emerald-300">Beginner</h3>
                </div>
                <div className="space-y-2">
                  {learningPath.filter(s => s.difficulty === "Beginner").slice(0, 3).map((sub) => (
                    <Link key={sub.id} href={`/${lang}/subcategories/${sub.slug}`} className="block text-sm text-foreground hover:text-primary transition-colors">
                      {sub.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">📈</span>
                  <h3 className="font-bold text-amber-700 dark:text-amber-300">Intermediate</h3>
                </div>
                <div className="space-y-2">
                  {learningPath.filter(s => s.difficulty === "Intermediate").slice(0, 3).map((sub) => (
                    <Link key={sub.id} href={`/${lang}/subcategories/${sub.slug}`} className="block text-sm text-foreground hover:text-primary transition-colors">
                      {sub.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🚀</span>
                  <h3 className="font-bold text-rose-700 dark:text-rose-300">Advanced</h3>
                </div>
                <div className="space-y-2">
                  {learningPath.filter(s => s.difficulty === "Advanced").slice(0, 3).map((sub) => (
                    <Link key={sub.id} href={`/${lang}/subcategories/${sub.slug}`} className="block text-sm text-foreground hover:text-primary transition-colors">
                      {sub.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── POPULAR TOPICS ──────────────────────────────────────── */}
        {featuredTopics.length > 0 && (
          <section id="topics">
            <div className="flex items-end justify-between mb-7">
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${accent.iconText}`}>Knowledge</p>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Popular Topics</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {featuredTopics.length} in-depth guides with curated articles and answers
                </p>
              </div>
              <Link href={`/${lang}/topics`} className="text-sm font-medium text-muted-foreground hover:text-primary transition shrink-0">
                All topics →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {featuredTopics.map((topic, i) => (
                <Link
                  key={topic.id}
                  href={`/${lang}/topics/${topic.slug}`}
                  className="group flex flex-col rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold ${accent.iconText} opacity-50`}>#{i + 1}</span>
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${accent.iconBg} ${accent.iconText}`}>Guide</span>
                  </div>
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

        {/* ── FEATURED ARTICLES ───────────────────────────────────── */}
        {latestArticles.length > 0 && (
          <section id="articles">
            <div className="flex items-end justify-between mb-7">
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${accent.iconText}`}>Reading List</p>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Featured Articles</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {latestArticles.length} recently published in {category.name}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {latestArticles.map((article, i) => (
                <Link
                  key={article.id}
                  href={`/${lang}/articles/${article.slug}`}
                  className={`group flex flex-col rounded-2xl border bg-card p-5 hover:shadow-md transition-all duration-200 ${
                    i < 3 ? `${accent.border} hover:border-opacity-80` : "border-border/60 hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${accent.iconBg} ${accent.iconText}`}>
                      Article
                    </span>
                    <span className="text-[10px] text-muted-foreground">{article.reading_time} min read</span>
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm leading-snug flex-1">
                    {article.title}
                  </h3>
                  {article.description && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {article.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-3">
                    {article.updated_at && <span>Updated {formatDate(article.updated_at)}</span>}
                    <span className={`font-medium ${accent.iconText} opacity-0 group-hover:opacity-100 transition-opacity ml-auto`}>Read →</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── LEARNING PATH ────────────────────────────────────────── */}
        {pathSubcategories.length >= 2 && (
          <section id="learning-path">
            <div className="mb-7">
              <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${accent.iconText}`}>Guided</p>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Learning Path</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A structured route through {category.name} — from foundations to advanced mastery
              </p>
            </div>

            {/* Progress rail */}
            <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-1">
              {pathSubcategories.map((col, i) => (
                <div key={col.id} className="flex items-center gap-2 shrink-0">
                  <a
                    href={`#step-${i + 1}`}
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow-sm transition-colors ${
                      accent.iconBg
                    } ${accent.iconText}`}
                  >
                    {i + 1}
                  </a>
                  {i < pathSubcategories.length - 1 && (
                    <div className={`h-px w-8 ${accent.border} border-t`} />
                  )}
                </div>
              ))}
            </div>

            <div className="relative">
              <div className="absolute left-6 top-8 bottom-8 w-px bg-border/60 hidden sm:block" />
              <div className="space-y-3">
                {pathSubcategories.map((col, i) => {
                  const colEmoji = accent.subcategoryEmojis[i % accent.subcategoryEmojis.length];
                  const diffLabel = STEP_DIFFICULTY[i] ?? "Advanced";
                  const diffStyle = STEP_DIFFICULTY_STYLE[i] ?? STEP_DIFFICULTY_STYLE[4];
                  return (
                    <Link
                      key={col.id}
                      id={`step-${i + 1}`}
                      href={`/${lang}/subcategories/${col.slug}`}
                      className="group relative flex items-center gap-5 rounded-2xl border border-border/60 bg-card px-5 py-4 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                    >
                      <span className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl shadow-sm ${accent.iconBg}`}>
                        {colEmoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-xs font-bold ${accent.iconText}`}>Step {i + 1}</span>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${diffStyle}`}>{diffLabel}</span>
                          {i === 0 && <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${accent.iconBg} ${accent.iconText}`}>Start here</span>}
                          {i === pathSubcategories.length - 1 && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">Final step</span>}
                        </div>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mt-1">
                          {col.name}
                        </h3>
                        {col.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{col.description}</p>
                        )}
                      </div>
                      <div className="hidden sm:flex flex-col items-end gap-1 text-xs text-muted-foreground shrink-0">
                        {col.topic_count > 0 && <span>{col.topic_count} topic{col.topic_count !== 1 ? "s" : ""}</span>}
                        {col.article_count > 0 && <span>{col.article_count} article{col.article_count !== 1 ? "s" : ""}</span>}
                        <span className={`font-semibold ${accent.iconText} opacity-0 group-hover:opacity-100 transition-opacity`}>Begin →</span>
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
