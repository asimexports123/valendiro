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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">Privacy Policy</h1>
      <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed">
        <p>
          {SITE_NAME} respects your privacy. This policy explains how we collect, use, and protect your information when you use our platform.
        </p>
        <p>
          We collect only the information necessary to provide and improve our services, such as search queries and anonymous usage analytics. We do not sell your personal data.
        </p>
        <p>
          By using {SITE_NAME}, you agree to the practices described in this policy. If you have questions, please contact us through the contact page.
        </p>
      </div>
    </div>
  );
}
