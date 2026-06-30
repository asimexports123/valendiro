"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AutomationConfig } from "@/services/system/settings";

const V1_CATEGORIES = [
  { slug: "technology",       label: "💻 Technology" },
  { slug: "personal-finance", label: "💰 Personal Finance" },
  { slug: "business",         label: "📈 Business" },
  { slug: "education",        label: "🎓 Education" },
  { slug: "health-wellness",  label: "🌿 Health & Wellness" },
  { slug: "home-lifestyle",   label: "🏠 Home & Lifestyle" },
  { slug: "travel",           label: "✈️ Travel" },
];

interface Props {
  config: AutomationConfig;
}

export function SettingsForm({ config }: Props) {
  const router = useRouter();
  const [automationEnabled, setAutomationEnabled] = useState(config.automationEnabled);
  const [publishLimit, setPublishLimit] = useState(config.publishLimitPerRun);
  const activeSlug = new Set(config.activeCategories.map((c) => c.slug));
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(activeSlug);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleCategory(slug: string) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) { next.delete(slug); } else { next.add(slug); }
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: automationEnabled ? "resume_automation" : "pause_automation" }),
      });
      await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_config",
          publishLimitPerRun: publishLimit,
          enabledSlugs: Array.from(selectedCategories),
        }),
      });
      setSaved(true);
      setTimeout(() => { router.refresh(); setSaved(false); }, 1500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">

      {/* Publishing ON/OFF */}
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Publishing</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {automationEnabled ? "AI is actively publishing new content." : "Publishing is paused. No new content will be published."}
            </p>
          </div>
          <button
            onClick={() => setAutomationEnabled(!automationEnabled)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${automationEnabled ? "bg-emerald-500" : "bg-muted-foreground/30"}`}
            role="switch"
            aria-checked={automationEnabled}
          >
            <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${automationEnabled ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>
      </div>

      {/* Daily publish limit */}
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="font-semibold text-foreground mb-1">Daily Publishing Limit</h2>
        <p className="text-sm text-muted-foreground mb-4">Maximum number of articles published per day.</p>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={1}
            max={50}
            value={publishLimit}
            onChange={(e) => setPublishLimit(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="w-10 text-center font-bold text-foreground tabular-nums">{publishLimit}</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>1 / day</span>
          <span>50 / day</span>
        </div>
      </div>

      {/* Active categories */}
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="font-semibold text-foreground mb-1">Active Categories</h2>
        <p className="text-sm text-muted-foreground mb-4">AI will only publish content in selected categories.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {V1_CATEGORIES.map((cat) => {
            const active = selectedCategories.has(cat.slug);
            return (
              <button
                key={cat.slug}
                onClick={() => toggleCategory(cat.slug)}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium text-left transition-all ${active ? "border-primary/40 bg-primary/8 text-foreground" : "border-border/60 bg-muted/20 text-muted-foreground hover:border-primary/20"}`}
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${active ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
                  {active && <span className="block h-2 w-2 rounded-full bg-white" />}
                </span>
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3 justify-end">
        {saved && <span className="text-sm text-emerald-600 font-medium">✅ Saved!</span>}
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>

    </div>
  );
}
