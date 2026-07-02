import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";

export default async function PreviewEntityTypeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: et } = await supabase
    .from("entity_types")
    .select(`
      id, slug, created_at, updated_at,
      entity_type_translations(name, description)
    `)
    .eq("id", id)
    .single();

  if (!et) notFound();

  const trans = (et.entity_type_translations as { name: string; description: string | null }[]) ?? [];
  const name = trans[0]?.name ?? et.slug;
  const description = trans[0]?.description ?? "";

  const { data: sections } = await supabase
    .from("entity_type_sections")
    .select(`
      id, slug, sort_order,
      entity_type_section_translations(name, description),
      entity_type_slots(
        id, slug, sort_order,
        entity_type_slot_translations(title, description)
      )
    `)
    .eq("entity_type_id", id)
    .order("sort_order");

  const sectionItems = (sections ?? []).map((sec) => {
    const secTrans = (sec.entity_type_section_translations as { name: string; description: string | null }[]) ?? [];
    const slots = (sec.entity_type_slots as { id: string; slug: string; sort_order: number; entity_type_slot_translations: { title: string; description: string | null }[] }[]) ?? [];
    return {
      id: sec.id,
      slug: sec.slug,
      name: secTrans[0]?.name ?? sec.slug,
      description: secTrans[0]?.description ?? "",
      slots: slots
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((slot) => ({
          id: slot.id,
          slug: slot.slug,
          title: slot.entity_type_slot_translations?.[0]?.title ?? slot.slug,
          description: slot.entity_type_slot_translations?.[0]?.description ?? "",
        })),
    };
  });

  const totalSlots = sectionItems.reduce((acc, s) => acc + s.slots.length, 0);

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded inline-block mb-2">
            PREVIEW MODE — Read Only
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/preview/entity-types" className="hover:text-foreground transition-colors">Entity Types</Link>
            <span>/</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{name}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="text-right">
          <span className="font-mono bg-muted/50 px-2 py-0.5 rounded text-sm text-muted-foreground">{et.slug}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center py-4">
          <div className="text-3xl font-bold text-foreground">{sectionItems.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Sections</div>
        </Card>
        <Card className="text-center py-4">
          <div className="text-3xl font-bold text-foreground">{totalSlots}</div>
          <div className="text-xs text-muted-foreground mt-1">Slots</div>
        </Card>
        <Card className="text-center py-4">
          <div className="text-3xl font-bold text-foreground">—</div>
          <div className="text-xs text-muted-foreground mt-1">Hubs Using</div>
        </Card>
      </div>

      {/* Blueprint */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Blueprint Structure</h2>
        <div className="space-y-4">
          {sectionItems.map((section, sIdx) => (
            <Card key={section.id}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {sIdx + 1}. {section.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
                <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                  {section.slots.length} slots
                </span>
              </div>
              <div className="space-y-2 ml-4">
                {section.slots.map((slot, slIdx) => (
                  <div key={slot.id} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
                    <span className="text-xs text-muted-foreground font-mono w-6 shrink-0 pt-0.5">
                      {sIdx + 1}.{slIdx + 1}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-foreground">{slot.title}</div>
                      <div className="text-xs text-muted-foreground">{slot.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
