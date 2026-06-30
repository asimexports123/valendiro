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
    title: `Privacy Policy — ${SITE_NAME}`,
    description: `Privacy policy for ${SITE_NAME}.`,
    canonical: `/${lang}/privacy`,
  });
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <>
      <div className="border-b border-border/50 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
          <p className="mt-3 text-muted-foreground text-sm">Last updated: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        <div className="space-y-10 text-base text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">What we collect</h2>
            <p>{SITE_NAME} collects only the information necessary to provide and improve our services — such as anonymous usage analytics and search queries. We do not collect personal information unless you contact us directly.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">How we use it</h2>
            <p>We use collected data solely to improve the platform — understanding which topics are most useful, fixing errors, and improving the reading experience. We do not sell, rent, or share your data with third parties for marketing purposes.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Cookies</h2>
            <p>We use essential cookies only — these are required for the platform to function correctly, such as remembering your language preference and dark mode setting. No tracking or advertising cookies are used.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Contact</h2>
            <p>If you have any privacy concerns, please contact us at <a href="mailto:hello@valendiro.com" className="text-accent hover:underline">hello@valendiro.com</a>.</p>
          </section>
        </div>
      </div>
    </>
  );
}
