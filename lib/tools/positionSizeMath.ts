export interface PositionSizeInput {
  portfolioValue: number;
  riskPercent: number;
  entryPrice: number;
  stopLossPrice: number;
}

export interface PositionSizeResult {
  riskAmount: number;
  riskPerShare: number;
  shares: number;
  positionValue: number;
}

export function calculatePositionSize(input: PositionSizeInput): PositionSizeResult {
  const portfolio = Math.max(0, input.portfolioValue);
  const riskPct = Math.max(0, Math.min(100, input.riskPercent));
  const entry = Math.max(0, input.entryPrice);
  const stop = Math.max(0, input.stopLossPrice);

  const riskAmount = portfolio * (riskPct / 100);
  const riskPerShare = Math.abs(entry - stop);

  if (riskPerShare === 0 || entry === 0) {
    return { riskAmount, riskPerShare: 0, shares: 0, positionValue: 0 };
  }

  const shares = Math.floor(riskAmount / riskPerShare);
  const positionValue = shares * entry;

  return { riskAmount, riskPerShare, shares, positionValue };
}
