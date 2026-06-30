import Link from "next/link";
import { DataTable } from "@/components/admin/DataTable";
import { Pagination } from "@/components/admin/Pagination";
import { SearchBar } from "@/components/admin/SearchBar";
import { listItems } from "@/lib/admin/actions";
import { Article } from "@/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page = "1", q = "" } = await searchParams;
  const currentPage = parseInt(page, 10) || 1;
  const pageSize = 20;

  const { data: rows, count } = await listItems<Article>(
    { table: "articles", revalidatePaths: ["/admin/articles"] },
    {
      page: currentPage,
      pageSize,
      search: q,
      searchColumns: ["slug"],
      orderBy: "created_at",
    }
  );

  const supabase = createAdminClient();
  const ids = rows.map((r) => r.id);
  const { data: translations } = ids.length
    ? await supabase
        .from("article_translations")
        .select("article_id, title")
        .in("article_id", ids)
        .eq("language_code", "en")
    : { data: [] };

  const titleMap: Record<string, string> = {};
  for (const t of translations || []) {
    titleMap[t.article_id] = t.title;
  }

  const enriched = rows.map((r) => ({
    ...r,
    _title: titleMap[r.id] || r.slug,
    _published: r.published_at ? new Date(r.published_at).toLocaleDateString() : "—",
  }));

  // ── Drafts section ────────────────────────────────────────────────────────
  const { data: draftArticles } = await supabase
    .from("articles")
    .select("id, slug, status, created_at")
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(50);

  const draftIds = (draftArticles ?? []).map((a) => a.id);
  const { data: draftTranslations } = draftIds.length
    ? await supabase
        .from("article_translations")
        .select("article_id, title, content, meta_description")
        .in("article_id", draftIds)
        .eq("language_code", "en")
    : { data: [] };

  const draftTMap: Record<string, { title: string; words: number; meta: string }> = {};
  for (const t of draftTranslations ?? []) {
    const words = (t.content as string ?? "").split(/\s+/).filter(Boolean).length;
    draftTMap[t.article_id] = { title: t.title, words, meta: t.meta_description ?? "" };
  }

  return (
    <div className="space-y-8">

      {/* ── Draft Review Section ──────────────────────────────────────────── */}
      {(draftArticles ?? []).length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Drafts pending review
              <span className="ml-2 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-xs font-semibold px-2 py-0.5">
                {(draftArticles ?? []).length}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">Review each article before approving for publish</p>
          </div>
          <div className="divide-y divide-border/50 rounded-2xl border border-amber-200/60 dark:border-amber-800/40 overflow-hidden">
            {(draftArticles ?? []).map((a) => {
              const t = draftTMap[a.id];
              return (
                <div key={a.id} className="flex items-center justify-between gap-4 px-4 py-3 bg-amber-50/40 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground text-sm truncate">{t?.title || a.slug}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{t?.meta || "no meta description"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t?.words ?? 0} words &middot; {new Date(a.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/admin/articles/${a.id}`}
                      className="rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium hover:border-primary/40 transition-colors"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Articles</h1>
        <span className="text-sm text-muted-foreground">{count} total</span>
      </div>
      <SearchBar />
      <DataTable<typeof enriched[0]>
        rows={enriched}
        columns={[
          { key: "_title",     label: "Title" },
          { key: "slug",       label: "Slug" },
          { key: "status",     label: "Status" },
          { key: "_published", label: "Published" },
        ]}
        getRowId={(row) => row.id}
        basePath="/admin/articles"
        deleteTable="articles"
      />
      <Pagination
        page={currentPage}
        pageSize={pageSize}
        total={count}
        basePath="/admin/articles"
        searchParams={{ q }}
      />
    </div>
  );
}
