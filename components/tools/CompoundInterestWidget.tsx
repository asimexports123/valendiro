"use client";

import { useMemo, useState } from "react";
import { CalculatorCurrencyDropdown, currencyInputPrefix } from "@/components/tools/CalculatorCurrencyDropdown";
import { CalculatorNumberField } from "@/components/tools/CalculatorNumberField";
import { CalculatorResultsGrid, CalculatorToolShell } from "@/components/tools/CalculatorShell";
import { calculateCompoundInterest } from "@/lib/tools/compoundInterestMath";
import { formatCalculatorCurrency, type CalculatorCurrencyCode } from "@/lib/tools/currency";

export function CompoundInterestWidget() {
  const [currency, setCurrency] = useState<CalculatorCurrencyCode>("USD");
  const [principal, setPrincipal] = useState(10000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(8);

  const result = useMemo(
    () =>
      calculateCompoundInterest({
        principal,
        annualReturnPercent: rate,
        years,
        compoundsPerYear: 12,
      }),
    [principal, rate, years]
  );

  const fmt = (n: number) => formatCalculatorCurrency(n, currency);

  return (
    <CalculatorToolShell
      title="Compound Interest Calculator"
      subtitle="Type your numbers — results update as you go"
    >
      <CalculatorCurrencyDropdown value={currency} onChange={setCurrency} />

      <CalculatorNumberField
        label="Initial investment (principal)"
        prefix={currencyInputPrefix(currency)}
        value={principal}
        onChange={setPrincipal}
        min={0}
        step={100}
        placeholder="e.g. 10000"
        presets={[
          { label: "5,000", value: 5000 },
          { label: "10,000", value: 10000 },
          { label: "50,000", value: 50000 },
        ]}
      />

      <CalculatorNumberField
        label="Annual return rate"
        suffix="%"
        value={rate}
        onChange={setRate}
        min={0}
        max={30}
        step={0.5}
        placeholder="e.g. 8"
        hint="Historical stock-market averages vary; this is an illustration only."
      />

      <CalculatorNumberField
        label="Investment period"
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
          { label: "Principal", value: fmt(result.principal) },
          { label: "Interest earned", value: fmt(result.totalInterest) },
          { label: "Future value", value: fmt(result.futureValue), highlight: true },
        ]}
      />
    </CalculatorToolShell>
  );
}
