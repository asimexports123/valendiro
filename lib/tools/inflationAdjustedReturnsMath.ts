export interface InflationAdjustedReturnsInput {
  principal: number;
  nominalReturnPercent: number;
  inflationPercent: number;
  years: number;
}

export interface InflationAdjustedReturnsResult {
  principal: number;
  nominalFutureValue: number;
  realFutureValue: number;
  realReturnPercent: number;
  purchasingPowerLost: number;
}

/** Nominal growth deflated to today's dollars using the Fisher equation. */
export function calculateInflationAdjustedReturns(
  input: InflationAdjustedReturnsInput
): InflationAdjustedReturnsResult {
  const principal = Math.max(0, input.principal);
  const years = Math.max(0, input.years);
  const nominalRate = input.nominalReturnPercent / 100;
  const inflationRate = input.inflationPercent / 100;

  if (principal === 0 || years === 0) {
    return {
      principal,
      nominalFutureValue: principal,
      realFutureValue: principal,
      realReturnPercent: 0,
      purchasingPowerLost: 0,
    };
  }

  const nominalFutureValue = principal * Math.pow(1 + nominalRate, years);
  const realFutureValue = nominalFutureValue / Math.pow(1 + inflationRate, years);
  const realReturnPercent =
    (Math.pow(1 + nominalRate, years) / Math.pow(1 + inflationRate, years) - 1) *
    (100 / years);
  const purchasingPowerLost = nominalFutureValue - realFutureValue;

  return {
    principal,
    nominalFutureValue,
    realFutureValue,
    realReturnPercent,
    purchasingPowerLost,
  };
}
