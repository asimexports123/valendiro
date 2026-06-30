import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { SearchBar } from "@/components/admin/SearchBar";
import { Button } from "@/components/ui/Button";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function TopicsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page = "1", q = "" } = await searchParams;
  const currentPage = parseInt(page, 10) || 1;
  const pageSize = 20;

  const supabase = createAdminClient();
  const offset = (currentPage - 1) * pageSize;

  let query = supabase
    .from("topics")
    .select("id, slug, status, difficulty, published_at, topic_translations(title, language_code)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (q) query = query.ilike("slug", `%${q}%`);

  const { data: rawRows, count } = await query;

  const rows = (rawRows ?? []).map((r) => {
    const trans = (r.topic_translations as { title: string; language_code: string }[]) ?? [];
    const enTitle = trans.find((t) => t.language_code === "en")?.title ?? trans[0]?.title ?? "—";
    return {
      ...r,
      _name: enTitle,
      _published: r.published_at ? new Date(r.published_at).toLocaleDateString() : "—",
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Topics</h1>
        <Link href="/admin/topics/new">
          <Button>New Topic</Button>
        </Link>
      </div>
      <SearchBar />
      <AdminTable
        rows={rows as Record<string, unknown>[]}
        columns={[
          { key: "_name",      label: "Name" },
          { key: "slug",       label: "Slug" },
          { key: "status",     label: "Status" },
          { key: "_published", label: "Published" },
        ]}
        basePath="/admin/topics"
        deleteTable="topics"
      />
      <Pagination
        page={currentPage}
        pageSize={pageSize}
        total={count ?? 0}
        basePath="/admin/topics"
        searchParams={{ q }}
      />
    </div>
  );
}
