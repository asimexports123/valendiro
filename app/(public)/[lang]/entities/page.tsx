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
    title: "Entities",
    description: "People, organizations, products, places, and concepts.",
    canonical: `/${lang}/entities`,
  });
}

export default async function EntitiesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in">
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">Entities</h1>
        <p className="mt-2 text-lg text-muted-foreground">People, organizations, products, places, and concepts.</p>
      </div>
      <div className="rounded-3xl border border-dashed border-border bg-muted/20 p-12 text-center">
        <p className="text-muted-foreground">Entity index is being expanded.</p>
      </div>
    </div>
  );
}
