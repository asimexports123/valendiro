import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { SITE_NAME } from "@/lib/constants";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return buildMetadata({
    title: `Terms of Service — ${SITE_NAME}`,
    description: `Terms of service for ${SITE_NAME}.`,
    canonical: `/${lang}/terms`,
  });
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">Terms of Service</h1>
      <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed">
        <p>
          By accessing or using {SITE_NAME}, you agree to be bound by these terms. If you do not agree, please do not use the platform.
        </p>
        <p>
          All content on {SITE_NAME} is provided for informational purposes. We strive for accuracy but make no warranties about completeness or reliability. Always verify critical information independently.
        </p>
        <p>
          We may update these terms at any time. Continued use of the platform after changes constitutes acceptance of the revised terms.
        </p>
      </div>
    </div>
  );
}
