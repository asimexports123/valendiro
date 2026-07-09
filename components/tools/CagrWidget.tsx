"use client";

import { useMemo, useState } from "react";
import { CalculatorCurrencyDropdown, currencyInputPrefix } from "@/components/tools/CalculatorCurrencyDropdown";
import { CalculatorNumberField } from "@/components/tools/CalculatorNumberField";
import { CalculatorResultsGrid, CalculatorToolShell } from "@/components/tools/CalculatorShell";
import { formatCalculatorCurrency, type CalculatorCurrencyCode } from "@/lib/tools/currency";
import { calculateCagr } from "@/lib/tools/cagrMath";

export function CagrWidget() {
  const [currency, setCurrency] = useState<CalculatorCurrencyCode>("USD");
  const [beginningValue, setBeginningValue] = useState(10000);
  const [endingValue, setEndingValue] = useState(25000);
  const [years, setYears] = useState(10);

  const result = useMemo(
    () => calculateCagr({ beginningValue, endingValue, years }),
    [beginningValue, endingValue, years]
  );

  const fmt = (n: number) => formatCalculatorCurrency(n, currency);

  return (
    <CalculatorToolShell
      title="CAGR Calculator"
      subtitle="Type beginning value, ending value, and years — get compound annual growth rate"
    >
      <CalculatorCurrencyDropdown value={currency} onChange={setCurrency} />

      <CalculatorNumberField
        label="Beginning value"
        prefix={currencyInputPrefix(currency)}
        value={beginningValue}
        onChange={setBeginningValue}
        min={0}
        step={1000}
        placeholder="e.g. 10000"
      />

      <CalculatorNumberField
        label="Ending value"
        prefix={currencyInputPrefix(currency)}
        value={endingValue}
        onChange={setEndingValue}
        min={0}
        step={1000}
        placeholder="e.g. 25000"
      />

      <CalculatorNumberField
        label="Time period"
        suffix="years"
        value={years}
        onChange={setYears}
        min={1}
        max={50}
        step={1}
        placeholder="e.g. 10"
      />

      <CalculatorResultsGrid
        items={[
          { label: "CAGR", value: `${result.cagrPercent.toFixed(2)}%`, highlight: true },
          { label: "Total growth", value: `${result.totalGrowthPercent.toFixed(1)}%` },
          { label: "Absolute gain", value: fmt(result.absoluteGrowth) },
        ]}
      />
    </CalculatorToolShell>
  );
}
