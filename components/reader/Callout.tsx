import { ReactNode } from "react";

export type CalloutVariant =
  | "definition"
  | "important"
  | "warning"
  | "tip"
  | "example"
  | "did-you-know"
  | "best-practice"
  | "common-mistake"
  | "summary"
  | "note"
  | "info";

const VARIANTS: Record<
  CalloutVariant,
  { label: string; icon: string; border: string; bg: string; labelColor: string }
> = {
  definition: {
    label: "Definition",
    icon: "📖",
    border: "border-blue-200/80 dark:border-blue-800/60",
    bg: "bg-blue-50/80 dark:bg-blue-950/25",
    labelColor: "text-blue-700 dark:text-blue-300",
  },
  important: {
    label: "Important",
    icon: "❗",
    border: "border-red-200/80 dark:border-red-800/60",
    bg: "bg-red-50/80 dark:bg-red-950/25",
    labelColor: "text-red-700 dark:text-red-300",
  },
  warning: {
    label: "Warning",
    icon: "⚠️",
    border: "border-amber-200/80 dark:border-amber-800/60",
    bg: "bg-amber-50/80 dark:bg-amber-950/25",
    labelColor: "text-amber-700 dark:text-amber-300",
  },
  tip: {
    label: "Tip",
    icon: "💡",
    border: "border-emerald-200/80 dark:border-emerald-800/60",
    bg: "bg-emerald-50/80 dark:bg-emerald-950/25",
    labelColor: "text-emerald-700 dark:text-emerald-300",
  },
  example: {
    label: "Example",
    icon: "🔍",
    border: "border-violet-200/80 dark:border-violet-800/60",
    bg: "bg-violet-50/80 dark:bg-violet-950/25",
    labelColor: "text-violet-700 dark:text-violet-300",
  },
  "did-you-know": {
    label: "Did you know?",
    icon: "🧠",
    border: "border-indigo-200/80 dark:border-indigo-800/60",
    bg: "bg-indigo-50/80 dark:bg-indigo-950/25",
    labelColor: "text-indigo-700 dark:text-indigo-300",
  },
  "best-practice": {
    label: "Best Practice",
    icon: "✓",
    border: "border-teal-200/80 dark:border-teal-800/60",
    bg: "bg-teal-50/80 dark:bg-teal-950/25",
    labelColor: "text-teal-700 dark:text-teal-300",
  },
  "common-mistake": {
    label: "Common Mistake",
    icon: "✗",
    border: "border-orange-200/80 dark:border-orange-800/60",
    bg: "bg-orange-50/80 dark:bg-orange-950/25",
    labelColor: "text-orange-700 dark:text-orange-300",
  },
  summary: {
    label: "Summary",
    icon: "📋",
    border: "border-slate-200/80 dark:border-slate-700/60",
    bg: "bg-slate-50/80 dark:bg-slate-900/40",
    labelColor: "text-slate-700 dark:text-slate-300",
  },
  note: {
    label: "Note",
    icon: "📝",
    border: "border-border/60",
    bg: "bg-muted/40",
    labelColor: "text-muted-foreground",
  },
  info: {
    label: "Info",
    icon: "ℹ️",
    border: "border-sky-200/80 dark:border-sky-800/60",
    bg: "bg-sky-50/80 dark:bg-sky-950/25",
    labelColor: "text-sky-700 dark:text-sky-300",
  },
};

/** Map GFM admonition tags and blockquote labels to callout variants. */
export function resolveCalloutVariant(raw: string): CalloutVariant | null {
  const tag = raw.toUpperCase().replace(/[\s-]+/g, "_");
  const map: Record<string, CalloutVariant> = {
    NOTE: "note",
    INFO: "info",
    TIP: "tip",
    WARNING: "warning",
    DANGER: "important",
    IMPORTANT: "important",
    DEFINITION: "definition",
    EXAMPLE: "example",
    DID_YOU_KNOW: "did-you-know",
    BEST_PRACTICE: "best-practice",
    COMMON_MISTAKE: "common-mistake",
    SUMMARY: "summary",
  };
  return map[tag] ?? null;
}

/** Parse blockquote labels like "**Best Practice:** content" */
export function parseLabeledCallout(text: string): { variant: CalloutVariant; content: string } | null {
  const match = text.match(/^\*\*(Definition|Important|Warning|Tip|Example|Did you know\??|Best Practice|Common Mistake|Summary|Note|Info):\*\*\s*([\s\S]*)/i);
  if (!match) return null;
  const labelMap: Record<string, CalloutVariant> = {
    definition: "definition",
    important: "important",
    warning: "warning",
    tip: "tip",
    example: "example",
    "did you know": "did-you-know",
    "did you know?": "did-you-know",
    "best practice": "best-practice",
    "common mistake": "common-mistake",
    summary: "summary",
    note: "note",
    info: "info",
  };
  const key = match[1].toLowerCase();
  const variant = labelMap[key];
  if (!variant) return null;
  return { variant, content: match[2].trim() };
}

interface CalloutProps {
  variant: CalloutVariant;
  children: ReactNode;
  title?: string;
}

export function Callout({ variant, children, title }: CalloutProps) {
  const style = VARIANTS[variant];
  return (
    <aside
      role="note"
      className={`my-8 rounded-xl border ${style.border} ${style.bg} p-5 sm:p-6 not-prose`}
    >
      <div className={`flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider ${style.labelColor}`}>
        <span aria-hidden className="text-sm">{style.icon}</span>
        {title ?? style.label}
      </div>
      <div className="text-[0.9375rem] leading-relaxed text-foreground/85 [&>p]:my-2 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
        {children}
      </div>
    </aside>
  );
}
