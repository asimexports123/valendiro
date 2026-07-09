import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { SipCalculatorWidget } from "@/components/tools/SipCalculatorWidget";
import { getToolBySlug } from "@/config/toolsRegistry";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 86400;

const RELATED_TOPICS = [
  { slug: "mutual-fund-fundamentals", title: "Mutual Fund Fundamentals" },
  { slug: "index-funds", title: "Index Funds" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const tool = getToolBySlug("sip-calculator");
  if (!tool) return {};

  return buildMetadata({
    title: `${tool.title} — Estimate Mutual Fund SIP Returns`,
    description:
      "Free SIP calculator with guide: see how monthly mutual fund investments can grow with compounding. Adjust amount, duration, and expected return.",
    canonical: `/${lang}/tools/sip-calculator`,
  });
}

export default async function SipCalculatorPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const tool = getToolBySlug("sip-calculator");
  if (!tool) notFound();

  const breadcrumbs = [
    { name: "Home", href: `/${lang}`, isCurrent: false },
    { name: "Personal Finance", href: `/${lang}/categories/personal-finance`, isCurrent: false },
    { name: "Mutual Funds", href: `/${lang}/subcategories/mutual-funds`, isCurrent: false },
    { name: tool.title, href: `/${lang}/tools/sip-calculator`, isCurrent: true },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.title,
    description: tool.shortDescription,
    url: `${SITE_URL}/${lang}/tools/sip-calculator`,
    applicationCategory: "FinanceApplication",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <>
      <div className="border-b border-border/50 bg-muted/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <Breadcrumbs items={breadcrumbs} />
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Mutual Funds · Calculator
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            SIP Calculator
          </h1>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            See how a systematic investment plan (SIP) in mutual funds could grow when you invest
            the same amount every month. Use the sliders below, then read how SIP math works.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
        <SipCalculatorWidget />

        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <h2>What is a SIP?</h2>
          <p>
            A <strong>Systematic Investment Plan (SIP)</strong> lets you invest a fixed sum in a
            mutual fund at regular intervals — usually monthly. Instead of trying to time the market
            with one large lump sum, SIPs spread purchases across months so you buy more units when
            prices are lower and fewer when prices are higher (rupee-cost averaging).
          </p>

          <h2>How this calculator works</h2>
          <p>
            We estimate maturity value using the standard future-value formula for equal monthly
            contributions with compound growth:
          </p>
          <p className="font-mono text-sm bg-muted/60 rounded-lg px-4 py-3 not-prose">
            FV = P × [((1 + r)<sup>n</sup> − 1) / r] × (1 + r)
          </p>
          <ul>
            <li>
              <strong>P</strong> = monthly investment
            </li>
            <li>
              <strong>r</strong> = expected monthly return (annual rate ÷ 12)
            </li>
            <li>
              <strong>n</strong> = total months
            </li>
          </ul>
          <p>
            <strong>Total invested</strong> is simply monthly amount × number of months.{" "}
            <strong>Estimated returns</strong> = maturity value minus total invested. Actual fund
            returns vary with market conditions, expense ratios, and taxes — this tool is for
            planning, not a guarantee.
          </p>

          <h2>Example</h2>
          <p>
            Investing ₹10,000 per month for 10 years at an assumed 12% annual return would mean
            ₹12,00,000 invested. Compounding could bring the estimated maturity value to roughly
            ₹23,00,000 — with about ₹11,00,000 from growth. Try those numbers in the calculator
            above.
          </p>

          <h2>When SIPs make sense</h2>
          <ul>
            <li>You want disciplined, automated investing from salary each month</li>
            <li>You are building long-term wealth in diversified equity or hybrid mutual funds</li>
            <li>You prefer gradual entry rather than one large market-timing bet</li>
          </ul>

          <h2>Limitations</h2>
          <p>
            Returns are not guaranteed. Past performance does not predict future results. Equity
            funds can lose value over short periods. Consult a qualified financial adviser for
            personal advice. This calculator does not account for exit loads, capital gains tax, or
            step-up SIPs.
          </p>
        </article>

        <section className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Continue learning</h2>
          <ul className="space-y-2">
            {RELATED_TOPICS.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/${lang}/topics/${t.slug}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {t.title} →
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={`/${lang}/subcategories/mutual-funds`}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                All Mutual Funds topics →
              </Link>
            </li>
          </ul>
        </section>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </>
  );
}
