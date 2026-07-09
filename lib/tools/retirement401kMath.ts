export interface Retirement401kInput {
  monthlyContribution: number;
  employerMatchPercent: number;
  yearsToRetire: number;
  annualReturnPercent: number;
}

export interface Retirement401kResult {
  totalEmployeeContributions: number;
  totalEmployerMatch: number;
  totalContributions: number;
  projectedBalance: number;
  investmentGrowth: number;
  months: number;
}

/** Future value of monthly 401(k) contributions with employer match (end-of-month). */
export function calculateRetirement401k(input: Retirement401kInput): Retirement401kResult {
  const monthlyContribution = Math.max(0, input.monthlyContribution);
  const matchRate = Math.max(0, input.employerMatchPercent) / 100;
  const years = Math.max(0, input.yearsToRetire);
  const months = Math.round(years * 12);

  const employeeMonthly = monthlyContribution;
  const employerMonthly = monthlyContribution * matchRate;
  const totalMonthly = employeeMonthly + employerMonthly;

  if (months === 0 || totalMonthly === 0) {
    const totalEmployee = employeeMonthly * months;
    const totalEmployer = employerMonthly * months;
    return {
      totalEmployeeContributions: totalEmployee,
      totalEmployerMatch: totalEmployer,
      totalContributions: totalEmployee + totalEmployer,
      projectedBalance: totalEmployee + totalEmployer,
      investmentGrowth: 0,
      months,
    };
  }

  const monthlyRate = input.annualReturnPercent / 12 / 100;

  let projectedBalance: number;
  if (monthlyRate === 0) {
    projectedBalance = totalMonthly * months;
  } else {
    projectedBalance =
      totalMonthly *
      ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) *
      (1 + monthlyRate);
  }

  const totalEmployeeContributions = employeeMonthly * months;
  const totalEmployerMatch = employerMonthly * months;
  const totalContributions = totalEmployeeContributions + totalEmployerMatch;
  const investmentGrowth = projectedBalance - totalContributions;

  return {
    totalEmployeeContributions,
    totalEmployerMatch,
    totalContributions,
    projectedBalance,
    investmentGrowth,
    months,
  };
}
