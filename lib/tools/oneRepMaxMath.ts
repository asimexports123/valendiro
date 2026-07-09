export interface OneRepMaxInput {
  weightLifted: number;
  reps: number;
}

export interface OneRepMaxResult {
  estimatedOneRm: number;
  percentOfMax: number;
  trainingPercentages: Array<{ reps: number; weight: number; percent: number }>;
}

/** Epley formula: 1RM = weight × (1 + reps / 30). */
export function calculateOneRepMax(input: OneRepMaxInput): OneRepMaxResult {
  const weight = Math.max(0, input.weightLifted);
  const reps = Math.max(1, Math.min(30, Math.round(input.reps)));

  const estimatedOneRm = Math.round(weight * (1 + reps / 30));
  const percentOfMax = estimatedOneRm > 0 ? Math.round((weight / estimatedOneRm) * 100) : 0;

  const repRanges = [1, 3, 5, 8, 10, 12];
  const trainingPercentages = repRanges.map((r) => {
    const percent = r === 1 ? 100 : Math.round(100 / (1 + r / 30));
    return { reps: r, weight: Math.round(estimatedOneRm * (percent / 100)), percent };
  });

  return { estimatedOneRm, percentOfMax, trainingPercentages };
}
