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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="max-w-3xl mb-16">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
          About {SITE_NAME}
        </h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          {SITE_NAME} is a global knowledge platform. We believe that everyone deserves access to trusted, well-structured, and continuously updated information.
        </p>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          We combine structured research with human-quality writing to produce articles, guides, and answers that help you understand any topic deeply.
        </p>
      </div>
      <WhyValendiro />
    </div>
  );
}
