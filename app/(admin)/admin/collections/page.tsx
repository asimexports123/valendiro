import { createAdminClient } from "@/lib/supabase/admin";
import { DataTable } from "@/components/admin/DataTable";

export default async function AdminCollectionsPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("collections")
    .select("id, slug, category_id, sort_order, created_at, collection_translations(name)")
    .eq("collection_translations.language_code", "en")
    .order("sort_order", { ascending: true })
    .limit(100);

  const rows = (data || []).map((c: any) => ({
    id: c.id,
    name: c.collection_translations?.[0]?.name || c.slug,
    slug: c.slug,
    created_at: c.created_at ? new Date(c.created_at).toLocaleDateString() : "—",
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Collections</h1>
      <DataTable
        rows={rows}
        columns={[
          { key: "name", label: "Name" },
          { key: "slug", label: "Slug" },
          { key: "created_at", label: "Created" },
        ]}
        getRowId={(r) => r.id}
        basePath="/admin/collections"
        deleteTable="collections"
      />
    </div>
  );
}
