import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { CompoundInterestWidget } from "@/components/tools/CompoundInterestWidget";
import { BmiCalculatorWidget } from "@/components/tools/BmiCalculatorWidget";
import { PositionSizeWidget } from "@/components/tools/PositionSizeWidget";
import { Retirement401kWidget } from "@/components/tools/Retirement401kWidget";
import { InflationAdjustedReturnsWidget } from "@/components/tools/InflationAdjustedReturnsWidget";
import { ExpenseRatioWidget } from "@/components/tools/ExpenseRatioWidget";
import { CagrWidget } from "@/components/tools/CagrWidget";
import { PortfolioAllocationWidget } from "@/components/tools/PortfolioAllocationWidget";
import { CalorieTdeeWidget } from "@/components/tools/CalorieTdeeWidget";
import { MacroWidget } from "@/components/tools/MacroWidget";
import { CaloriesBurnedWidget } from "@/components/tools/CaloriesBurnedWidget";
import { OneRepMaxWidget } from "@/components/tools/OneRepMaxWidget";
import { QuizWidget } from "@/components/tools/QuizWidget";
import { getQuiz } from "@/config/quizData";
import { getToolGuide } from "@/config/toolGuides";
import {
  CATEGORY_LABELS,
  getToolBySlug,
  SUBCATEGORY_LABELS,
  toolPath,
} from "@/config/toolsRegistry";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 86400;
export const dynamicParams = true;

const DYNAMIC_SLUGS = [
  "compound-interest-calculator",
  "retirement-401k-calculator",
  "inflation-adjusted-returns-calculator",
  "expense-ratio-calculator",
  "cagr-calculator",
  "portfolio-allocation-calculator",
  "stock-position-calculator",
  "bmi-calculator",
  "calorie-tdee-calculator",
  "macro-calculator",
  "calories-burned-calculator",
  "one-rep-max-calculator",
  "programming-quiz",
  "web-development-quiz",
  "ai-basics-quiz",
  "stock-market-quiz",
  "fitness-basics-quiz",
  "mental-wellness-quiz",
];

export async function generateStaticParams() {
  return DYNAMIC_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool || slug === "sip-calculator") return {};

  return buildMetadata({
    title: `${tool.title} — Valendiro`,
    description: tool.shortDescription,
    canonical: `/${lang}/tools/${slug}`,
  });
}

function ToolWidget({ slug, lang }: { slug: string; lang: string }) {
  const tool = getToolBySlug(slug);
  const relatedHref =
    tool?.relatedTopicSlug ? `/${lang}/topics/${tool.relatedTopicSlug}` : undefined;

  switch (slug) {
    case "compound-interest-calculator":
      return <CompoundInterestWidget />;
    case "retirement-401k-calculator":
      return <Retirement401kWidget />;
    case "inflation-adjusted-returns-calculator":
      return <InflationAdjustedReturnsWidget />;
    case "expense-ratio-calculator":
      return <ExpenseRatioWidget />;
    case "cagr-calculator":
      return <CagrWidget />;
    case "portfolio-allocation-calculator":
      return <PortfolioAllocationWidget />;
    case "stock-position-calculator":
      return <PositionSizeWidget />;
    case "bmi-calculator":
      return <BmiCalculatorWidget />;
    case "calorie-tdee-calculator":
      return <CalorieTdeeWidget />;
    case "macro-calculator":
      return <MacroWidget />;
    case "calories-burned-calculator":
      return <CaloriesBurnedWidget />;
    case "one-rep-max-calculator":
      return <OneRepMaxWidget />;
    case "programming-quiz":
    case "web-development-quiz":
    case "ai-basics-quiz":
    case "stock-market-quiz":
    case "fitness-basics-quiz":
    case "mental-wellness-quiz": {
      const quiz = getQuiz(slug);
      if (!quiz) return null;
      return (
        <QuizWidget
          quiz={quiz}
          relatedTopicHref={relatedHref}
          relatedTopicLabel={tool?.relatedTopicTitle}
        />
      );
    }
    default:
      return null;
  }
}

export default async function DynamicToolPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;

  if (slug === "sip-calculator") notFound();

  const tool = getToolBySlug(slug);
  const guide = getToolGuide(slug);
  if (!tool || !guide) notFound();

  const catLabel = CATEGORY_LABELS[tool.categorySlug] ?? tool.categorySlug;
  const subLabel = SUBCATEGORY_LABELS[tool.subcategorySlug] ?? tool.subcategorySlug;

  const breadcrumbs = [
    { name: "Home", href: `/${lang}`, isCurrent: false },
    { name: catLabel, href: `/${lang}/categories/${tool.categorySlug}`, isCurrent: false },
    { name: subLabel, href: `/${lang}/subcategories/${tool.subcategorySlug}`, isCurrent: false },
    { name: tool.title, href: toolPath(lang, slug), isCurrent: true },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": tool.kind === "quiz" ? "Quiz" : "WebApplication",
    name: tool.title,
    description: tool.shortDescription,
    url: `${SITE_URL}/${lang}/tools/${slug}`,
  };

  return (
    <>
      <div className="border-b border-border/50 bg-muted/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <Breadcrumbs items={breadcrumbs} />
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-primary">
            {subLabel} · {tool.kind === "quiz" ? "Quiz" : "Calculator"}
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {tool.title}
          </h1>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">{guide.intro}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
        <ToolWidget slug={slug} lang={lang} />

        {guide.sections.length > 0 && (
          <article className="prose prose-neutral dark:prose-invert max-w-none">
            {guide.sections.map((s) => (
              <div key={s.heading}>
                <h2>{s.heading}</h2>
                {s.body.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
              </div>
            ))}
            {guide.disclaimer && (
              <p className="text-sm text-muted-foreground not-prose">{guide.disclaimer}</p>
            )}
          </article>
        )}

        <section className="rounded-2xl border border-border/60 bg-card p-6 space-y-3">
          <h2 className="text-lg font-bold text-foreground">Continue learning</h2>
          {tool.relatedTopicSlug && (
            <Link
              href={`/${lang}/topics/${tool.relatedTopicSlug}`}
              className="block text-sm font-medium text-primary hover:underline"
            >
              {tool.relatedTopicTitle ?? "Related guide"} →
            </Link>
          )}
          <Link
            href={`/${lang}/subcategories/${tool.subcategorySlug}`}
            className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            All {subLabel} topics →
          </Link>
        </section>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </>
  );
}
