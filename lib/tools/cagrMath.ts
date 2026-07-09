export interface CagrInput {
  beginningValue: number;
  endingValue: number;
  years: number;
}

export interface CagrResult {
  cagrPercent: number;
  totalGrowthPercent: number;
  absoluteGrowth: number;
}

/** Compound annual growth rate from beginning to ending value. */
export function calculateCagr(input: CagrInput): CagrResult {
  const beginning = Math.max(0, input.beginningValue);
  const ending = Math.max(0, input.endingValue);
  const years = Math.max(0, input.years);

  if (beginning === 0 || years === 0) {
    return { cagrPercent: 0, totalGrowthPercent: 0, absoluteGrowth: ending - beginning };
  }

  const cagrPercent = (Math.pow(ending / beginning, 1 / years) - 1) * 100;
  const absoluteGrowth = ending - beginning;
  const totalGrowthPercent = ((ending - beginning) / beginning) * 100;

  return { cagrPercent, totalGrowthPercent, absoluteGrowth };
}
