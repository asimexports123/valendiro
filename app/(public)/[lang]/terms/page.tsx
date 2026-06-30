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
    <>
      <div className="border-b border-border/50 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Terms of Service</h1>
          <p className="mt-3 text-muted-foreground text-sm">Last updated: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        <div className="space-y-10 text-base text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Acceptance of terms</h2>
            <p>By accessing or using {SITE_NAME}, you agree to be bound by these terms. If you do not agree, please do not use the platform.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Content and accuracy</h2>
            <p>All content on {SITE_NAME} is provided for informational purposes only. We strive for accuracy and quality, but make no warranties about completeness or reliability. Always verify critical information from authoritative sources.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Intellectual property</h2>
            <p>All content, design, and code on {SITE_NAME} is the property of Valendiro. You may not reproduce, distribute, or use our content without written permission.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Changes to terms</h2>
            <p>We may update these terms at any time. Continued use of the platform after any changes constitutes your acceptance of the revised terms.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Contact</h2>
            <p>Questions about these terms? Contact us at <a href="mailto:hello@valendiro.com" className="text-accent hover:underline">hello@valendiro.com</a>.</p>
          </section>
        </div>
      </div>
    </>
  );
}
