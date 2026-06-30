import { notFound } from "next/navigation";
import Link from "next/link";
import { getItemById } from "@/lib/admin/actions";
import { Topic } from "@/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: topic } = await getItemById<Topic>(
    { table: "topics" },
    id
  );
  if (!topic) notFound();

  const supabase = createAdminClient();
  const { data: translations } = await supabase
    .from("topic_translations")
    .select("language_code, title, subtitle, content")
    .eq("topic_id", id);

  const enTranslation = (translations || []).find((t) => t.language_code === "en");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/topics" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Topics
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {enTranslation?.title || topic.slug}
          </h1>
          {enTranslation?.subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{enTranslation.subtitle}</p>
          )}
        </div>
        <span className={`rounded-xl px-3 py-1 text-xs font-semibold ${
          topic.status === "published"
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
            : topic.status === "review"
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
            : "bg-muted text-muted-foreground"
        }`}>
          {topic.status}
        </span>
      </div>

      {/* Meta */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
        {[
          { label: "Slug", value: topic.slug },
          { label: "Difficulty", value: topic.difficulty || "—" },
          { label: "Read time", value: topic.estimated_read_time ? `${topic.estimated_read_time} min` : "—" },
          { label: "Created", value: new Date(topic.created_at).toLocaleDateString() },
          { label: "Updated", value: new Date(topic.updated_at).toLocaleDateString() },
          { label: "Published", value: topic.published_at ? new Date(topic.published_at).toLocaleDateString() : "—" },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium text-foreground mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Content preview */}
      {enTranslation?.content && (
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Content Preview</h2>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-[20] font-mono text-xs leading-relaxed overflow-auto max-h-96">
            {enTranslation.content}
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
          <p className="text-xs text-muted-foreground mt-0.5">/en/topics/{topic.slug}</p>
        </div>
        <Link
          href={`/en/topics/${topic.slug}`}
          target="_blank"
          className="rounded-xl border border-border/60 px-4 py-2 text-sm font-medium hover:border-primary/30 hover:shadow-sm transition-all"
        >
          Preview →
        </Link>
      </div>
    </div>
  );
}
