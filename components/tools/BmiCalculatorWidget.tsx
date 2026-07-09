"use client";

import { useMemo, useState } from "react";
import { CalculatorNumberField } from "@/components/tools/CalculatorNumberField";
import { CalculatorToolShell } from "@/components/tools/CalculatorShell";
import { bmiCategoryColor, calculateBmi } from "@/lib/tools/bmiMath";

export function BmiCalculatorWidget() {
  const [weightKg, setWeightKg] = useState(70);
  const [heightCm, setHeightCm] = useState(170);

  const result = useMemo(() => calculateBmi({ weightKg, heightCm }), [weightKg, heightCm]);

  return (
    <CalculatorToolShell
      title="BMI Calculator"
      subtitle="Type your weight and height — see your BMI category instantly"
    >
      <CalculatorNumberField
        label="Weight"
        suffix="kg"
        value={weightKg}
        onChange={setWeightKg}
        min={20}
        max={300}
        step={0.5}
        placeholder="e.g. 70"
      />

      <CalculatorNumberField
        label="Height"
        suffix="cm"
        value={heightCm}
        onChange={setHeightCm}
        min={100}
        max={250}
        step={1}
        placeholder="e.g. 170"
      />

      <div className="rounded-xl border border-border/60 bg-muted/40 p-5 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your BMI</p>
        <p className="mt-2 text-4xl font-bold text-foreground">{result.bmi > 0 ? result.bmi : "—"}</p>
        {result.bmi > 0 && (
          <>
            <p className={`mt-2 text-lg font-semibold ${bmiCategoryColor(result.category)}`}>
              {result.category}
            </p>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{result.description}</p>
          </>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        BMI is a screening tool for adults, not a diagnosis. Athletes and some body types may fall
        outside typical ranges without health risk. Consult a clinician for personal advice.
      </p>
    </CalculatorToolShell>
  );
}
