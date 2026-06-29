"use client";

interface Bar {
  label: string;
  value: number;
  color?: string;
}

export function SimpleBarChart({ data, max }: { data: Bar[]; max?: number }) {
  const ceiling = max ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((bar) => (
        <div key={bar.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-xs text-muted-foreground truncate">{bar.label}</span>
          <div className="flex-1 h-2 rounded-full bg-accent overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${Math.min(100, (bar.value / ceiling) * 100)}%`, backgroundColor: bar.color }}
            />
          </div>
          <span className="w-8 text-right text-xs font-medium text-foreground">{bar.value}</span>
        </div>
      ))}
    </div>
  );
}
