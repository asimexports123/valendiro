"use client";

import { useMemo, useState } from "react";
import { CalculatorCurrencyDropdown, currencyInputPrefix } from "@/components/tools/CalculatorCurrencyDropdown";
import { CalculatorNumberField } from "@/components/tools/CalculatorNumberField";
import { CalculatorResultsGrid, CalculatorToolShell } from "@/components/tools/CalculatorShell";
import { formatCalculatorCurrency, type CalculatorCurrencyCode } from "@/lib/tools/currency";
import { calculateRetirement401k } from "@/lib/tools/retirement401kMath";

export function Retirement401kWidget() {
  const [currency, setCurrency] = useState<CalculatorCurrencyCode>("USD");
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [employerMatchPercent, setEmployerMatchPercent] = useState(50);
  const [yearsToRetire, setYearsToRetire] = useState(25);
  const [annualReturn, setAnnualReturn] = useState(7);

  const result = useMemo(
    () =>
      calculateRetirement401k({
        monthlyContribution,
        employerMatchPercent,
        yearsToRetire,
        annualReturnPercent: annualReturn,
      }),
    [monthlyContribution, employerMatchPercent, yearsToRetire, annualReturn]
  );

  const fmt = (n: number) => formatCalculatorCurrency(n, currency);

  return (
    <CalculatorToolShell
      title="401(k) Retirement Calculator"
      subtitle="Type your monthly contribution, employer match, and timeline — see projected balance at retirement"
    >
      <CalculatorCurrencyDropdown value={currency} onChange={setCurrency} />

      <CalculatorNumberField
        label="Monthly contribution (your deferral)"
        prefix={currencyInputPrefix(currency)}
        value={monthlyContribution}
        onChange={setMonthlyContribution}
        min={0}
        step={50}
        placeholder="e.g. 500"
        presets={[
          { label: "$300", value: 300 },
          { label: "$500", value: 500 },
          { label: "$1,000", value: 1000 },
        ]}
      />

      <CalculatorNumberField
        label="Employer match"
        suffix="% of your contribution"
        value={employerMatchPercent}
        onChange={setEmployerMatchPercent}
        min={0}
        max={100}
        step={5}
        placeholder="e.g. 50"
        hint="Common US plans match 50–100% up to a cap. Enter 0 if no match."
      />

      <CalculatorNumberField
        label="Years until retirement"
        suffix="years"
        value={yearsToRetire}
        onChange={setYearsToRetire}
        min={1}
        max={50}
        step={1}
        placeholder="e.g. 25"
      />

      <CalculatorNumberField
        label="Expected annual return"
        suffix="%"
        value={annualReturn}
        onChange={setAnnualReturn}
        min={0}
        max={15}
        step={0.5}
        placeholder="e.g. 7"
        hint="Historical US stock-market averages are often cited around 7–10% before inflation."
      />

      <CalculatorResultsGrid
        items={[
          { label: "Your contributions", value: fmt(result.totalEmployeeContributions) },
          { label: "Employer match", value: fmt(result.totalEmployerMatch) },
          { label: "Projected balance", value: fmt(result.projectedBalance), highlight: true },
        ]}
      />
    </CalculatorToolShell>
  );
}
