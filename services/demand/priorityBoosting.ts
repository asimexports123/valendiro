import { DemandSignal } from "@/lib/types";

export interface BoostFactors {
  searchIntentWeight: number;
  affiliateWeight: number;
  competitionWeight: number;
  seasonalWeight: number;
  trendWeight: number;
}

export const DEFAULT_BOOST_FACTORS: BoostFactors = {
  searchIntentWeight: 0.30,
  affiliateWeight: 0.25,
  competitionWeight: 0.20,
  seasonalWeight: 0.15,
  trendWeight: 0.10,
};

export function calculateBoostedPriorityScore(
  signal: DemandSignal,
  baseScore = 50,
  factors: BoostFactors = DEFAULT_BOOST_FACTORS
): number {
  const boosted =
    baseScore * 0.3 +
    signal.volume_score * factors.searchIntentWeight +
    signal.affiliate_potential_score * factors.affiliateWeight +
    (100 - signal.competition_score) * factors.competitionWeight +
    signal.seasonal_score * factors.seasonalWeight +
    signal.trend_score * factors.trendWeight;

  return Math.min(100, Math.max(0, parseFloat(boosted.toFixed(2))));
}

export function getSeasonalMultiplier(seasonalScore: number): number {
  if (seasonalScore >= 80) return 1.3;
  if (seasonalScore >= 60) return 1.15;
  if (seasonalScore >= 40) return 1.05;
  return 1.0;
}

export function applyPriorityBoost(score: number, seasonalScore: number): number {
  const multiplier = getSeasonalMultiplier(seasonalScore);
  return Math.min(100, parseFloat((score * multiplier).toFixed(2)));
}
