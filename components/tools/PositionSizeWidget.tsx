"use client";

import { useMemo, useState } from "react";
import { CalculatorCurrencyDropdown, currencyInputPrefix } from "@/components/tools/CalculatorCurrencyDropdown";
import { CalculatorNumberField } from "@/components/tools/CalculatorNumberField";
import { CalculatorResultsGrid, CalculatorToolShell } from "@/components/tools/CalculatorShell";
import { formatCalculatorCurrency, type CalculatorCurrencyCode } from "@/lib/tools/currency";
import { calculatePositionSize } from "@/lib/tools/positionSizeMath";

export function PositionSizeWidget() {
  const [currency, setCurrency] = useState<CalculatorCurrencyCode>("USD");
  const [portfolio, setPortfolio] = useState(50000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [entry, setEntry] = useState(100);
  const [stop, setStop] = useState(92);

  const result = useMemo(
    () =>
      calculatePositionSize({
        portfolioValue: portfolio,
        riskPercent,
        entryPrice: entry,
        stopLossPrice: stop,
      }),
    [portfolio, riskPercent, entry, stop]
  );

  const fmt = (n: number) => formatCalculatorCurrency(n, currency);

  return (
    <CalculatorToolShell
      title="Stock Position Size Calculator"
      subtitle="Type portfolio, risk %, entry and stop — see how many shares to buy"
    >
      <CalculatorCurrencyDropdown value={currency} onChange={setCurrency} />

      <CalculatorNumberField
        label="Portfolio value"
        prefix={currencyInputPrefix(currency)}
        value={portfolio}
        onChange={setPortfolio}
        min={0}
        step={500}
        placeholder="e.g. 50000"
      />

      <CalculatorNumberField
        label="Risk per trade"
        suffix="% of portfolio"
        value={riskPercent}
        onChange={setRiskPercent}
        min={0.1}
        max={10}
        step={0.1}
        placeholder="e.g. 1"
        hint="Many traders risk 0.5–2% per position. Never risk more than you can afford to lose."
      />

      <CalculatorNumberField
        label="Entry price per share"
        prefix={currencyInputPrefix(currency)}
        value={entry}
        onChange={setEntry}
        min={0.01}
        step={0.01}
        placeholder="e.g. 100"
      />

      <CalculatorNumberField
        label="Stop-loss price"
        prefix={currencyInputPrefix(currency)}
        value={stop}
        onChange={setStop}
        min={0.01}
        step={0.01}
        placeholder="e.g. 92"
      />

      <CalculatorResultsGrid
        items={[
          { label: "Amount at risk", value: fmt(result.riskAmount) },
          { label: "Shares to buy", value: result.shares > 0 ? String(result.shares) : "—" },
          { label: "Position value", value: fmt(result.positionValue), highlight: true },
        ]}
      />
    </CalculatorToolShell>
  );
}
