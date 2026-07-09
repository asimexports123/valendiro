export interface CompoundInterestInput {
  principal: number;
  annualReturnPercent: number;
  years: number;
  compoundsPerYear: number;
}

export interface CompoundInterestResult {
  futureValue: number;
  totalInterest: number;
  principal: number;
}

export function calculateCompoundInterest(
  input: CompoundInterestInput
): CompoundInterestResult {
  const principal = Math.max(0, input.principal);
  const years = Math.max(0, input.years);
  const n = Math.max(1, input.compoundsPerYear);

  if (principal === 0 || years === 0) {
    return { futureValue: principal, totalInterest: 0, principal };
  }

  const r = input.annualReturnPercent / 100;
  const futureValue = principal * Math.pow(1 + r / n, n * years);
  const totalInterest = futureValue - principal;

  return { futureValue, totalInterest, principal };
}
