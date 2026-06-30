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
    <>
      <div className="border-b border-border/50 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Contact Us</h1>
          <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
            Have questions, feedback, or partnership ideas? We would love to hear from you.
          </p>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="mailto:hello@valendiro.com"
            className="group flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-6 hover:border-primary/30 hover:shadow-md transition-all duration-200"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Mail className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">Email us</p>
              <p className="mt-1 text-sm text-muted-foreground">hello@valendiro.com</p>
              <p className="mt-2 text-xs text-muted-foreground">We reply within 24 hours.</p>
            </div>
          </a>
          <div className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-6">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground text-xl">
              💬
            </span>
            <div>
              <p className="font-semibold text-foreground">General enquiries</p>
              <p className="mt-1 text-sm text-muted-foreground">For content corrections, partnerships, or feedback about the platform.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
