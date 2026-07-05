import { createAdminClient } from "@/lib/supabase/admin";

export default async function SeoPage() {
  const supabase = createAdminClient();

  const { data: topicTranslations } = await supabase
    .from("topic_translations")
    .select("id, topic_id, title, meta_title, meta_description, structured_data, created_at")
    .order("updated_at", { ascending: false })
    .limit(20);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">SEO Dashboard</h1>
        <p className="mt-1 text-muted-foreground text-sm">Monitor SEO metadata and optimization status</p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card">
        <div className="p-6 border-b border-border/40">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">SEO Metadata Status</h2>
            <span className="text-sm text-muted-foreground">{topicTranslations?.length || 0} pages</span>
          </div>
        </div>

        <div className="divide-y divide-border/40">
          {topicTranslations && topicTranslations.length > 0 ? (
            topicTranslations.map((translation) => (
              <div key={translation.id} className="p-6 hover:bg-muted/30 transition-colors">
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-foreground">{translation.title}</p>
                    <p className="text-sm text-muted-foreground">Topic ID: {translation.topic_id}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Meta Title</p>
                      <p className="text-foreground">{translation.meta_title || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Meta Description</p>
                      <p className="text-foreground truncate">{translation.meta_description || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">JSON-LD</p>
                      <p className="text-emerald-600">{translation.structured_data ? "✅ Present" : "❌ Missing"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="text-emerald-600">Ready</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No SEO metadata found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
