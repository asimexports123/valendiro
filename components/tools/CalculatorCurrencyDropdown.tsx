"use client";

import { useId } from "react";
import {
  CALCULATOR_CURRENCIES,
  type CalculatorCurrencyCode,
  getCurrencyMeta,
} from "@/lib/tools/currency";

export function CalculatorCurrencyDropdown({
  id,
  label = "Currency",
  value,
  onChange,
}: {
  id?: string;
  label?: string;
  value: CalculatorCurrencyCode;
  onChange: (code: CalculatorCurrencyCode) => void;
}) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const selected = getCurrencyMeta(value);

  return (
    <div>
      <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative mt-2">
        <select
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value as CalculatorCurrencyCode)}
          className="w-full appearance-none rounded-xl border border-border/60 bg-background px-4 py-3 pr-10 text-base font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {CALCULATOR_CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.symbol} — {c.label} ({c.code})
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
          ▾
        </span>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        Amounts shown in {selected.label} ({selected.code})
      </p>
    </div>
  );
}

/** Prefix for amount inputs based on selected currency */
export function currencyInputPrefix(code: CalculatorCurrencyCode): string {
  return getCurrencyMeta(code).symbol;
}
