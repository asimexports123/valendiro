export type Gender = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very-active";

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  "very-active": 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (desk job, little exercise)",
  light: "Lightly active (1–3 days/week)",
  moderate: "Moderately active (3–5 days/week)",
  active: "Very active (6–7 days/week)",
  "very-active": "Extra active (physical job + training)",
};

export interface CalorieTdeeInput {
  age: number;
  gender: Gender;
  weightLbs: number;
  heightFt: number;
  heightIn: number;
}

export interface CalorieTdeeResult {
  bmr: number;
  tdee: Record<ActivityLevel, number>;
}

export function lbsToKg(lbs: number): number {
  return lbs * 0.453592;
}

export function ftInToCm(ft: number, inches: number): number {
  return (ft * 12 + inches) * 2.54;
}

/** Mifflin-St Jeor BMR and TDEE estimates by activity level. */
export function calculateCalorieTdee(input: CalorieTdeeInput): CalorieTdeeResult {
  const weightKg = lbsToKg(Math.max(0, input.weightLbs));
  const heightCm = ftInToCm(Math.max(0, input.heightFt), Math.max(0, input.heightIn));
  const age = Math.max(0, input.age);

  let bmr: number;
  if (input.gender === "male") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  bmr = Math.round(Math.max(0, bmr));

  const tdee = {} as Record<ActivityLevel, number>;
  for (const level of Object.keys(ACTIVITY_MULTIPLIERS) as ActivityLevel[]) {
    tdee[level] = Math.round(bmr * ACTIVITY_MULTIPLIERS[level]);
  }

  return { bmr, tdee };
}

/** Metric variant for optional toggle. */
export function calculateCalorieTdeeMetric(input: {
  age: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
}): CalorieTdeeResult {
  const weightKg = Math.max(0, input.weightKg);
  const heightCm = Math.max(0, input.heightCm);
  const age = Math.max(0, input.age);

  let bmr: number;
  if (input.gender === "male") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  bmr = Math.round(Math.max(0, bmr));

  const tdee = {} as Record<ActivityLevel, number>;
  for (const level of Object.keys(ACTIVITY_MULTIPLIERS) as ActivityLevel[]) {
    tdee[level] = Math.round(bmr * ACTIVITY_MULTIPLIERS[level]);
  }

  return { bmr, tdee };
}
