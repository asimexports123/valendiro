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
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Articles</h1>
        <span className="text-sm text-muted-foreground">{count} total</span>
      </div>
      <SearchBar />
      <DataTable<typeof enriched[0]>
        rows={enriched}
        columns={[
          {
            key: "_title",
            label: "Title",
            render: (row) => (
              <span className="font-medium text-foreground line-clamp-1">{row._title}</span>
            ),
          },
          { key: "slug", label: "Slug" },
          { key: "status", label: "Status" },
          {
            key: "published_at",
            label: "Published",
            render: (row) =>
              row.published_at ? new Date(row.published_at).toLocaleDateString() : "—",
          },
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
