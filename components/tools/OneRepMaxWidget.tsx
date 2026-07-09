"use client";

import { useMemo, useState } from "react";
import { CalculatorNumberField } from "@/components/tools/CalculatorNumberField";
import { CalculatorResultsGrid, CalculatorToolShell } from "@/components/tools/CalculatorShell";
import { calculateOneRepMax } from "@/lib/tools/oneRepMaxMath";

export function OneRepMaxWidget() {
  const [weightLifted, setWeightLifted] = useState(185);
  const [reps, setReps] = useState(5);

  const result = useMemo(
    () => calculateOneRepMax({ weightLifted, reps }),
    [weightLifted, reps]
  );

  return (
    <CalculatorToolShell
      title="One-Rep Max Calculator"
      subtitle="Epley formula — estimate your 1RM from a submaximal set"
    >
      <CalculatorNumberField
        label="Weight lifted"
        suffix="lbs"
        value={weightLifted}
        onChange={setWeightLifted}
        min={0}
        step={5}
        placeholder="e.g. 185"
        presets={[
          { label: "135 lbs", value: 135 },
          { label: "185 lbs", value: 185 },
          { label: "225 lbs", value: 225 },
        ]}
      />

      <CalculatorNumberField
        label="Reps completed"
        suffix="reps"
        value={reps}
        onChange={setReps}
        min={1}
        max={30}
        step={1}
        placeholder="e.g. 5"
        hint="Best accuracy with 1–10 reps. Avoid training to true failure without a spotter."
      />

      <CalculatorResultsGrid
        items={[
          { label: "Estimated 1RM", value: `${result.estimatedOneRm} lbs`, highlight: true },
          { label: "Set intensity", value: `${result.percentOfMax}% of max` },
          { label: "Formula", value: "Epley" },
        ]}
      />

      <div className="rounded-xl border border-border/40 bg-muted/30 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
          Training weights by rep range
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {result.trainingPercentages.map((t) => (
            <div key={t.reps} className="rounded-lg bg-background border border-border/40 p-2 text-center">
              <p className="text-xs text-muted-foreground">{t.reps} reps</p>
              <p className="text-sm font-bold text-foreground">{t.weight} lbs</p>
            </div>
          ))}
        </div>
      </div>
    </CalculatorToolShell>
  );
}
