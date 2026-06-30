"use client";

import { useEffect, useState } from "react";
import type { CategoryConfig, CategoryDefinition } from "@/services/demand/categoryConfig";

const INTENT_COLOR: Record<string, string> = {
  technology: "bg-blue-100 text-blue-700 border-blue-200",
  business: "bg-amber-100 text-amber-700 border-amber-200",
  "personal-finance": "bg-emerald-100 text-emerald-700 border-emerald-200",
  education: "bg-violet-100 text-violet-700 border-violet-200",
  "health-wellness": "bg-rose-100 text-rose-700 border-rose-200",
  "home-lifestyle": "bg-orange-100 text-orange-700 border-orange-200",
  travel: "bg-sky-100 text-sky-700 border-sky-200",
};

function CategoryCard({
  cat,
  onToggle,
}: {
  cat: CategoryDefinition;
  onToggle: (slug: string, enabled: boolean) => void;
}) {
  const color = INTENT_COLOR[cat.slug] ?? "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <div className={`rounded-2xl border-2 p-5 transition-all ${cat.enabled ? "border-border/60 bg-background shadow-[var(--shadow)]" : "border-dashed border-border/40 bg-muted/30 opacity-60"}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${color}`}>
            {cat.label}
          </span>
          <p className="mt-2 text-xs text-muted-foreground">Priority: {cat.priority} · BV Boost: +{cat.businessValueBoost}</p>
        </div>
        <button
          onClick={() => onToggle(cat.slug, !cat.enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${cat.enabled ? "bg-emerald-500" : "bg-muted"}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${cat.enabled ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>

      <p className="text-xs font-medium text-foreground/70 mb-1">Seed Queries ({cat.seedQueries.length})</p>
      <div className="flex flex-wrap gap-1 mb-3">
        {cat.seedQueries.slice(0, 4).map((q) => (
          <span key={q} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{q}</span>
        ))}
        {cat.seedQueries.length > 4 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">+{cat.seedQueries.length - 4} more</span>
        )}
      </div>

      <p className="text-xs font-medium text-foreground/70 mb-1">Subreddits</p>
      <div className="flex flex-wrap gap-1">
        {cat.subreddits.map((s) => (
          <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">r/{s}</span>
        ))}
      </div>

      <p className="text-xs font-medium text-foreground/70 mt-3 mb-1">Detection Keywords ({cat.keywords.length})</p>
      <p className="text-[10px] text-muted-foreground line-clamp-2">{cat.keywords.slice(0, 10).join(", ")}{cat.keywords.length > 10 ? ` +${cat.keywords.length - 10} more` : ""}</p>
    </div>
  );
}

export default function CategoriesPage() {
  const [config, setConfig] = useState<CategoryConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/categories");
    const json = await res.json();
    if (json.config) setConfig(json.config);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleToggle(slug: string, enabled: boolean) {
    setSaving(slug);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, enabled }),
    });
    const json = await res.json();
    if (json.success) {
      setConfig((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          categories: prev.categories.map((c) => c.slug === slug ? { ...c, enabled } : c),
        };
      });
      setMessage({ text: json.message, type: "success" });
    } else {
      setMessage({ text: json.error ?? "Failed to update", type: "error" });
    }
    setSaving(null);
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleSeedDefaults() {
    setSaving("seed");
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "seed" }),
    });
    const json = await res.json();
    setMessage({ text: json.message ?? json.error, type: json.success ? "success" : "error" });
    if (json.success) await load();
    setSaving(null);
    setTimeout(() => setMessage(null), 3000);
  }

  const activeCount = config?.categories.filter((c) => c.enabled).length ?? 0;
  const totalCount = config?.categories.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Category Configuration</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enable or disable categories to control Demand Discovery scope. No code changes required.
          </p>
        </div>
        <button
          onClick={handleSeedDefaults}
          disabled={saving === "seed"}
          className="rounded-xl border border-border/60 bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
        >
          {saving === "seed" ? "Seeding…" : "Reset to V1 Defaults"}
        </button>
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {message.text}
        </div>
      )}

      <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background px-5 py-4">
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{activeCount} of {totalCount} categories active</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Only active categories receive keywords from Demand Discovery. Out-of-scope keywords go to Backlog automatically.
          </p>
        </div>
        <div className="h-2 w-48 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${totalCount ? (activeCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">Loading category config…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {config?.categories.map((cat) => (
            <div key={cat.slug} className="relative">
              {saving === cat.slug && (
                <div className="absolute inset-0 z-10 rounded-2xl bg-background/70 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Saving…</span>
                </div>
              )}
              <CategoryCard cat={cat} onToggle={handleToggle} />
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-border/60 bg-muted/20 px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">How Category Scoping Works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <div><span className="font-medium text-foreground">Active category</span> — Keywords in scope get a +100 categoryFit score, boosting their Final Decision Score.</div>
          <div><span className="font-medium text-foreground">Out-of-scope keyword</span> — Gets categoryFit = 0 and is sent to Backlog for future review. NOT permanently rejected.</div>
          <div><span className="font-medium text-foreground">Enable new category</span> — Toggle it on here. All backlogged keywords matching it will be reconsidered next pipeline run.</div>
        </div>
      </div>

      {config && (
        <p className="text-xs text-muted-foreground text-right">
          Config v{config.version} · Last updated: {new Date(config.updatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
