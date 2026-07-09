export interface ActivityOption {
  id: string;
  label: string;
  met: number;
}

export const ACTIVITY_OPTIONS: ActivityOption[] = [
  { id: "walking", label: "Walking (3 mph)", met: 3.5 },
  { id: "walking-brisk", label: "Brisk walking (4 mph)", met: 5.0 },
  { id: "jogging", label: "Jogging (5 mph)", met: 8.3 },
  { id: "running", label: "Running (6 mph)", met: 9.8 },
  { id: "cycling", label: "Cycling (moderate)", met: 7.5 },
  { id: "swimming", label: "Swimming (moderate)", met: 6.0 },
  { id: "weightlifting", label: "Weight lifting (moderate)", met: 5.0 },
  { id: "yoga", label: "Yoga", met: 3.0 },
  { id: "hiit", label: "HIIT / vigorous cardio", met: 10.0 },
  { id: "basketball", label: "Basketball", met: 6.5 },
];

export interface CaloriesBurnedInput {
  activityId: string;
  durationMinutes: number;
  weightLbs: number;
}

export interface CaloriesBurnedResult {
  caloriesBurned: number;
  met: number;
  activityLabel: string;
}

export function lbsToKg(lbs: number): number {
  return lbs * 0.453592;
}

/** MET-based calorie burn: kcal = MET × weight(kg) × hours. */
export function calculateCaloriesBurned(input: CaloriesBurnedInput): CaloriesBurnedResult {
  const activity = ACTIVITY_OPTIONS.find((a) => a.id === input.activityId) ?? ACTIVITY_OPTIONS[0];
  const weightKg = lbsToKg(Math.max(0, input.weightLbs));
  const hours = Math.max(0, input.durationMinutes) / 60;

  const caloriesBurned = Math.round(activity.met * weightKg * hours);

  return {
    caloriesBurned,
    met: activity.met,
    activityLabel: activity.label,
  };
}
