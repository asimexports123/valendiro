"use client";

import { useId, useMemo, useState } from "react";
import { CalculatorNumberField } from "@/components/tools/CalculatorNumberField";
import { CalculatorResultsGrid, CalculatorToolShell } from "@/components/tools/CalculatorShell";
import { ACTIVITY_OPTIONS, calculateCaloriesBurned } from "@/lib/tools/caloriesBurnedMath";

export function CaloriesBurnedWidget() {
  const [activityId, setActivityId] = useState(ACTIVITY_OPTIONS[0].id);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [weightLbs, setWeightLbs] = useState(170);
  const activitySelectId = useId();

  const result = useMemo(
    () => calculateCaloriesBurned({ activityId, durationMinutes, weightLbs }),
    [activityId, durationMinutes, weightLbs]
  );

  return (
    <CalculatorToolShell
      title="Calories Burned Calculator"
      subtitle="MET-based estimates for common activities — type duration and weight"
    >
      <div>
        <label htmlFor={activitySelectId} className="text-sm font-medium text-foreground">
          Activity
        </label>
        <select
          id={activitySelectId}
          value={activityId}
          onChange={(e) => setActivityId(e.target.value)}
          className="mt-2 w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-base font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {ACTIVITY_OPTIONS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label} (MET {a.met})
            </option>
          ))}
        </select>
      </div>

      <CalculatorNumberField
        label="Duration"
        suffix="min"
        value={durationMinutes}
        onChange={setDurationMinutes}
        min={1}
        max={300}
        step={5}
        placeholder="e.g. 30"
        presets={[
          { label: "15 min", value: 15 },
          { label: "30 min", value: 30 },
          { label: "60 min", value: 60 },
        ]}
      />

      <CalculatorNumberField
        label="Body weight"
        suffix="lbs"
        value={weightLbs}
        onChange={setWeightLbs}
        min={80}
        max={400}
        step={1}
        placeholder="e.g. 170"
      />

      <CalculatorResultsGrid
        items={[
          { label: "Calories burned", value: `${result.caloriesBurned} kcal`, highlight: true },
          { label: "MET value", value: String(result.met) },
          { label: "Activity", value: result.activityLabel },
        ]}
      />
    </CalculatorToolShell>
  );
}
