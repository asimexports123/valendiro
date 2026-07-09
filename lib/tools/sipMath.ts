export interface SipInput {
  monthlyInvestment: number;
  annualReturnPercent: number;
  years: number;
}

export interface SipResult {
  totalInvested: number;
  estimatedReturns: number;
  maturityAmount: number;
  months: number;
}

/** Future value of monthly SIP (contributions at end of each month). */
export function calculateSip(input: SipInput): SipResult {
  const monthlyInvestment = Math.max(0, input.monthlyInvestment);
  const years = Math.max(0, input.years);
  const months = Math.round(years * 12);

  if (months === 0 || monthlyInvestment === 0) {
    return {
      totalInvested: monthlyInvestment * months,
      estimatedReturns: 0,
      maturityAmount: monthlyInvestment * months,
      months,
    };
  }

  const monthlyRate = input.annualReturnPercent / 12 / 100;

  let maturityAmount: number;
  if (monthlyRate === 0) {
    maturityAmount = monthlyInvestment * months;
  } else {
    maturityAmount =
      monthlyInvestment *
      ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) *
      (1 + monthlyRate);
  }

  const totalInvested = monthlyInvestment * months;
  const estimatedReturns = maturityAmount - totalInvested;

  return {
    totalInvested,
    estimatedReturns,
    maturityAmount,
    months,
  };
}

export function formatCurrency(amount: number, currency: "INR" | "USD"): string {
  const locale = currency === "INR" ? "en-IN" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
