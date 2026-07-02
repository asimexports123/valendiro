import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";

export default async function PreviewEntityTypesPage() {
  const supabase = createAdminClient();

  const { data: entityTypes } = await supabase
    .from("entity_types")
    .select(`
      id, slug, created_at,
      entity_type_translations(name, description),
      entity_type_sections(id)
    `)
    .order("created_at", { ascending: false });

  const items = (entityTypes ?? []).map((et) => {
    const trans = (et.entity_type_translations as { name: string; description: string | null }[]) ?? [];
    const sections = (et.entity_type_sections as { id: string }[]) ?? [];
    return {
      id: et.id,
      slug: et.slug,
      name: trans[0]?.name ?? et.slug,
      description: trans[0]?.description ?? "",
      sectionCount: sections.length,
      created: new Date(et.created_at).toLocaleDateString(),
    };
  });

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded inline-block mb-2">
            PREVIEW MODE — Read Only
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Entity Types</h1>
          <p className="text-muted-foreground mt-1">Blueprint templates for Knowledge Hubs</p>
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <p className="text-center text-muted-foreground py-8">No entity types yet.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Link key={item.id} href={`/preview/entity-types/${item.id}`}>
              <Card className="hover:border-foreground/20 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-semibold text-foreground">{item.sectionCount}</div>
                    <div className="text-xs text-muted-foreground">sections</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="font-mono bg-muted/50 px-2 py-0.5 rounded">{item.slug}</span>
                  <span>Created {item.created}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/30">
        <Link href="/preview/hubs" className="hover:text-foreground transition-colors">View Knowledge Hubs →</Link>
      </div>
    </div>
  );
}
