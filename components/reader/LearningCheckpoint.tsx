"use client";

import { useState } from "react";

interface LearningCheckpointProps {
  items: string[];
}

export function LearningCheckpoint({ items }: LearningCheckpointProps) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  if (items.length === 0) return null;

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <section aria-label="Learning checkpoint" className="my-12 not-prose">
      <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-6 sm:p-8">
        <h3 className="text-base font-bold text-foreground mb-1">Learning checkpoint</h3>
        <p className="text-sm text-muted-foreground mb-5">Check each item once you can explain it in your own words.</p>
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li key={i}>
              <label className="flex cursor-pointer items-start gap-3 group">
                <input
                  type="checkbox"
                  checked={checked.has(i)}
                  onChange={() => toggle(i)}
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                />
                <span className={`text-sm leading-relaxed transition-colors ${checked.has(i) ? "text-muted-foreground line-through" : "text-foreground/85 group-hover:text-foreground"}`}>
                  {item}
                </span>
              </label>
            </li>
          ))}
        </ul>
        {checked.size === items.length && (
          <p className="mt-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            ✓ All checkpoints complete — ready for the next topic.
          </p>
        )}
      </div>
    </section>
  );
}
