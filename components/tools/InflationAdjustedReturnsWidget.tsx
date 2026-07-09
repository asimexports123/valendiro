"use client";

import { useMemo, useState } from "react";
import { CalculatorCurrencyDropdown, currencyInputPrefix } from "@/components/tools/CalculatorCurrencyDropdown";
import { CalculatorNumberField } from "@/components/tools/CalculatorNumberField";
import { CalculatorResultsGrid, CalculatorToolShell } from "@/components/tools/CalculatorShell";
import { formatCalculatorCurrency, type CalculatorCurrencyCode } from "@/lib/tools/currency";
import { calculateInflationAdjustedReturns } from "@/lib/tools/inflationAdjustedReturnsMath";

export function InflationAdjustedReturnsWidget() {
  const [currency, setCurrency] = useState<CalculatorCurrencyCode>("USD");
  const [principal, setPrincipal] = useState(10000);
  const [nominalReturn, setNominalReturn] = useState(8);
  const [inflation, setInflation] = useState(3);
  const [years, setYears] = useState(20);

  const result = useMemo(
    () =>
      calculateInflationAdjustedReturns({
        principal,
        nominalReturnPercent: nominalReturn,
        inflationPercent: inflation,
        years,
      }),
    [principal, nominalReturn, inflation, years]
  );

  const fmt = (n: number) => formatCalculatorCurrency(n, currency);

  return (
    <CalculatorToolShell
      title="Inflation-Adjusted Returns Calculator"
      subtitle="See how inflation erodes nominal gains — results in today's purchasing power"
    >
      <CalculatorCurrencyDropdown value={currency} onChange={setCurrency} />

      <CalculatorNumberField
        label="Initial investment"
        prefix={currencyInputPrefix(currency)}
        value={principal}
        onChange={setPrincipal}
        min={0}
        step={1000}
        placeholder="e.g. 10000"
      />

      <CalculatorNumberField
        label="Nominal annual return"
        suffix="%"
        value={nominalReturn}
        onChange={setNominalReturn}
        min={0}
        max={20}
        step={0.5}
        placeholder="e.g. 8"
      />

      <CalculatorNumberField
        label="Expected inflation rate"
        suffix="%"
        value={inflation}
        onChange={setInflation}
        min={0}
        max={15}
        step={0.5}
        placeholder="e.g. 3"
        hint="US long-term inflation has averaged roughly 2–3%."
      />

      <CalculatorNumberField
        label="Investment period"
        suffix="years"
        value={years}
        onChange={setYears}
        min={1}
        max={50}
        step={1}
        placeholder="e.g. 20"
      />

      <CalculatorResultsGrid
        items={[
          { label: "Nominal future value", value: fmt(result.nominalFutureValue) },
          { label: "Real value (today's $)", value: fmt(result.realFutureValue), highlight: true },
          { label: "Real return (annualized)", value: `${result.realReturnPercent.toFixed(2)}%` },
        ]}
      />
    </CalculatorToolShell>
  );
}
