"use client";

import { useId } from "react";

export interface CalculatorNumberFieldProps {
  id?: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  /** Shown inside the input on the right, e.g. "%", "years", "/mo" */
  suffix?: string;
  /** Shown before the input, e.g. "₹", "$" */
  prefix?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  hint?: string;
  /** Quick-fill chips below the input */
  presets?: Array<{ label: string; value: number }>;
}

export function CalculatorNumberField({
  id,
  label,
  value,
  onChange,
  suffix,
  prefix,
  min,
  max,
  step = 1,
  placeholder,
  hint,
  presets,
}: CalculatorNumberFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <div>
      <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative mt-2">
        {prefix && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
            {prefix}
          </span>
        )}
        <input
          id={fieldId}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : ""}
          placeholder={placeholder}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              onChange(0);
              return;
            }
            const next = Number(raw);
            if (!Number.isFinite(next)) return;
            let clamped = next;
            if (min !== undefined) clamped = Math.max(min, clamped);
            if (max !== undefined) clamped = Math.min(max, clamped);
            onChange(clamped);
          }}
          className={`w-full rounded-xl border border-border/60 bg-background py-3 text-lg font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 ${
            prefix ? "pl-10 pr-4" : "px-4"
          } ${suffix ? "pr-16" : ""}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
      {presets && presets.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange(p.value)}
              className="rounded-full border border-border/50 px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
