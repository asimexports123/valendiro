"use client";

import { useMemo, useState } from "react";
import { calculateSip, formatCurrency } from "@/lib/tools/sipMath";

const PRESETS = [
  { label: "₹5,000/mo", amount: 5000 },
  { label: "₹10,000/mo", amount: 10000 },
  { label: "₹25,000/mo", amount: 25000 },
];

export function SipCalculatorWidget() {
  const [monthly, setMonthly] = useState(10000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(12);
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");

  const result = useMemo(
    () =>
      calculateSip({
        monthlyInvestment: monthly,
        annualReturnPercent: rate,
        years,
      }),
    [monthly, rate, years]
  );

  const fmt = (n: number) => formatCurrency(n, currency);

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
      <div className="border-b border-border/50 bg-emerald-50/80 dark:bg-emerald-950/30 px-6 py-4">
        <h2 className="text-lg font-bold text-foreground">SIP Calculator</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Adjust inputs to see estimated maturity value
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex gap-2">
          {(["INR", "USD"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                currency === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="sip-monthly" className="text-sm font-medium text-foreground">
            Monthly investment
          </label>
          <input
            id="sip-monthly"
            type="number"
            min={500}
            max={1000000}
            step={500}
            value={monthly}
            onChange={(e) => setMonthly(Number(e.target.value) || 0)}
            className="mt-2 w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-lg font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.amount}
                type="button"
                onClick={() => setMonthly(p.amount)}
                className="rounded-full border border-border/50 px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="sip-years" className="text-sm font-medium text-foreground">
              Time period
            </label>
            <span className="text-sm font-bold text-primary">{years} years</span>
          </div>
          <input
            id="sip-years"
            type="range"
            min={1}
            max={40}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="mt-3 w-full accent-primary"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="sip-rate" className="text-sm font-medium text-foreground">
              Expected annual return
            </label>
            <span className="text-sm font-bold text-primary">{rate}%</span>
          </div>
          <input
            id="sip-rate"
            type="range"
            min={4}
            max={20}
            step={0.5}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="mt-3 w-full accent-primary"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Equity mutual funds historically vary widely; this is an illustration only.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="rounded-xl bg-muted/50 border border-border/40 p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total invested
            </p>
            <p className="mt-1 text-xl font-bold text-foreground">{fmt(result.totalInvested)}</p>
          </div>
          <div className="rounded-xl bg-muted/50 border border-border/40 p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Est. returns
            </p>
            <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {fmt(result.estimatedReturns)}
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 p-4 sm:col-span-1">
            <p className="text-xs font-medium text-emerald-700/80 dark:text-emerald-300/80 uppercase tracking-wide">
              Maturity value
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {fmt(result.maturityAmount)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
