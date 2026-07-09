export interface ExpenseRatioInput {
  investmentAmount: number;
  years: number;
  grossReturnPercent: number;
  expenseRatioA: number;
  expenseRatioB: number;
}

export interface ExpenseRatioFundResult {
  netReturnPercent: number;
  futureValue: number;
  totalFees: number;
}

export interface ExpenseRatioResult {
  fundA: ExpenseRatioFundResult;
  fundB: ExpenseRatioFundResult;
  feeDifference: number;
  valueDifference: number;
}

/** Compare two funds with different expense ratios against the same gross return. */
export function calculateExpenseRatio(input: ExpenseRatioInput): ExpenseRatioResult {
  const principal = Math.max(0, input.investmentAmount);
  const years = Math.max(0, input.years);
  const grossReturn = input.grossReturnPercent / 100;

  function fundResult(expenseRatioPercent: number): ExpenseRatioFundResult {
    const netReturnPercent = input.grossReturnPercent - expenseRatioPercent;
    const netRate = netReturnPercent / 100;

    if (principal === 0 || years === 0) {
      return { netReturnPercent, futureValue: principal, totalFees: 0 };
    }

    const futureValueNoFees = principal * Math.pow(1 + grossReturn, years);
    const futureValue = principal * Math.pow(1 + netRate, years);
    const totalFees = futureValueNoFees - futureValue;

    return { netReturnPercent, futureValue, totalFees };
  }

  const fundA = fundResult(input.expenseRatioA);
  const fundB = fundResult(input.expenseRatioB);

  return {
    fundA,
    fundB,
    feeDifference: Math.abs(fundA.totalFees - fundB.totalFees),
    valueDifference: Math.abs(fundA.futureValue - fundB.futureValue),
  };
}
