import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function HubsPage() {
  const supabase = createAdminClient();

  // Get all topics that have an entity_type assigned (= they are knowledge hubs)
  const { data: topics } = await supabase
    .from("topics")
    .select(`
      id, slug, status, entity_type_id,
      topic_translations(title, subtitle),
      entity_types(slug, entity_type_translations(name))
    `)
    .not("entity_type_id", "is", null)
    .order("created_at", { ascending: false });

  // For each hub topic, get slot counts
  const hubs = await Promise.all(
    (topics ?? []).map(async (topic) => {
      const { data: slots } = await supabase
        .from("hub_slots")
        .select("status")
        .eq("topic_id", topic.id);

      const totalSlots = slots?.length ?? 0;
      const filledSlots = slots?.filter((s) => s.status !== "empty").length ?? 0;
      const coverage = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

      const trans = (topic.topic_translations as { title: string; subtitle: string | null }[]) ?? [];
      const etData = topic.entity_types as unknown as { slug: string; entity_type_translations: { name: string }[] } | null;
      const entityTypeName = etData?.entity_type_translations?.[0]?.name ?? etData?.slug ?? "—";

      return {
        id: topic.id,
        slug: topic.slug,
        title: trans[0]?.title ?? topic.slug,
        status: topic.status,
        entityType: entityTypeName,
        totalSlots,
        filledSlots,
        coverage,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Knowledge Hubs</h1>
          <p className="text-muted-foreground mt-1">Topics with assigned blueprints and tracked coverage</p>
        </div>
      </div>

      {hubs.length === 0 ? (
        <Card>
          <p className="text-center text-muted-foreground py-8">
            No Knowledge Hubs yet. Assign an Entity Type to a Topic to create one.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {hubs.map((hub) => (
            <Link key={hub.id} href={`/admin/hubs/${hub.id}`}>
              <Card className="hover:border-foreground/20 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-foreground">{hub.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs bg-muted/50 px-2 py-0.5 rounded text-muted-foreground">
                        {hub.entityType}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {hub.filledSlots}/{hub.totalSlots} articles
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-foreground">{hub.coverage}%</div>
                    <div className="text-xs text-muted-foreground">coverage</div>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-3 h-2 bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-foreground/80 rounded-full transition-all"
                    style={{ width: `${hub.coverage}%` }}
                  />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
