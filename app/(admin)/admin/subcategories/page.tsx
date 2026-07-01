import { createAdminClient } from "@/lib/supabase/admin";
import { AdminTable } from "@/components/admin/AdminTable";

export default async function AdminSubcategoriesPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("subcategories")
    .select("id, slug, category_id, sort_order, created_at, subcategory_translations(name)")
    .eq("subcategory_translations.language_code", "en")
    .order("sort_order", { ascending: true })
    .limit(100);

  const rows = (data || []).map((c: any) => ({
    id: c.id,
    name: c.subcategory_translations?.[0]?.name || c.slug,
    slug: c.slug,
    created_at: c.created_at ? new Date(c.created_at).toLocaleDateString() : "—",
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Subcategories</h1>
      <AdminTable
        rows={rows as Record<string, unknown>[]}
        columns={[
          { key: "name",       label: "Name" },
          { key: "slug",       label: "Slug" },
          { key: "created_at", label: "Created" },
        ]}
        basePath="/admin/subcategories"
        deleteTable="subcategories"
      />
    </div>
  );
}
