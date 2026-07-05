import Link from "next/link";
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

export default async function DashboardPage() {
  const supabase = createAdminClient();

  // Fetch operational stats from production tables
  const { data: topics } = await supabase
    .from("topics")
    .select("id, status, published_at, updated_at");

  const { data: renderedOutputs } = await supabase
    .from("rendered_outputs")
    .select("id, quality_score, status, created_at");

  const { data: publicationLogs } = await supabase
    .from("publication_logs")
    .select("id, topic_id, action, result, created_at, error_message")
    .order("created_at", { ascending: false })
    .limit(20);

  // Calculate operational KPIs
  const draftTopics = (topics ?? []).filter(t => t.status === "draft").length;
  const publishedTopics = (topics ?? []).filter(t => t.status === "published").length;
  const reviewTopics = (topics ?? []).filter(t => t.status === "review").length;
  const failedPublications = (publicationLogs ?? []).filter(l => l.result === "failed").length;
  
  // Calculate average quality score
  const qualityScores = (renderedOutputs ?? [])
    .map(r => r.quality_score)
    .filter((q): q is number => q !== null && typeof q === "number");
  const avgQuality = qualityScores.length > 0 
    ? Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length)
    : 0;

  // Ready to publish = topics with rendered outputs and draft/review status
  const readyTopicIds = (renderedOutputs ?? [])
    .filter(r => r.status === "published")
    .map(r => r.package_id);
  const readyToPublish = (topics ?? []).filter(t => 
    (t.status === "draft" || t.status === "review") && 
    readyTopicIds.includes(t.id)
  ).length;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{greeting} 👋</h1>
        <p className="mt-1 text-muted-foreground text-sm">Production Operations Dashboard</p>
      </div>

      {/* Operational KPI Cards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Content Status</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Draft Articles", value: draftTopics, href: "/admin/articles?status=draft", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/20" },
            { label: "Ready to Publish", value: readyToPublish, href: "/admin/publishing", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
            { label: "Published", value: publishedTopics, href: "/admin/articles?status=published", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20" },
            { label: "Needs Review", value: reviewTopics, href: "/admin/articles?status=review", color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/20" },
            { label: "Failed Publications", value: failedPublications, href: "/admin/publishing", color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/20" },
            { label: "Avg Quality", value: `${avgQuality}/100`, href: "/admin/articles", color: avgQuality >= 70 ? "text-emerald-600" : "text-amber-600", bg: avgQuality >= 70 ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-amber-50 dark:bg-amber-950/20" },
          ].map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="group flex flex-col rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200"
            >
              <p className={`text-3xl font-bold tabular-nums ${card.color}`}>{card.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Publication Activity */}
      {publicationLogs && publicationLogs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Recent Publications</h2>
          <div className="rounded-2xl border border-border/60 divide-y divide-border/40 overflow-hidden">
            {publicationLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={log.result === "success" ? "text-emerald-600" : "text-rose-600"}>
                    {log.result === "success" ? "✅" : "❌"}
                  </span>
                  <span className="text-sm font-medium text-foreground">{log.action}</span>
                </div>
                <div className="flex items-center gap-4">
                  {log.error_message && (
                    <span className="text-xs text-rose-600 max-w-xs truncate">{log.error_message}</span>
                  )}
                  <span className="text-xs text-muted-foreground">{timeAgo(log.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Create Article", href: "/admin/articles/new", emoji: "✍️" },
            { label: "Publish Queue", href: "/admin/publishing", emoji: "🚀" },
            { label: "SEO Dashboard", href: "/admin/seo", emoji: "🔍" },
            { label: "Sources", href: "/admin/sources", emoji: "🔗" },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 hover:border-primary/30 hover:shadow-md transition-all duration-200"
            >
              <span className="text-2xl">{action.emoji}</span>
              <span className="text-sm font-medium text-foreground">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
