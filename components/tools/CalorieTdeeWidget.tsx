"use client";

import { useId, useMemo, useState } from "react";
import { CalculatorNumberField } from "@/components/tools/CalculatorNumberField";
import { CalculatorToolShell } from "@/components/tools/CalculatorShell";
import {
  ACTIVITY_LABELS,
  type ActivityLevel,
  calculateCalorieTdee,
  calculateCalorieTdeeMetric,
  type Gender,
} from "@/lib/tools/calorieTdeeMath";

export function CalorieTdeeWidget() {
  const [useMetric, setUseMetric] = useState(false);
  const [age, setAge] = useState(35);
  const [gender, setGender] = useState<Gender>("male");
  const [weightLbs, setWeightLbs] = useState(180);
  const [heightFt, setHeightFt] = useState(5);
  const [heightIn, setHeightIn] = useState(10);
  const [weightKg, setWeightKg] = useState(82);
  const [heightCm, setHeightCm] = useState(178);

  const genderId = useId();
  const activityId = useId();

  const result = useMemo(() => {
    if (useMetric) {
      return calculateCalorieTdeeMetric({ age, gender, weightKg, heightCm });
    }
    return calculateCalorieTdee({ age, gender, weightLbs, heightFt, heightIn });
  }, [useMetric, age, gender, weightLbs, heightFt, heightIn, weightKg, heightCm]);

  const [selectedActivity, setSelectedActivity] = useState<ActivityLevel>("moderate");

  return (
    <CalculatorToolShell
      title="Calorie & TDEE Calculator"
      subtitle="Mifflin-St Jeor BMR and daily calorie needs by activity level"
    >
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setUseMetric(false)}
          className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
            !useMetric
              ? "border-primary bg-primary/10 text-primary"
              : "border-border/50 text-muted-foreground hover:border-primary/40"
          }`}
        >
          US (lbs / ft+in)
        </button>
        <button
          type="button"
          onClick={() => setUseMetric(true)}
          className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
            useMetric
              ? "border-primary bg-primary/10 text-primary"
              : "border-border/50 text-muted-foreground hover:border-primary/40"
          }`}
        >
          Metric (kg / cm)
        </button>
      </div>

      <CalculatorNumberField
        label="Age"
        suffix="years"
        value={age}
        onChange={setAge}
        min={15}
        max={100}
        step={1}
        placeholder="e.g. 35"
      />

      <div>
        <label htmlFor={genderId} className="text-sm font-medium text-foreground">
          Gender
        </label>
        <select
          id={genderId}
          value={gender}
          onChange={(e) => setGender(e.target.value as Gender)}
          className="mt-2 w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-base font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>

      {useMetric ? (
        <>
          <CalculatorNumberField
            label="Weight"
            suffix="kg"
            value={weightKg}
            onChange={setWeightKg}
            min={30}
            max={300}
            step={0.5}
            placeholder="e.g. 82"
          />
          <CalculatorNumberField
            label="Height"
            suffix="cm"
            value={heightCm}
            onChange={setHeightCm}
            min={100}
            max={250}
            step={1}
            placeholder="e.g. 178"
          />
        </>
      ) : (
        <>
          <CalculatorNumberField
            label="Weight"
            suffix="lbs"
            value={weightLbs}
            onChange={setWeightLbs}
            min={70}
            max={500}
            step={1}
            placeholder="e.g. 180"
          />
          <div className="grid grid-cols-2 gap-4">
            <CalculatorNumberField
              label="Height (feet)"
              suffix="ft"
              value={heightFt}
              onChange={setHeightFt}
              min={4}
              max={7}
              step={1}
              placeholder="5"
            />
            <CalculatorNumberField
              label="Height (inches)"
              suffix="in"
              value={heightIn}
              onChange={setHeightIn}
              min={0}
              max={11}
              step={1}
              placeholder="10"
            />
          </div>
        </>
      )}

      <div>
        <label htmlFor={activityId} className="text-sm font-medium text-foreground">
          Activity level
        </label>
        <select
          id={activityId}
          value={selectedActivity}
          onChange={(e) => setSelectedActivity(e.target.value as ActivityLevel)}
          className="mt-2 w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-base font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((level) => (
            <option key={level} value={level}>
              {ACTIVITY_LABELS[level]}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/40 p-5 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">BMR</p>
        <p className="mt-2 text-4xl font-bold text-foreground">{result.bmr.toLocaleString()}</p>
        <p className="mt-1 text-sm text-muted-foreground">calories/day at rest</p>
        <div className="mt-4 border-t border-border/40 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">TDEE</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700 dark:text-emerald-300">
            {result.tdee[selectedActivity].toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">calories/day to maintain weight</p>
        </div>
      </div>
    </CalculatorToolShell>
  );
}
