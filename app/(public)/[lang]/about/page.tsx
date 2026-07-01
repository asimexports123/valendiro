import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { WhyValendiro } from "@/components/public/WhyValendiro";
import { SITE_NAME } from "@/lib/constants";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return buildMetadata({
    title: `About ${SITE_NAME}`,
    description: "Trusted knowledge for everything that matters. Valendiro is a global knowledge platform for human-quality articles, guides, and answers.",
    canonical: `/${lang}/about`,
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <>
      <div className="border-b border-border/50 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            About {SITE_NAME}
          </h1>
          <p className="mt-6 text-xl text-muted-foreground leading-relaxed max-w-2xl">
            A global knowledge platform built to help people understand anything — clearly, deeply, and reliably.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 space-y-12">
        <section className="space-y-5 text-base text-muted-foreground leading-relaxed">
          <p>
            {SITE_NAME} was built on a simple belief: everyone deserves access to well-structured, trustworthy, and continuously updated knowledge — regardless of where they are or what they are trying to learn.
          </p>
          <p>
            We organise knowledge into categories, subcategories, and topics so that navigating any subject feels natural. Whether you are a student looking for a clear explanation, a professional doing research, or simply someone who wants to understand the world better — {SITE_NAME} is built for you.
          </p>
          <p>
            Every article, guide, and answer on {SITE_NAME} is written to be readable, accurate, and useful. We do not publish just to publish. We publish to genuinely help.
          </p>
        </section>

        <WhyValendiro />
      </div>
    </>
  );
}
