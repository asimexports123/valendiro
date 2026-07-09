export interface PortfolioAllocationInput {
  portfolioValue: number;
  positionValue: number;
  targetAllocationPercent: number;
}

export interface PortfolioAllocationResult {
  currentAllocationPercent: number;
  targetAllocationPercent: number;
  targetPositionValue: number;
  cashToTarget: number;
  action: "buy" | "sell" | "on-target";
}

/** Current allocation vs target and cash needed to rebalance. */
export function calculatePortfolioAllocation(
  input: PortfolioAllocationInput
): PortfolioAllocationResult {
  const portfolioValue = Math.max(0, input.portfolioValue);
  const positionValue = Math.max(0, input.positionValue);
  const targetAllocationPercent = Math.min(100, Math.max(0, input.targetAllocationPercent));

  if (portfolioValue === 0) {
    return {
      currentAllocationPercent: 0,
      targetAllocationPercent,
      targetPositionValue: 0,
      cashToTarget: 0,
      action: "on-target",
    };
  }

  const currentAllocationPercent = (positionValue / portfolioValue) * 100;
  const targetPositionValue = portfolioValue * (targetAllocationPercent / 100);
  const cashToTarget = targetPositionValue - positionValue;

  let action: PortfolioAllocationResult["action"] = "on-target";
  if (Math.abs(cashToTarget) < 1) {
    action = "on-target";
  } else if (cashToTarget > 0) {
    action = "buy";
  } else {
    action = "sell";
  }

  return {
    currentAllocationPercent,
    targetAllocationPercent,
    targetPositionValue,
    cashToTarget,
    action,
  };
}
