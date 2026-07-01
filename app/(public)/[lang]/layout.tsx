import { notFound } from "next/navigation";
import { isValidLanguage } from "@/lib/utils/helpers";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";
import { getNavData } from "@/services/public/publicData";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { ScrollToTop } from "@/components/public/ScrollToTop";

export const revalidate = 86400;

export async function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map((lang) => ({ lang }));
}

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!isValidLanguage(lang)) {
    notFound();
  }

  const navCategories = await getNavData();

  return (
    <div className="min-h-full flex flex-col bg-background">
      <ScrollToTop />
      <PublicHeader lang={lang} navCategories={navCategories} />
      <main className="flex-1">{children}</main>
      <PublicFooter lang={lang} />
    </div>
  );
}
