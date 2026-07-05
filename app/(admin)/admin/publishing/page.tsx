import { createAdminClient } from "@/lib/supabase/admin";

function timeAgo(iso: string | null) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function PublishingPage() {
  const supabase = createAdminClient();

  // Fetch topics with different statuses
  const { data: topics } = await supabase
    .from("topics")
    .select("id, slug, status, published_at, updated_at");

  const { data: renderedOutputs } = await supabase
    .from("rendered_outputs")
    .select("id, package_id, status, quality_score, created_at");

  const { data: publicationLogs } = await supabase
    .from("publication_logs")
    .select("id, topic_id, action, result, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  // Calculate ready to publish topics
  const readyTopicIds = (renderedOutputs ?? [])
    .filter(r => r.status === "published")
    .map(r => r.package_id);
  const readyToPublish = (topics ?? []).filter(t => 
    (t.status === "draft" || t.status === "review") && 
    readyTopicIds.includes(t.id)
  );

  const recentlyPublished = (topics ?? []).filter(t => t.status === "published");
  const failedPublications = (publicationLogs ?? []).filter(l => l.result === "failed");

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Publishing</h1>
        <p className="mt-1 text-muted-foreground text-sm">Manage content publication pipeline</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          Publish Selected
        </button>
        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
          Publish All Ready
        </button>
        <button className="px-4 py-2 border border-border/60 bg-card rounded-lg hover:bg-muted transition-colors">
          Republish Failed
        </button>
      </div>

      {/* Ready to Publish */}
      <div className="rounded-2xl border border-border/60 bg-card">
        <div className="p-6 border-b border-border/40">
          <h2 className="text-lg font-semibold text-foreground">Ready to Publish ({readyToPublish.length})</h2>
        </div>
        <div className="divide-y divide-border/40">
          {readyToPublish.length > 0 ? (
            readyToPublish.slice(0, 10).map((topic) => (
              <div key={topic.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                <div>
                  <p className="font-medium text-foreground">{topic.slug}</p>
                  <p className="text-sm text-muted-foreground">Status: {topic.status}</p>
                </div>
                <button className="px-3 py-1 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm">
                  Publish
                </button>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No topics ready to publish</p>
            </div>
          )}
        </div>
      </div>

      {/* Recently Published */}
      <div className="rounded-2xl border border-border/60 bg-card">
        <div className="p-6 border-b border-border/40">
          <h2 className="text-lg font-semibold text-foreground">Recently Published ({recentlyPublished.length})</h2>
        </div>
        <div className="divide-y divide-border/40">
          {recentlyPublished.length > 0 ? (
            recentlyPublished.slice(0, 10).map((topic) => (
              <div key={topic.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                <div>
                  <p className="font-medium text-foreground">{topic.slug}</p>
                  <p className="text-sm text-muted-foreground">Published: {topic.published_at ? new Date(topic.published_at).toLocaleDateString() : "—"}</p>
                </div>
                <span className="text-xs text-emerald-600">✅ Published</span>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No recently published topics</p>
            </div>
          )}
        </div>
      </div>

      {/* Failed Publications */}
      {failedPublications.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card">
          <div className="p-6 border-b border-border/40">
            <h2 className="text-lg font-semibold text-foreground">Failed Publications ({failedPublications.length})</h2>
          </div>
          <div className="divide-y divide-border/40">
            {failedPublications.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                <div>
                  <p className="font-medium text-foreground">{log.action}</p>
                  <p className="text-sm text-muted-foreground">Topic: {log.topic_id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-rose-600">❌ Failed</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(log.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
