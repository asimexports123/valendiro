import Link from "next/link";
import { getOwnerDashboardData } from "@/services/admin/dashboardData";
import { OwnerActions } from "@/components/admin/OwnerActions";
import { DraftReviewPanel } from "@/components/admin/DraftReviewPanel";
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
  const data = await getOwnerDashboardData();
  const { stats, system, notifications } = data;

  const supabase = createAdminClient();

  // Editorial stats — today's pipeline activity
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const { data: todayQueue } = await supabase
    .from("content_generation_queue")
    .select("status, metadata")
    .gte("updated_at", todayStart.toISOString());

  const todayCompleted = (todayQueue ?? []).filter(q => q.status === "completed");
  const todayFailed    = (todayQueue ?? []).filter(q => q.status === "failed");
  const todayPending   = (todayQueue ?? []).filter(q => q.status === "pending" || q.status === "pending_llm");

  const scoresArr = todayCompleted
    .map(q => (q.metadata as Record<string,unknown>)?.editorial_review as Record<string,number>)
    .filter(Boolean);
  const avg = (key: string) => scoresArr.length
    ? Math.round(scoresArr.reduce((s,r) => s + (r[key] ?? 0), 0) / scoresArr.length)
    : null;
  const editorial = {
    generated: todayCompleted.length,
    failed: todayFailed.length,
    pendingLLM: (todayQueue ?? []).filter(q => q.status === "pending_llm").length,
    pendingQueue: (todayQueue ?? []).filter(q => q.status === "pending").length,
    avgQuality: avg("quality"),
    avgFact: avg("fact"),
    avgSEO: avg("seo"),
    avgOverall: avg("overall"),
    autoPublished: todayCompleted.filter(q => (q.metadata as Record<string,unknown>)?.auto_published).length,
  };

  // Fetch drafts for inline review
  const { data: draftArticles, error: draftError } = await supabase
    .from("articles")
    .select("id, slug, created_at, updated_at")
    .eq("status", "draft")
    .order("updated_at", { ascending: false })
    .limit(50);
  if (draftError) console.error("[Dashboard] Draft fetch error:", draftError.message);

  const draftIds = (draftArticles ?? []).map((a) => a.id);
  const { data: draftTrans } = draftIds.length
    ? await supabase
        .from("article_translations")
        .select("article_id, title, content, meta_description")
        .in("article_id", draftIds)
        .eq("language_code", "en")
    : { data: [] };

  const transMap: Record<string, { title: string; words: number; meta: string }> = {};
  for (const t of draftTrans ?? []) {
    transMap[t.article_id] = {
      title: t.title ?? "",
      words: ((t.content as string) ?? "").split(/\s+/).filter(Boolean).length,
      meta: (t.meta_description as string) ?? "",
    };
  }

  const drafts = (draftArticles ?? []).map((a) => ({
    id: a.id,
    slug: a.slug,
    title: transMap[a.id]?.title || a.slug,
    words: transMap[a.id]?.words ?? 0,
    meta: transMap[a.id]?.meta ?? "",
    createdAt: a.created_at ?? a.updated_at ?? new Date().toISOString(),
  }));

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{greeting} 👋</h1>
        <p className="mt-1 text-muted-foreground text-sm">Here is what is happening on your website today.</p>
      </div>

      {/* System Status Banner */}
      {system.healthy ? (
        <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-6 py-5">
          <span className="text-3xl">✅</span>
          <div>
            <p className="font-semibold text-emerald-800 dark:text-emerald-200">System is running</p>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-0.5">
              Last article published: {timeAgo(system.lastPublish)}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-4 rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 px-6 py-5">
          <span className="text-3xl">{system.automationEnabled ? "⚠️" : "⏸️"}</span>
          <div className="flex-1">
            <p className="font-semibold text-rose-800 dark:text-rose-200">
              {system.automationEnabled ? "Attention required" : "Pipeline is paused"}
            </p>
            {system.errorMessage && (
              <p className="text-sm text-rose-700 dark:text-rose-300 mt-0.5">{system.errorMessage}</p>
            )}
          </div>
          <Link href="/admin/settings" className="shrink-0 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition-colors">
            Settings
          </Link>
        </div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((n, i) => {
            const styles = {
              success: "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200",
              warning: "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200",
              error:   "border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-200",
            };
            const icons = { success: "✅", warning: "⚠️", error: "❌" };
            return (
              <div key={i} className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${styles[n.type]}`}>
                <span>{icons[n.type]}</span>
                {n.message}
              </div>
            );
          })}
        </div>
      )}

      {/* Today's Activity */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Today</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Generated",      value: editorial.generated,    color: "text-emerald-600", emoji: "✍️" },
            { label: "Published",      value: editorial.autoPublished, color: "text-blue-600",    emoji: "�" },
            { label: "Failed",         value: editorial.failed,        color: "text-rose-600",    emoji: "❌" },
            { label: "In Queue",       value: editorial.pendingQueue + editorial.pendingLLM, color: "text-amber-600", emoji: "⏳" },
          ].map(card => (
            <div key={card.label} className="rounded-2xl border border-border/60 bg-card p-5">
              <span className="text-2xl">{card.emoji}</span>
              <p className={`text-3xl font-bold tabular-nums mt-2 ${card.color}`}>{card.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Quality Scores — only shown when there's data */}
        {editorial.generated > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-3">
            {[
              { label: "Avg Quality Score", value: editorial.avgQuality },
              { label: "Avg SEO Score",     value: editorial.avgSEO },
              { label: "Avg Overall Score", value: editorial.avgOverall },
            ].map(card => (
              <div key={card.label} className="rounded-2xl border border-border/60 bg-card p-4">
                <p className={`text-2xl font-bold tabular-nums ${
                  card.value === null ? "text-muted-foreground" :
                  card.value >= 70 ? "text-emerald-600" :
                  card.value >= 50 ? "text-amber-600" : "text-rose-600"
                }`}>{card.value !== null ? `${card.value}/100` : "—"}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
              </div>
            ))}
          </div>
        )}

        {editorial.pendingLLM > 0 && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            ⏸️ {editorial.pendingLLM} articles waiting — AI quota will reset automatically
          </div>
        )}
      </div>

      {/* Content Overview */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Your Content</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Total Articles",  value: stats.totalArticles,  href: "/admin/articles", emoji: "📝" },
            { label: "Published Today", value: stats.publishedToday, href: "/admin/articles", emoji: "🚀" },
            { label: "Awaiting Review", value: stats.pendingReview,  href: "/admin/articles", emoji: stats.pendingReview > 0 ? "⚠️" : "✅" },
          ].map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="group flex flex-col rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200"
            >
              <span className="text-2xl mb-3">{card.emoji}</span>
              <span className="text-3xl font-bold text-foreground tabular-nums">{card.value}</span>
              <span className="mt-1 text-sm text-muted-foreground">{card.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Draft Review — inline */}
      <DraftReviewPanel drafts={drafts} />

      {/* Actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Actions</h2>
        <OwnerActions automationEnabled={system.automationEnabled} />
      </div>

    </div>
  );
}
