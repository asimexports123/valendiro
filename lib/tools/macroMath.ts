export type MacroGoal = "lose" | "maintain" | "gain";

export const MACRO_GOAL_ADJUSTMENTS: Record<MacroGoal, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

export const MACRO_GOAL_LABELS: Record<MacroGoal, string> = {
  lose: "Lose weight (~500 cal deficit)",
  maintain: "Maintain weight",
  gain: "Gain weight (~300 cal surplus)",
};

export interface MacroInput {
  dailyCalories: number;
  goal: MacroGoal;
}

export interface MacroResult {
  adjustedCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  proteinCalories: number;
  carbsCalories: number;
  fatCalories: number;
}

/** 30% protein / 40% carbs / 30% fat split on goal-adjusted calories. */
export function calculateMacros(input: MacroInput): MacroResult {
  const base = Math.max(0, input.dailyCalories);
  const adjustedCalories = Math.max(1200, base + MACRO_GOAL_ADJUSTMENTS[input.goal]);

  const proteinCalories = adjustedCalories * 0.3;
  const carbsCalories = adjustedCalories * 0.4;
  const fatCalories = adjustedCalories * 0.3;

  return {
    adjustedCalories: Math.round(adjustedCalories),
    proteinGrams: Math.round(proteinCalories / 4),
    carbsGrams: Math.round(carbsCalories / 4),
    fatGrams: Math.round(fatCalories / 9),
    proteinCalories: Math.round(proteinCalories),
    carbsCalories: Math.round(carbsCalories),
    fatCalories: Math.round(fatCalories),
  };
}
