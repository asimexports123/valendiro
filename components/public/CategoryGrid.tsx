import Link from "next/link";
import { PublicCategory } from "@/services/public/publicData";

const CATEGORY_META: Record<string, { emoji: string; color: string; bg: string; description: string }> = {
  technology: {
    emoji: "💻",
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    description: "AI, programming, software, gadgets & the future of tech.",
  },
  business: {
    emoji: "🚀",
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    description: "Startups, marketing, entrepreneurship & business growth.",
  },
  "personal-finance": {
    emoji: "💰",
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    description: "Investing, budgeting, credit, retirement & financial freedom.",
  },
  education: {
    emoji: "📚",
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    description: "Learning strategies, courses, skills & self-improvement.",
  },
  "health-wellness": {
    emoji: "🏃",
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    description: "Fitness, nutrition, mental health & healthy habits.",
  },
  "home-lifestyle": {
    emoji: "🏠",
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    description: "DIY, cooking, organization, decor & daily routines.",
  },
  travel: {
    emoji: "✈️",
    color: "text-sky-600",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    description: "Destinations, budget travel, packing tips & trip planning.",
  },
};

export function CategoryGrid({ lang, categories }: { lang: string; categories: PublicCategory[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Explore by Category
          </h2>
          <p className="mt-2 text-muted-foreground">
            In-depth guides, tutorials and answers across 7 knowledge areas.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category) => {
            const meta = CATEGORY_META[category.slug];
            const emoji = meta?.emoji ?? "📖";
            const color = meta?.color ?? "text-primary";
            const bg = meta?.bg ?? "bg-muted";
            const desc = meta?.description || category.description || `Explore ${category.name} resources.`;
            return (
              <Link
                key={category.id}
                href={`/${lang}/categories/${category.slug}`}
                className="group flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow)] hover:shadow-[var(--shadow-elevated)] hover:border-primary/30 transition-all duration-200"
              >
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${bg}`}>
                  {emoji}
                </span>
                <div className="min-w-0">
                  <h3 className={`font-semibold ${color} group-hover:opacity-80 transition-opacity`}>
                    {category.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {desc}
                  </p>
                  {category.article_count > 0 && (
                    <p className="mt-2 text-xs font-medium text-muted-foreground">
                      {category.article_count} topic{category.article_count === 1 ? "" : "s"}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
