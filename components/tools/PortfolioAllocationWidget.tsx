"use client";

import { useMemo, useState } from "react";
import { CalculatorCurrencyDropdown, currencyInputPrefix } from "@/components/tools/CalculatorCurrencyDropdown";
import { CalculatorNumberField } from "@/components/tools/CalculatorNumberField";
import { CalculatorResultsGrid, CalculatorToolShell } from "@/components/tools/CalculatorShell";
import { formatCalculatorCurrency, type CalculatorCurrencyCode } from "@/lib/tools/currency";
import { calculatePortfolioAllocation } from "@/lib/tools/portfolioAllocationMath";

export function PortfolioAllocationWidget() {
  const [currency, setCurrency] = useState<CalculatorCurrencyCode>("USD");
  const [portfolioValue, setPortfolioValue] = useState(100000);
  const [positionValue, setPositionValue] = useState(15000);
  const [targetAllocation, setTargetAllocation] = useState(60);

  const result = useMemo(
    () =>
      calculatePortfolioAllocation({
        portfolioValue,
        positionValue,
        targetAllocationPercent: targetAllocation,
      }),
    [portfolioValue, positionValue, targetAllocation]
  );

  const fmt = (n: number) => formatCalculatorCurrency(n, currency);
  const actionLabel =
    result.action === "buy"
      ? `Buy ${fmt(Math.abs(result.cashToTarget))}`
      : result.action === "sell"
        ? `Sell ${fmt(Math.abs(result.cashToTarget))}`
        : "On target";

  return (
    <CalculatorToolShell
      title="Portfolio Allocation Calculator"
      subtitle="See current allocation % and how much to buy or sell to hit your target"
    >
      <CalculatorCurrencyDropdown value={currency} onChange={setCurrency} />

      <CalculatorNumberField
        label="Total portfolio value"
        prefix={currencyInputPrefix(currency)}
        value={portfolioValue}
        onChange={setPortfolioValue}
        min={0}
        step={5000}
        placeholder="e.g. 100000"
      />

      <CalculatorNumberField
        label="Position value (this holding)"
        prefix={currencyInputPrefix(currency)}
        value={positionValue}
        onChange={setPositionValue}
        min={0}
        step={500}
        placeholder="e.g. 15000"
      />

      <CalculatorNumberField
        label="Target allocation"
        suffix="%"
        value={targetAllocation}
        onChange={setTargetAllocation}
        min={0}
        max={100}
        step={1}
        placeholder="e.g. 60"
        hint="Common targets: 60/40 stocks/bonds, or 100% stocks for young investors."
      />

      <CalculatorResultsGrid
        items={[
          { label: "Current allocation", value: `${result.currentAllocationPercent.toFixed(1)}%` },
          { label: "Target position value", value: fmt(result.targetPositionValue) },
          { label: "Rebalance action", value: actionLabel, highlight: true },
        ]}
      />
    </CalculatorToolShell>
  );
}
