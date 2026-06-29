import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { SITE_NAME } from "@/lib/constants";
import { Mail } from "lucide-react";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return buildMetadata({
    title: `Contact — ${SITE_NAME}`,
    description: `Get in touch with the ${SITE_NAME} team.`,
    canonical: `/${lang}/contact`,
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">Contact Us</h1>
      <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
        Have questions, feedback, or partnership ideas? We would love to hear from you.
      </p>
      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow)]">
        <a
          href="mailto:hello@valendiro.com"
          className="flex items-center gap-3 text-foreground hover:text-primary transition-colors"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Mail className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="font-medium">hello@valendiro.com</span>
        </a>
      </div>
    </div>
  );
}
