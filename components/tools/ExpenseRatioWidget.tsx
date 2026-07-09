"use client";

import { useMemo, useState } from "react";
import { CalculatorCurrencyDropdown, currencyInputPrefix } from "@/components/tools/CalculatorCurrencyDropdown";
import { CalculatorNumberField } from "@/components/tools/CalculatorNumberField";
import { CalculatorResultsGrid, CalculatorToolShell } from "@/components/tools/CalculatorShell";
import { formatCalculatorCurrency, type CalculatorCurrencyCode } from "@/lib/tools/currency";
import { calculateExpenseRatio } from "@/lib/tools/expenseRatioMath";

export function ExpenseRatioWidget() {
  const [currency, setCurrency] = useState<CalculatorCurrencyCode>("USD");
  const [investmentAmount, setInvestmentAmount] = useState(50000);
  const [years, setYears] = useState(20);
  const [grossReturn, setGrossReturn] = useState(8);
  const [expenseRatioA, setExpenseRatioA] = useState(0.03);
  const [expenseRatioB, setExpenseRatioB] = useState(0.75);

  const result = useMemo(
    () =>
      calculateExpenseRatio({
        investmentAmount,
        years,
        grossReturnPercent: grossReturn,
        expenseRatioA,
        expenseRatioB,
      }),
    [investmentAmount, years, grossReturn, expenseRatioA, expenseRatioB]
  );

  const fmt = (n: number) => formatCalculatorCurrency(n, currency);

  return (
    <CalculatorToolShell
      title="Expense Ratio Calculator"
      subtitle="Compare two mutual funds or ETFs — see how fees compound over time"
    >
      <CalculatorCurrencyDropdown value={currency} onChange={setCurrency} />

      <CalculatorNumberField
        label="Investment amount"
        prefix={currencyInputPrefix(currency)}
        value={investmentAmount}
        onChange={setInvestmentAmount}
        min={0}
        step={5000}
        placeholder="e.g. 50000"
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

      <CalculatorNumberField
        label="Gross return (before fees)"
        suffix="%"
        value={grossReturn}
        onChange={setGrossReturn}
        min={0}
        max={20}
        step={0.5}
        placeholder="e.g. 8"
      />

      <CalculatorNumberField
        label="Fund A expense ratio"
        suffix="%"
        value={expenseRatioA}
        onChange={setExpenseRatioA}
        min={0}
        max={3}
        step={0.01}
        placeholder="e.g. 0.03"
        hint="Low-cost index funds often charge 0.03–0.10%."
      />

      <CalculatorNumberField
        label="Fund B expense ratio"
        suffix="%"
        value={expenseRatioB}
        onChange={setExpenseRatioB}
        min={0}
        max={3}
        step={0.01}
        placeholder="e.g. 0.75"
        hint="Actively managed funds often charge 0.50–1.50%."
      />

      <CalculatorResultsGrid
        items={[
          { label: `Fund A (${expenseRatioA}% ER)`, value: fmt(result.fundA.futureValue) },
          { label: `Fund B (${expenseRatioB}% ER)`, value: fmt(result.fundB.futureValue) },
          { label: "Extra cost of Fund B", value: fmt(result.feeDifference), highlight: true },
        ]}
      />
    </CalculatorToolShell>
  );
}
