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

  // Fetch drafts for inline review
  const supabase = createAdminClient();
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

      {/* Draft Review — top priority */}
      <DraftReviewPanel drafts={drafts} />

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{greeting} 👋</h1>
        <p className="mt-1 text-muted-foreground text-sm">Here is what is happening on your website today.</p>
      </div>

      {/* Website Health Banner */}
      {system.healthy ? (
        <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-6 py-5">
          <span className="text-3xl">✅</span>
          <div>
            <p className="font-semibold text-emerald-800 dark:text-emerald-200">Everything is working</p>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-0.5">
              Automation is ON · Last publish: {timeAgo(system.lastPublish)}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-4 rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 px-6 py-5">
          <span className="text-3xl">{system.automationEnabled ? "⚠️" : "⏸️"}</span>
          <div className="flex-1">
            <p className="font-semibold text-rose-800 dark:text-rose-200">
              {system.automationEnabled ? "Attention required" : "Publishing is paused"}
            </p>
            {system.errorMessage && (
              <p className="text-sm text-rose-700 dark:text-rose-300 mt-0.5">{system.errorMessage}</p>
            )}
          </div>
          <Link href="/admin/settings" className="shrink-0 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition-colors">
            Go to Settings
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

      {/* Stats Grid */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Content Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Total Articles",    value: stats.totalArticles,    href: "/admin/articles",   emoji: "📝" },
            { label: "Total Topics",       value: stats.totalTopics,      href: "/admin/topics",     emoji: "📖" },
            { label: "Total Collections",  value: stats.totalCollections, href: "/admin/collections",emoji: "📂" },
            { label: "Total Categories",   value: stats.totalCategories,  href: "/admin/categories", emoji: "📚" },
            { label: "Published Today",    value: stats.publishedToday,   href: "/admin/articles",   emoji: "🚀" },
            { label: "Awaiting Review",    value: stats.pendingReview,    href: "/admin/articles",   emoji: stats.pendingReview > 0 ? "⚠️" : "✅" },
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

      {/* Actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Quick Actions</h2>
        <OwnerActions automationEnabled={system.automationEnabled} />
      </div>

    </div>
  );
}
