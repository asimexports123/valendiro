"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Draft {
  id: string;
  slug: string;
  title: string;
  words: number;
  meta: string;
  createdAt: string;
}

export function DraftReviewPanel({ drafts: initial }: { drafts: Draft[] }) {
  const [drafts, setDrafts] = useState(initial);
  const [loading, setLoading] = useState<Record<string, string>>({});
  const router = useRouter();

  async function approve(id: string) {
    if (!confirm("Is article ko approve karke publish karo?")) return;
    setLoading((p) => ({ ...p, [id]: "approving" }));
    try {
      const res = await fetch(`/api/admin/articles/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: "local-test" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setDrafts((p) => p.filter((d) => d.id !== id));
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setLoading((p) => { const n = { ...p }; delete n[id]; return n; });
    }
  }

  async function deleteDraft(id: string) {
    if (!confirm("Is draft ko permanently delete karo?")) return;
    setLoading((p) => ({ ...p, [id]: "deleting" }));
    try {
      const res = await fetch("/api/admin/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "articles", id, secret: "local-test" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Delete failed");
      setDrafts((p) => p.filter((d) => d.id !== id));
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setLoading((p) => { const n = { ...p }; delete n[id]; return n; });
    }
  }

  if (drafts.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <span className="rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-xs font-bold px-2 py-0.5">
            {drafts.length}
          </span>
          Drafts — Review karo aur approve karo
        </h2>
      </div>

      <div className="rounded-2xl border border-amber-200/70 dark:border-amber-800/40 overflow-hidden divide-y divide-border/40">
        {drafts.map((d) => {
          const busy = !!loading[d.id];
          const action = loading[d.id];
          return (
            <div key={d.id} className="flex items-start gap-3 px-4 py-3 bg-amber-50/30 dark:bg-amber-950/10">
              {/* Content info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{d.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{d.meta || "—"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {d.words} words · {new Date(d.createdAt).toLocaleDateString("en-IN")}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0 pt-0.5">
                <button
                  onClick={() => approve(d.id)}
                  disabled={busy}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-3 py-1.5 text-xs font-semibold transition-colors"
                >
                  {action === "approving" ? "…" : "✓ Approve"}
                </button>
                <button
                  onClick={() => deleteDraft(d.id)}
                  disabled={busy}
                  className="rounded-lg border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 disabled:opacity-40 px-3 py-1.5 text-xs font-semibold transition-colors"
                >
                  {action === "deleting" ? "…" : "✕ Delete"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
