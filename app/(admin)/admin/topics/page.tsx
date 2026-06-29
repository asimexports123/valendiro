import Link from "next/link";
import { DataTable } from "@/components/admin/DataTable";
import { Pagination } from "@/components/admin/Pagination";
import { SearchBar } from "@/components/admin/SearchBar";
import { Button } from "@/components/ui/Button";
import { listItems, deleteItem } from "@/lib/admin/actions";
import { Topic } from "@/lib/types";
import { slugify } from "@/lib/utils/helpers";

export default async function TopicsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page = "1", q = "" } = await searchParams;
  const currentPage = parseInt(page, 10) || 1;
  const pageSize = 20;

  const { data: rows, count } = await listItems<Topic>(
    { table: "topics", revalidatePaths: ["/admin/topics"] },
    {
      page: currentPage,
      pageSize,
      search: q,
      searchColumns: ["slug"],
      orderBy: "created_at",
    }
  );

  async function removeTopic(id: string) {
    "use server";
    await deleteItem({ table: "topics", revalidatePaths: ["/admin/topics"] }, id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Topics</h1>
        <Link href="/admin/topics/new">
          <Button>New Topic</Button>
        </Link>
      </div>
      <SearchBar />
      <DataTable<Topic>
        rows={rows}
        columns={[
          { key: "slug", label: "Slug" },
          { key: "status", label: "Status" },
          { key: "difficulty", label: "Difficulty" },
          {
            key: "published_at",
            label: "Published",
            render: (row) => (row.published_at ? new Date(row.published_at).toLocaleDateString() : "—"),
          },
        ]}
        getRowId={(row) => row.id}
        basePath="/admin/topics"
        onDelete={removeTopic}
      />
      <Pagination
        page={currentPage}
        pageSize={pageSize}
        total={count}
        basePath="/admin/topics"
        searchParams={{ q }}
      />
    </div>
  );
}
