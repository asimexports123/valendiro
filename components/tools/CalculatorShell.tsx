import type { ReactNode } from "react";

export interface CalculatorResultProps {
  label: string;
  value: string;
  highlight?: boolean;
}

export function CalculatorResultsGrid({ items }: { items: CalculatorResultProps[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
      {items.map((item) => (
        <div
          key={item.label}
          className={
            item.highlight
              ? "rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 p-4"
              : "rounded-xl bg-muted/50 border border-border/40 p-4"
          }
        >
          <p
            className={`text-xs font-medium uppercase tracking-wide ${
              item.highlight
                ? "text-emerald-700/80 dark:text-emerald-300/80"
                : "text-muted-foreground"
            }`}
          >
            {item.label}
          </p>
          <p
            className={`mt-1 font-bold ${
              item.highlight
                ? "text-2xl text-emerald-700 dark:text-emerald-300"
                : "text-xl text-foreground"
            } ${item.highlight ? "" : ""}`}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Standard shell for typing-first calculator tools (SIP uses its own widget). */
export function CalculatorToolShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
      <div className="border-b border-border/50 bg-muted/30 px-6 py-4">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      <div className="p-6 space-y-6">{children}</div>
    </div>
  );
}
