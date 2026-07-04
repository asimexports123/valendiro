import { redirect } from "next/navigation";

export const dynamicParams = true;

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  redirect(`/${lang}/topics/${slug}`);
}
