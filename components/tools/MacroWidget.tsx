"use client";

import { useId, useMemo, useState } from "react";
import { CalculatorNumberField } from "@/components/tools/CalculatorNumberField";
import { CalculatorResultsGrid, CalculatorToolShell } from "@/components/tools/CalculatorShell";
import { calculateMacros, MACRO_GOAL_LABELS, type MacroGoal } from "@/lib/tools/macroMath";

export function MacroWidget() {
  const [dailyCalories, setDailyCalories] = useState(2200);
  const [goal, setGoal] = useState<MacroGoal>("maintain");
  const goalId = useId();

  const result = useMemo(
    () => calculateMacros({ dailyCalories, goal }),
    [dailyCalories, goal]
  );

  return (
    <CalculatorToolShell
      title="Macro Calculator"
      subtitle="Split daily calories into protein, carbs, and fat (30/40/30)"
    >
      <CalculatorNumberField
        label="Daily calories (maintenance TDEE)"
        suffix="kcal"
        value={dailyCalories}
        onChange={setDailyCalories}
        min={1200}
        max={5000}
        step={50}
        placeholder="e.g. 2200"
        hint="Use our TDEE calculator to estimate maintenance calories."
      />

      <div>
        <label htmlFor={goalId} className="text-sm font-medium text-foreground">
          Goal
        </label>
        <select
          id={goalId}
          value={goal}
          onChange={(e) => setGoal(e.target.value as MacroGoal)}
          className="mt-2 w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-base font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {(Object.keys(MACRO_GOAL_LABELS) as MacroGoal[]).map((g) => (
            <option key={g} value={g}>
              {MACRO_GOAL_LABELS[g]}
            </option>
          ))}
        </select>
      </div>

      <CalculatorResultsGrid
        items={[
          { label: "Adjusted calories", value: `${result.adjustedCalories} kcal`, highlight: true },
          { label: "Protein (30%)", value: `${result.proteinGrams}g` },
          { label: "Carbs (40%)", value: `${result.carbsGrams}g` },
        ]}
      />

      <div className="rounded-xl bg-muted/50 border border-border/40 p-4 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Fat (30%)</p>
        <p className="mt-1 text-xl font-bold text-foreground">{result.fatGrams}g</p>
      </div>
    </CalculatorToolShell>
  );
}
