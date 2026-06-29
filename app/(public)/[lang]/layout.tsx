import { notFound } from "next/navigation";
import { isValidLanguage } from "@/lib/utils/helpers";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";

export const revalidate = 3600;

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

  const user = await getCurrentUser();
  const showAdmin = !!user && isAdmin(user.role);

  return (
    <div className="min-h-full flex flex-col bg-background">
      <PublicHeader lang={lang} showAdmin={showAdmin} />
      <main className="flex-1">{children}</main>
      <PublicFooter lang={lang} />
    </div>
  );
}
