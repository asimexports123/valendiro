import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { SearchBar } from "@/components/admin/SearchBar";
import { Pagination } from "@/components/admin/Pagination";
import { ArticleDeleteButton } from "@/components/admin/ArticleDeleteButton";
import { ArticleApproveButton } from "@/components/admin/ArticleApproveButton";

const STATUS_TABS = [
  { label: "All",       value: ""          },
  { label: "Published", value: "published" },
  { label: "Drafts",    value: "draft"     },
  { label: "Failed",    value: "failed"    },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    draft:     "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    failed:    "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

function QualityBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-muted-foreground">—</span>;
  const color = score >= 70 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-rose-600";
  return <span className={`text-sm font-semibold tabular-nums ${color}`}>{score}/100</span>;
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  const { page = "1", q = "", status = "" } = await searchParams;
  const currentPage = parseInt(page, 10) || 1;
  const pageSize = 25;
  const offset = (currentPage - 1) * pageSize;

  const supabase = createAdminClient();

  // ── Fetch articles with optional status + search filter ──────────────────
  let query = supabase
    .from("articles")
    .select("id, slug, status, published_at, created_at, topic_id", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (status) query = query.eq("status", status);

  const { data: articles, count } = await query;

  // ── Fetch translations (title) ────────────────────────────────────────────
  const ids = (articles ?? []).map((a) => a.id);
  const { data: translations } = ids.length
    ? await supabase
        .from("article_translations")
        .select("article_id, title, meta_description")
        .in("article_id", ids)
        .eq("language_code", "en")
    : { data: [] };

  const titleMap: Record<string, { title: string; meta: string }> = {};
  for (const t of translations ?? []) {
    titleMap[t.article_id] = { title: t.title ?? "", meta: t.meta_description ?? "" };
  }

  // ── Fetch categories via topic → collection → category ───────────────────
  const topicIds = [...new Set((articles ?? []).map((a) => a.topic_id).filter(Boolean))];
  let categoryMap: Record<string, string> = {};
  if (topicIds.length > 0) {
    const { data: topics } = await supabase
      .from("topics")
      .select("id, collection_id")
      .in("id", topicIds);
    const collectionIds = [...new Set((topics ?? []).map((t) => t.collection_id).filter(Boolean))];
    if (collectionIds.length > 0) {
      const { data: collections } = await supabase
        .from("collections")
        .select("id, category_id")
        .in("id", collectionIds);
      const catIds = [...new Set((collections ?? []).map((c) => c.category_id).filter(Boolean))];
      const { data: categoryTranslations } = catIds.length
        ? await supabase
            .from("category_translations")
            .select("category_id, name")
            .in("category_id", catIds)
            .eq("language_code", "en")
        : { data: [] };
      const catNameMap: Record<string, string> = {};
      for (const ct of categoryTranslations ?? []) catNameMap[ct.category_id] = ct.name;
      const colCatMap: Record<string, string> = {};
      for (const col of collections ?? []) colCatMap[col.id] = catNameMap[col.category_id] ?? "";
      for (const topic of topics ?? []) categoryMap[topic.id] = colCatMap[topic.collection_id] ?? "";
    }
  }

  // ── Fetch quality scores from queue metadata ──────────────────────────────
  const slugList = (articles ?? []).map((a) => a.slug);
  const { data: queueItems } = slugList.length
    ? await supabase
        .from("content_generation_queue")
        .select("metadata")
        .in("metadata->>slug", slugList)
        .eq("status", "completed")
    : { data: [] };

  const qualityMap: Record<string, number> = {};
  for (const qi of queueItems ?? []) {
    const m = qi.metadata as Record<string, unknown>;
    const slug = m?.slug as string;
    const review = m?.editorial_review as Record<string, number> | undefined;
    if (slug && review?.overall) qualityMap[slug] = review.overall;
  }

  const rows = (articles ?? []).map((a) => ({
    id: a.id,
    slug: a.slug,
    status: a.status as string,
    title: titleMap[a.id]?.title || a.slug,
    category: a.topic_id ? (categoryMap[a.topic_id] ?? "—") : "—",
    publishedAt: a.published_at ? new Date(a.published_at).toLocaleDateString() : null,
    createdAt: new Date(a.created_at).toLocaleDateString(),
    quality: qualityMap[a.slug] ?? null,
  }));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Articles</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{count ?? 0} total articles</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 border-b border-border/60">
        {STATUS_TABS.map((tab) => {
          const active = status === tab.value;
          return (
            <Link
              key={tab.value}
              href={`/admin/articles?status=${tab.value}${q ? `&q=${q}` : ""}`}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Search */}
      <SearchBar />

      {/* Article list */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card px-6 py-16 text-center">
          <p className="text-4xl mb-3">📝</p>
          <p className="font-semibold text-foreground">No articles yet</p>
          <p className="text-sm text-muted-foreground mt-1">Press Start Pipeline on the dashboard to generate your first articles.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 overflow-hidden divide-y divide-border/50">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center gap-4 px-5 py-4 bg-card hover:bg-muted/30 transition-colors">

              {/* Title + meta */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-foreground text-sm truncate">{row.title}</p>
                  <StatusBadge status={row.status} />
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                  {row.category !== "—" && <span>{row.category}</span>}
                  <span>{row.publishedAt ?? row.createdAt}</span>
                  <QualityBadge score={row.quality} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/admin/articles/${row.id}`}
                  className="rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium hover:border-primary/40 transition-colors"
                >
                  Edit
                </Link>
                {row.status === "draft" && (
                  <ArticleApproveButton id={row.id} />
                )}
                <ArticleDeleteButton id={row.id} />
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        page={currentPage}
        pageSize={pageSize}
        total={count ?? 0}
        basePath="/admin/articles"
        searchParams={{ q, status }}
      />

    </div>
  );
}
