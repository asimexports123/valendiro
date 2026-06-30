import { notFound } from "next/navigation";
import Link from "next/link";
import { getItemById } from "@/lib/admin/actions";
import { Article } from "@/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { ArticleDeleteButton } from "@/components/admin/ArticleDeleteButton";
import { ArticleApproveButton } from "@/components/admin/ArticleApproveButton";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: article } = await getItemById<Article>({ table: "articles" }, id);
  if (!article) notFound();

  const supabase = createAdminClient();
  const { data: translations } = await supabase
    .from("article_translations")
    .select("language_code, title, excerpt, content")
    .eq("article_id", id);

  const en = (translations || []).find((t) => t.language_code === "en");

  // Fetch topic + category
  let topicName: string | null = null;
  let categoryName: string | null = null;
  let relatedArticles: { id: string; slug: string; title: string; status: string }[] = [];

  if (article.topic_id) {
    const { data: topic } = await supabase
      .from("topics")
      .select("id, name, category_id, categories(name)")
      .eq("id", article.topic_id)
      .maybeSingle();

    if (topic) {
      topicName = topic.name;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      categoryName = (topic as any).categories?.name ?? null;

      // Related articles from same topic
      const { data: related } = await supabase
        .from("articles")
        .select("id, slug, status, article_translations(title)")
        .eq("topic_id", article.topic_id)
        .neq("id", id)
        .limit(8);

      relatedArticles = (related ?? []).map((a) => ({
        id: a.id,
        slug: a.slug,
        status: a.status,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        title: (a as any).article_translations?.find((t: any) => t.language_code === "en")?.title
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ?? (a as any).article_translations?.[0]?.title
          ?? a.slug,
      }));
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <div className="flex items-center justify-between">
        <Link href="/admin/articles" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Articles
        </Link>
        <div className="flex items-center gap-2">
          {article.status === "draft" && <ArticleApproveButton id={id} />}
          <ArticleDeleteButton id={id} />
        </div>
      </div>

      {/* Title + status */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground leading-tight">
            {en?.title || article.slug}
          </h1>
          {en?.excerpt && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{en.excerpt}</p>
          )}
        </div>
        <span className={`shrink-0 rounded-xl px-3 py-1 text-xs font-semibold ${
          article.status === "published"
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
            : article.status === "review"
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
            : "bg-muted text-muted-foreground"
        }`}>
          {article.status}
        </span>
      </div>

      {/* Meta grid */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
        {[
          { label: "Slug",      value: article.slug },
          { label: "Type",      value: article.article_type },
          { label: "Lifecycle", value: article.lifecycle_status },
          { label: "Created",   value: new Date(article.created_at).toLocaleDateString() },
          { label: "Updated",   value: new Date(article.updated_at).toLocaleDateString() },
          { label: "Published", value: article.published_at ? new Date(article.published_at).toLocaleDateString() : "—" },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium text-foreground mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Topic & Category */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Category</p>
          <p className="font-medium text-foreground mt-0.5">{categoryName ?? <span className="text-muted-foreground">— not linked</span>}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Topic</p>
          {topicName ? (
            <Link href={`/admin/topics?q=${encodeURIComponent(topicName)}`} className="font-medium text-primary hover:underline mt-0.5 block">
              {topicName}
            </Link>
          ) : (
            <p className="font-medium text-muted-foreground mt-0.5">— not linked</p>
          )}
        </div>
      </div>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Related Articles in same Topic ({relatedArticles.length})
          </h2>
          <div className="space-y-2">
            {relatedArticles.map((a) => (
              <Link
                key={a.id}
                href={`/admin/articles/${a.id}`}
                className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-muted transition-colors"
              >
                <span className="text-sm text-foreground truncate">{a.title}</span>
                <span className={`ml-2 shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                  a.status === "published"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-muted text-muted-foreground"
                }`}>{a.status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Content preview */}
      {en?.content && (
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Content Preview</h2>
          <div className="text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed overflow-auto max-h-96 line-clamp-[30]">
            {en.content}
          </div>
        </div>
      )}

      {/* Translations */}
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Translations ({(translations || []).length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {(translations || []).map((t) => (
            <span key={t.language_code} className="rounded-lg bg-muted px-3 py-1 text-xs font-medium">
              {t.language_code} — {t.title || "no title"}
            </span>
          ))}
        </div>
      </div>

      {/* Public link */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">View on site</p>
          <p className="text-xs text-muted-foreground mt-0.5">/en/articles/{article.slug}</p>
        </div>
        <Link
          href={`/en/articles/${article.slug}`}
          target="_blank"
          className="rounded-xl border border-border/60 px-4 py-2 text-sm font-medium hover:border-primary/30 hover:shadow-sm transition-all"
        >
          Preview →
        </Link>
      </div>
    </div>
  );
}
