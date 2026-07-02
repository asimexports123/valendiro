import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";

export default async function HubDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Get topic info
  const { data: topic } = await supabase
    .from("topics")
    .select(`
      id, slug, status, entity_type_id,
      topic_translations(title, subtitle),
      entity_types(slug, entity_type_translations(name))
    `)
    .eq("id", id)
    .single();

  if (!topic || !topic.entity_type_id) notFound();

  const topicTrans = (topic.topic_translations as { title: string; subtitle: string | null }[]) ?? [];
  const title = topicTrans[0]?.title ?? topic.slug;
  const etData = topic.entity_types as unknown as { slug: string; entity_type_translations: { name: string }[] } | null;
  const entityTypeName = etData?.entity_type_translations?.[0]?.name ?? etData?.slug ?? "—";

  // Get hub sections with slots
  const { data: sections } = await supabase
    .from("hub_sections")
    .select(`
      id, slug, sort_order,
      hub_section_translations(name, description),
      hub_slots(
        id, slug, sort_order, status, article_id,
        hub_slot_translations(title, description)
      )
    `)
    .eq("topic_id", id)
    .order("sort_order");

  const sectionItems = (sections ?? []).map((sec) => {
    const secTrans = (sec.hub_section_translations as { name: string; description: string | null }[]) ?? [];
    const slots = (sec.hub_slots as { id: string; slug: string; sort_order: number; status: string; article_id: string | null; hub_slot_translations: { title: string; description: string | null }[] }[]) ?? [];
    return {
      id: sec.id,
      name: secTrans[0]?.name ?? sec.slug,
      description: secTrans[0]?.description ?? "",
      slots: slots
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((slot) => ({
          id: slot.id,
          slug: slot.slug,
          title: slot.hub_slot_translations?.[0]?.title ?? slot.slug,
          description: slot.hub_slot_translations?.[0]?.description ?? "",
          status: slot.status,
          articleId: slot.article_id,
        })),
    };
  });

  const totalSlots = sectionItems.reduce((acc, s) => acc + s.slots.length, 0);
  const filledSlots = sectionItems.reduce((acc, s) => acc + s.slots.filter((sl) => sl.status !== "empty").length, 0);
  const coverage = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

  const statusIcon = (status: string) => {
    switch (status) {
      case "published": return "✅";
      case "drafted": return "📝";
      default: return "⬜";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/admin/hubs" className="hover:text-foreground transition-colors">Knowledge Hubs</Link>
          <span>/</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs bg-muted/50 px-2 py-0.5 rounded text-muted-foreground">
            {entityTypeName}
          </span>
          <span className="text-xs text-muted-foreground">
            {topic.status}
          </span>
        </div>
      </div>

      {/* Coverage Summary */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Coverage</h2>
          <div className="text-3xl font-bold text-foreground">{coverage}%</div>
        </div>
        <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground/80 rounded-full transition-all"
            style={{ width: `${coverage}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{filledSlots} articles written</span>
          <span>{totalSlots - filledSlots} remaining</span>
        </div>
      </Card>

      {/* Sections + Slots */}
      <div className="space-y-4">
        {sectionItems.map((section, sIdx) => {
          const sectionFilled = section.slots.filter((s) => s.status !== "empty").length;
          const sectionTotal = section.slots.length;
          const sectionPct = sectionTotal > 0 ? Math.round((sectionFilled / sectionTotal) * 100) : 0;

          return (
            <Card key={section.id}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {section.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-foreground">{sectionPct}%</span>
                  <span className="text-xs text-muted-foreground ml-1">({sectionFilled}/{sectionTotal})</span>
                </div>
              </div>
              <div className="space-y-1">
                {section.slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <span className="text-base">{statusIcon(slot.status)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{slot.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{slot.description}</div>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize shrink-0">
                      {slot.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
