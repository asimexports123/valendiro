import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return buildMetadata({
    title: "Knowledge Objects",
    description: "Facts, definitions, procedures, and structured knowledge snippets.",
    canonical: `/${lang}/knowledge`,
  });
}

export default async function KnowledgePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in">
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">Knowledge Objects</h1>
        <p className="mt-2 text-lg text-muted-foreground">Facts, definitions, procedures, and structured knowledge snippets.</p>
      </div>
      <div className="rounded-3xl border border-dashed border-border bg-muted/20 p-12 text-center">
        <p className="text-muted-foreground">Knowledge snippets are being extracted from published articles and questions.</p>
      </div>
    </div>
  );
}
